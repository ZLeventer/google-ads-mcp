import { z } from "zod";
import { getCustomer } from "../client.js";

export const listRsasSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call"),
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
  ad_group_id: z.string().optional().describe("Filter to a specific ad group ID"),
  limit: z.number().int().positive().max(10000).default(50),
};

export async function listRsas(args: z.infer<z.ZodObject<typeof listRsasSchema>>) {
  const customer = getCustomer(args.customer_id);
  const adGroupClause = args.ad_group_id ? `AND ad_group.id = ${args.ad_group_id}` : "";
  const campaignClause = args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "";
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
    WHERE ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
      ${campaignClause}
      ${adGroupClause}
    LIMIT ${args.limit}
  `);
  return { rowCount: rows.length, rows };
}

export const rsaAssetPerformanceSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call"),
  ad_group_id: z.string().optional().describe("Filter to a specific ad group ID"),
  date_range: z.string().default("LAST_30_DAYS").describe("GAQL date range literal, e.g. LAST_30_DAYS, LAST_7_DAYS, LAST_MONTH"),
};

export async function rsaAssetPerformance(args: z.infer<z.ZodObject<typeof rsaAssetPerformanceSchema>>) {
  const customer = getCustomer(args.customer_id);
  const adGroupClause = args.ad_group_id ? `AND ad_group.id = ${args.ad_group_id}` : "";
  const rows = await customer.query(`
    SELECT
      campaign.name,
      ad_group.id,
      ad_group.name,
      ad_group_ad.ad.id,
      asset.type,
      asset.text_asset.text,
      ad_group_ad_asset_view.field_type,
      ad_group_ad_asset_view.performance_label,
      ad_group_ad_asset_view.pinned_field,
      ad_group_ad_asset_view.enabled
    FROM ad_group_ad_asset_view
    WHERE segments.date DURING ${args.date_range}
      AND asset.type = 'TEXT'
      ${adGroupClause}
    ORDER BY ad_group_ad_asset_view.performance_label ASC
    LIMIT 500
  `);
  return { rowCount: rows.length, rows };
}
