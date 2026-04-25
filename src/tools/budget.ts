import { z } from "zod";
import { DEFAULT_END, DEFAULT_START, getCustomer, resolveDate } from "../client.js";

function microsToDollars(micros: number | string | undefined): number {
  const n = Number(micros ?? 0);
  return Number.isFinite(n) ? n / 1_000_000 : 0;
}

export const listBudgetsSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call"),
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
      campaign_budget.status,
      campaign_budget.type,
      campaign_budget.total_amount_micros,
      campaign_budget.reference_count,
      campaign_budget.has_recommended_budget,
      campaign_budget.recommended_budget_amount_micros
    FROM campaign_budget
    WHERE campaign_budget.status = 'ENABLED'
    ORDER BY campaign_budget.amount_micros DESC
    LIMIT 200
  `);
  const enriched = rows.map((r: any) => ({
    ...r,
    campaign_budget: {
      ...r.campaign_budget,
      amount_dollars: microsToDollars(r.campaign_budget?.amount_micros),
      recommended_budget_dollars: microsToDollars(r.campaign_budget?.recommended_budget_amount_micros),
    },
  }));
  return { rowCount: enriched.length, rows: enriched };
}

export const budgetPacingSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call"),
  start_date: z.string().default(DEFAULT_START).describe("Start date: YYYY-MM-DD, NdaysAgo, yesterday, or today"),
  end_date: z.string().default(DEFAULT_END).describe("End date: YYYY-MM-DD, NdaysAgo, yesterday, or today"),
};

export async function budgetPacing(args: z.infer<z.ZodObject<typeof budgetPacingSchema>>) {
  const customer = getCustomer(args.customer_id);
  const start = resolveDate(args.start_date);
  const end = resolveDate(args.end_date);
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.id,
      campaign_budget.name,
      campaign_budget.amount_micros,
      campaign_budget.delivery_method,
      campaign_budget.period,
      metrics.cost_micros
    FROM campaign
    WHERE segments.date BETWEEN '${start}' AND '${end}'
      AND campaign.status = 'ENABLED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 200
  `);
  const enriched = rows.map((r: any) => {
    const budget = microsToDollars(r.campaign_budget?.amount_micros);
    const spent = microsToDollars(r.metrics?.cost_micros);
    const pct = budget > 0 ? (spent / budget) * 100 : null;
    return {
      ...r,
      pacing: {
        budget_dollars: budget,
        spent_dollars: spent,
        utilization_pct: pct !== null ? Number(pct.toFixed(1)) : null,
      },
    };
  });
  return { rowCount: enriched.length, rows: enriched };
}
