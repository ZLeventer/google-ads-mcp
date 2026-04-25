import { z } from "zod";
import { getCustomer } from "../client.js";

function microsToDollars(micros: number | string | undefined): number {
  const n = Number(micros ?? 0);
  return Number.isFinite(n) ? n / 1_000_000 : 0;
}

export const listBudgetsSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID (no dashes)"),
};

export async function listBudgets(args: z.infer<z.ZodObject<typeof listBudgetsSchema>>) {
  const customer = getCustomer(args.customer_id);
  const rows = await customer.query(`
    SELECT
      campaign_budget.id,
      campaign_budget.name,
      campaign_budget.amount_micros,
      campaign_budget.delivery_method,
      campaign_budget.period,
      campaign_budget.total_amount_micros,
      campaign_budget.reference_count,
      campaign_budget.status,
      campaign_budget.explicitly_shared
    FROM campaign_budget
    WHERE campaign_budget.status = 'ENABLED'
    ORDER BY campaign_budget.amount_micros DESC
  `);
  const enriched = rows.map((r: any) => ({
    ...r,
    campaign_budget: {
      ...r.campaign_budget,
      amount_dollars: microsToDollars(r.campaign_budget?.amount_micros),
      total_amount_dollars: r.campaign_budget?.total_amount_micros
        ? microsToDollars(r.campaign_budget.total_amount_micros)
        : null,
    },
  }));
  return { rowCount: enriched.length, rows: enriched };
}

export const budgetPacingSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID (no dashes)"),
  date_range: z.string().default("THIS_MONTH").describe("GAQL literal: THIS_MONTH, LAST_30_DAYS, LAST_7_DAYS"),
};

export async function budgetPacing(args: z.infer<z.ZodObject<typeof budgetPacingSchema>>) {
  const customer = getCustomer(args.customer_id);
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.id,
      campaign_budget.name,
      campaign_budget.amount_micros,
      campaign_budget.delivery_method,
      metrics.cost_micros
    FROM campaign
    WHERE segments.date DURING ${args.date_range}
      AND campaign.status = 'ENABLED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `);

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const elapsedFraction = dayOfMonth / daysInMonth;

  const enriched = rows.map((r: any) => {
    const budgetDollars = microsToDollars(r.campaign_budget?.amount_micros);
    const costDollars = microsToDollars(r.metrics?.cost_micros);
    const expectedSpend = budgetDollars * elapsedFraction;
    const pacingPct = expectedSpend > 0 ? (costDollars / expectedSpend) * 100 : null;
    return {
      campaign_id: r.campaign?.id,
      campaign_name: r.campaign?.name,
      budget_dollars: budgetDollars,
      cost_dollars: costDollars,
      expected_spend_dollars: Number(expectedSpend.toFixed(2)),
      pacing_pct: pacingPct !== null ? Number(pacingPct.toFixed(1)) : null,
      delivery_method: r.campaign_budget?.delivery_method,
      days_elapsed: dayOfMonth,
      days_in_period: daysInMonth,
    };
  });
  return { rowCount: enriched.length, rows: enriched };
}
