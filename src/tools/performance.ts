import { z } from "zod";
import { DEFAULT_END, DEFAULT_START, getCustomer, resolveDate } from "../client.js";

const baseArgs = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call"),
  start_date: z.string().default(DEFAULT_START).describe("Start date: YYYY-MM-DD, NdaysAgo, yesterday, or today"),
  end_date: z.string().default(DEFAULT_END).describe("End date: YYYY-MM-DD, NdaysAgo, yesterday, or today"),
};

export const geoPerformanceSchema = {
  ...baseArgs,
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
  limit: z.number().int().positive().max(10000).default(100),
};

export async function geoPerformance(args: z.infer<z.ZodObject<typeof geoPerformanceSchema>>) {
  const customer = getCustomer(args.customer_id);
  const start = resolveDate(args.start_date);
  const end = resolveDate(args.end_date);
  const campaignClause = args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "";
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      geographic_view.country_criterion_id,
      geographic_view.location_type,
      segments.geo_target_city,
      segments.geo_target_region,
      segments.geo_target_country,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM geographic_view
    WHERE segments.date BETWEEN '${start}' AND '${end}'
      ${campaignClause}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${args.limit}
  `);
  return { rowCount: rows.length, rows };
}

export const devicePerformanceSchema = {
  ...baseArgs,
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
};

export async function devicePerformance(args: z.infer<z.ZodObject<typeof devicePerformanceSchema>>) {
  const customer = getCustomer(args.customer_id);
  const start = resolveDate(args.start_date);
  const end = resolveDate(args.end_date);
  const campaignClause = args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "";
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      segments.device,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion
    FROM campaign
    WHERE segments.date BETWEEN '${start}' AND '${end}'
      ${campaignClause}
    ORDER BY campaign.name, segments.device
    LIMIT 500
  `);
  return { rowCount: rows.length, rows };
}

export const impressionShareSchema = {
  ...baseArgs,
};

export async function impressionShare(args: z.infer<z.ZodObject<typeof impressionShareSchema>>) {
  const customer = getCustomer(args.customer_id);
  const start = resolveDate(args.start_date);
  const end = resolveDate(args.end_date);
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.advertising_channel_type,
      metrics.search_impression_share,
      metrics.search_budget_lost_impression_share,
      metrics.search_rank_lost_impression_share,
      metrics.search_exact_match_impression_share,
      metrics.content_impression_share,
      metrics.content_budget_lost_impression_share,
      metrics.content_rank_lost_impression_share
    FROM campaign
    WHERE segments.date BETWEEN '${start}' AND '${end}'
      AND campaign.status = 'ENABLED'
    ORDER BY metrics.search_impression_share ASC
    LIMIT 200
  `);
  return { rowCount: rows.length, rows };
}

export const auctionInsightsSchema = {
  ...baseArgs,
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
};

export async function auctionInsights(args: z.infer<z.ZodObject<typeof auctionInsightsSchema>>) {
  const customer = getCustomer(args.customer_id);
  const start = resolveDate(args.start_date);
  const end = resolveDate(args.end_date);
  const campaignClause = args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "";
  const rows = await customer.query(`
    SELECT
      auction_insight.domain,
      segments.auction_insight_domain,
      campaign.id,
      campaign.name,
      metrics.auction_insight_search_impression_share,
      metrics.auction_insight_search_overlap_rate,
      metrics.auction_insight_search_outranking_share,
      metrics.auction_insight_search_position_above_rate,
      metrics.auction_insight_search_top_impression_percentage,
      metrics.auction_insight_search_absolute_top_impression_percentage
    FROM auction_insight
    WHERE segments.date BETWEEN '${start}' AND '${end}'
      ${campaignClause}
    ORDER BY metrics.auction_insight_search_impression_share DESC
    LIMIT 200
  `);
  return { rowCount: rows.length, rows };
}
