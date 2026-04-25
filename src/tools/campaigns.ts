import { z } from "zod";
import { DEFAULT_END, DEFAULT_START, getCustomer, resolveDate } from "../client.js";

const dateRange = {
  start_date: z.string().default(DEFAULT_START).describe("Start date: YYYY-MM-DD, NdaysAgo, yesterday, or today"),
  end_date: z.string().default(DEFAULT_END).describe("End date: YYYY-MM-DD, NdaysAgo, yesterday, or today"),
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call"),
  limit: z.number().int().positive().max(10000).default(50).describe("Max rows to return"),
};

function microsToDollars(micros: number | string | undefined): number {
  const n = Number(micros ?? 0);
  return Number.isFinite(n) ? n / 1_000_000 : 0;
}

export const listCampaignsSchema = {
  status: z.enum(["ENABLED", "PAUSED", "REMOVED", "ALL"]).default("ENABLED").describe("Filter by campaign status"),
  customer_id: z.string().optional(),
  limit: z.number().int().positive().max(10000).default(100),
};

export async function listCampaigns(args: z.infer<z.ZodObject<typeof listCampaignsSchema>>) {
  const customer = getCustomer(args.customer_id);
  const statusClause = args.status === "ALL" ? "" : `WHERE campaign.status = '${args.status}'`;
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.advertising_channel_sub_type,
      campaign.bidding_strategy_type,
      campaign.start_date,
      campaign.end_date
    FROM campaign
    ${statusClause}
    ORDER BY campaign.name
    LIMIT ${args.limit}
  `);
  return { rowCount: rows.length, rows };
}

export const campaignPerformanceSchema = {
  ...dateRange,
  status: z.enum(["ENABLED", "PAUSED", "REMOVED", "ALL"]).default("ENABLED"),
  order_by: z.string().default("cost_micros").describe("Metric to sort by desc: cost_micros, clicks, impressions, conversions, ctr"),
};

export async function campaignPerformance(args: z.infer<z.ZodObject<typeof campaignPerformanceSchema>>) {
  const customer = getCustomer(args.customer_id);
  const start = resolveDate(args.start_date);
  const end = resolveDate(args.end_date);
  const statusClause = args.status === "ALL" ? "" : `AND campaign.status = '${args.status}'`;
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion
    FROM campaign
    WHERE segments.date BETWEEN '${start}' AND '${end}'
      ${statusClause}
    ORDER BY metrics.${args.order_by} DESC
    LIMIT ${args.limit}
  `);
  const enriched = rows.map((r: any) => ({
    ...r,
    metrics: {
      ...r.metrics,
      cost: microsToDollars(r.metrics?.cost_micros),
      average_cpc_dollars: microsToDollars(r.metrics?.average_cpc),
      roas: r.metrics?.cost_micros
        ? Number(r.metrics.conversions_value ?? 0) / microsToDollars(r.metrics.cost_micros)
        : 0,
    },
  }));
  return { rowCount: enriched.length, rows: enriched };
}

export const adGroupPerformanceSchema = {
  ...dateRange,
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
  status: z.enum(["ENABLED", "PAUSED", "REMOVED", "ALL"]).default("ENABLED"),
};

export async function adGroupPerformance(args: z.infer<z.ZodObject<typeof adGroupPerformanceSchema>>) {
  const customer = getCustomer(args.customer_id);
  const start = resolveDate(args.start_date);
  const end = resolveDate(args.end_date);
  const campaignClause = args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "";
  const statusClause = args.status === "ALL" ? "" : `AND ad_group.status = '${args.status}'`;
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      ad_group.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM ad_group
    WHERE segments.date BETWEEN '${start}' AND '${end}'
      ${campaignClause}
      ${statusClause}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${args.limit}
  `);
  return { rowCount: rows.length, rows };
}
