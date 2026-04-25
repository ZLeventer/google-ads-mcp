import { z } from "zod";
import { getCustomer } from "../client.js";

export const listAssetsSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID (no dashes)"),
  asset_type: z.string().optional().describe("Filter by asset type: SITELINK, CALLOUT, STRUCTURED_SNIPPET, IMAGE, CALL, TEXT"),
  limit: z.number().int().positive().max(10000).default(100).describe("Max rows"),
};

export async function listAssets(args: z.infer<z.ZodObject<typeof listAssetsSchema>>) {
  const customer = getCustomer(args.customer_id);
  const typeClause = args.asset_type ? `WHERE asset.type = '${args.asset_type}'` : "";
  const rows = await customer.query(`
    SELECT
      asset.id,
      asset.name,
      asset.type,
      asset.final_urls,
      asset.sitelink_asset.link_text,
      asset.sitelink_asset.description1,
      asset.sitelink_asset.description2,
      asset.callout_asset.callout_text,
      asset.structured_snippet_asset.header,
      asset.structured_snippet_asset.values,
      asset.text_asset.text,
      asset.image_asset.full_size.url
    FROM asset
    ${typeClause}
    ORDER BY asset.type, asset.name
    LIMIT ${args.limit}
  `);
  return { rowCount: rows.length, rows };
}

export const listAdGroupAssetsSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID (no dashes)"),
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
  ad_group_id: z.string().optional().describe("Filter to a specific ad group ID"),
};

export async function listAdGroupAssets(args: z.infer<z.ZodObject<typeof listAdGroupAssetsSchema>>) {
  const customer = getCustomer(args.customer_id);
  const filters = [
    args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "",
    args.ad_group_id ? `AND ad_group.id = ${args.ad_group_id}` : "",
  ].filter(Boolean).join(" ");
  const whereClause = filters ? `WHERE 1=1 ${filters}` : "";
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      ad_group_asset.asset,
      ad_group_asset.field_type,
      ad_group_asset.status,
      asset.id,
      asset.name,
      asset.type,
      asset.sitelink_asset.link_text,
      asset.callout_asset.callout_text
    FROM ad_group_asset
    ${whereClause}
    ORDER BY campaign.name, ad_group.name
    LIMIT 500
  `);
  return { rowCount: rows.length, rows };
}
