import { z } from "zod";
import { getCustomer } from "../client.js";

export const listRsasSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID (no dashes)"),
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
  ad_group_id: z.string().optional().describe("Filter to a specific ad group ID"),
  limit: z.number().int().positive().max(10000).default(50).describe("Max rows"),
};

export async function listRsas(args: z.infer<z.ZodObject<typeof listRsasSchema>>) {
  const customer = getCustomer(args.customer_id);
  const filters = [
    "ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'",
    args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "",
    args.ad_group_id ? `AND ad_group.id = ${args.ad_group_id}` : "",
  ].filter(Boolean).join(" ");
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.ad.final_urls,
      ad_group_ad.ad_strength,
      ad_group_ad.policy_summary.approval_status,
      ad_group_ad.status
    FROM ad_group_ad
    WHERE ${filters}
    ORDER BY ad_group.name
    LIMIT ${args.limit}
  `);
  return { rowCount: rows.length, rows };
}

export const rsaAssetPerformanceSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID (no dashes)"),
  ad_group_id: z.string().optional().describe("Filter to a specific ad group ID"),
  date_range: z.string().default("LAST_30_DAYS").describe("GAQL date range literal e.g. LAST_30_DAYS, LAST_7_DAYS, THIS_MONTH"),
};

export async function rsaAssetPerformance(args: z.infer<z.ZodObject<typeof rsaAssetPerformanceSchema>>) {
  const customer = getCustomer(args.customer_id);
  const adGroupClause = args.ad_group_id ? `AND ad_group.id = ${args.ad_group_id}` : "";
  const rows = await customer.query(`
    SELECT
      campaign.name,
      ad_group.name,
      ad_group_ad.ad.id,
      asset.id,
      asset.name,
      asset.text_asset.text,
      asset.type,
      ad_group_ad_asset_view.field_type,
      ad_group_ad_asset_view.performance_label,
      ad_group_ad_asset_view.enabled,
      metrics.impressions,
      metrics.clicks
    FROM ad_group_ad_asset_view
    WHERE segments.date DURING ${args.date_range}
      AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
      ${adGroupClause}
    ORDER BY ad_group_ad_asset_view.performance_label, metrics.impressions DESC
    LIMIT 500
  `);
  return { rowCount: rows.length, rows };
}
