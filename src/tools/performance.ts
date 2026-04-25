import { z } from "zod";
import { DEFAULT_END, DEFAULT_START, getCustomer, resolveDate } from "../client.js";

const dateRange = {
  start_date: z.string().default(DEFAULT_START).describe("Start date: YYYY-MM-DD, NdaysAgo, yesterday, or today"),
  end_date: z.string().default(DEFAULT_END).describe("End date: YYYY-MM-DD, NdaysAgo, yesterday, or today"),
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID (no dashes)"),
};

function microsToDollars(micros: number | string | undefined): number {
  const n = Number(micros ?? 0);
  return Number.isFinite(n) ? n / 1_000_000 : 0;
}

export const geoPerformanceSchema = {
  ...dateRange,
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
  date_range: z.string().default("LAST_30_DAYS").describe("GAQL literal e.g. LAST_30_DAYS, LAST_7_DAYS"),
  limit: z.number().int().positive().max(10000).default(100).describe("Max rows"),
};

export async function geoPerformance(args: z.infer<z.ZodObject<typeof geoPerformanceSchema>>) {
  const customer = getCustomer(args.customer_id);
  const campaignClause = args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "";
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      geographic_view.location_type,
      geographic_view.country_criterion_id,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM geographic_view
    WHERE segments.date DURING ${args.date_range}
      ${campaignClause}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${args.limit}
  `);
  const enriched = rows.map((r: any) => ({
    ...r,
    metrics: {
      ...r.metrics,
      cost: microsToDollars(r.metrics?.cost_micros),
    },
  }));
  return { rowCount: enriched.length, rows: enriched };
}

export const devicePerformanceSchema = {
  ...dateRange,
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
  date_range: z.string().default("LAST_30_DAYS").describe("GAQL literal e.g. LAST_30_DAYS, LAST_7_DAYS"),
};

export async function devicePerformance(args: z.infer<z.ZodObject<typeof devicePerformanceSchema>>) {
  const customer = getCustomer(args.customer_id);
  const campaignClause = args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "";
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      segments.device,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion
    FROM campaign
    WHERE segments.date DURING ${args.date_range}
      ${campaignClause}
    ORDER BY campaign.name, segments.device
  `);
  const enriched = rows.map((r: any) => ({
    ...r,
    metrics: {
      ...r.metrics,
      cost: microsToDollars(r.metrics?.cost_micros),
      cpa: microsToDollars(r.metrics?.cost_per_conversion),
    },
  }));
  return { rowCount: enriched.length, rows: enriched };
}

export const impressionShareSchema = {
  ...dateRange,
  date_range: z.string().default("LAST_30_DAYS").describe("GAQL literal e.g. LAST_30_DAYS, LAST_7_DAYS"),
};

export async function impressionShare(args: z.infer<z.ZodObject<typeof impressionShareSchema>>) {
  const customer = getCustomer(args.customer_id);
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.advertising_channel_type,
      metrics.search_impression_share,
      metrics.search_budget_lost_impression_share,
      metrics.search_rank_lost_impression_share,
      metrics.content_impression_share,
      metrics.content_budget_lost_impression_share,
      metrics.content_rank_lost_impression_share,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros
    FROM campaign
    WHERE segments.date DURING ${args.date_range}
      AND campaign.status = 'ENABLED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `);
  const enriched = rows.map((r: any) => ({
    ...r,
    metrics: {
      ...r.metrics,
      cost: microsToDollars(r.metrics?.cost_micros),
    },
  }));
  return { rowCount: enriched.length, rows: enriched };
}

export const auctionInsightsSchema = {
  ...dateRange,
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
  date_range: z.string().default("LAST_30_DAYS").describe("GAQL literal e.g. LAST_30_DAYS, LAST_7_DAYS"),
};

export async function auctionInsights(args: z.infer<z.ZodObject<typeof auctionInsightsSchema>>) {
  const customer = getCustomer(args.customer_id);
  const campaignClause = args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "";
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      auction_insight.domain,
      metrics.auction_insight_search_impression_share,
      metrics.auction_insight_search_overlap_rate,
      metrics.auction_insight_search_position_above_rate,
      metrics.auction_insight_search_top_impression_percentage,
      metrics.auction_insight_search_abs_top_impression_percentage,
      metrics.auction_insight_search_outranking_share
    FROM auction_insight
    WHERE segments.date DURING ${args.date_range}
      ${campaignClause}
    ORDER BY metrics.auction_insight_search_impression_share DESC
    LIMIT 200
  `);
  return { rowCount: rows.length, rows };
}
