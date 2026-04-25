import { z } from "zod";
import { DEFAULT_END, DEFAULT_START, getCustomer, resolveDate } from "../client.js";

const dateRange = {
  start_date: z.string().default(DEFAULT_START),
  end_date: z.string().default(DEFAULT_END),
  customer_id: z.string().optional(),
  limit: z.number().int().positive().max(10000).default(100),
};

export const keywordPerformanceSchema = {
  ...dateRange,
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
  ad_group_id: z.string().optional().describe("Filter to a specific ad group ID"),
  status: z.enum(["ENABLED", "PAUSED", "REMOVED", "ALL"]).default("ENABLED"),
};

export async function keywordPerformance(args: z.infer<z.ZodObject<typeof keywordPerformanceSchema>>) {
  const customer = getCustomer(args.customer_id);
  const start = resolveDate(args.start_date);
  const end = resolveDate(args.end_date);
  const filters = [
    args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "",
    args.ad_group_id ? `AND ad_group.id = ${args.ad_group_id}` : "",
    args.status === "ALL" ? "" : `AND ad_group_criterion.status = '${args.status}'`,
  ].filter(Boolean).join(" ");
  const rows = await customer.query(`
    SELECT
      campaign.name,
      ad_group.name,
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.quality_info.quality_score,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM keyword_view
    WHERE segments.date BETWEEN '${start}' AND '${end}'
      ${filters}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${args.limit}
  `);
  return { rowCount: rows.length, rows };
}

export const searchTermsSchema = {
  ...dateRange,
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
  min_impressions: z.number().int().nonnegative().default(0).describe("Minimum impressions threshold"),
};

export async function searchTermsReport(args: z.infer<z.ZodObject<typeof searchTermsSchema>>) {
  const customer = getCustomer(args.customer_id);
  const start = resolveDate(args.start_date);
  const end = resolveDate(args.end_date);
  const filters = [
    args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "",
    args.min_impressions > 0 ? `AND metrics.impressions >= ${args.min_impressions}` : "",
  ].filter(Boolean).join(" ");
  const rows = await customer.query(`
    SELECT
      campaign.name,
      ad_group.name,
      search_term_view.search_term,
      search_term_view.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM search_term_view
    WHERE segments.date BETWEEN '${start}' AND '${end}'
      ${filters}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${args.limit}
  `);
  return { rowCount: rows.length, rows };
}
