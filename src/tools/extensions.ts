import { z } from "zod";
import { getCustomer } from "../client.js";

export const listAssetsSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call"),
  asset_type: z.string().optional().describe("Filter by asset type: SITELINK, CALLOUT, STRUCTURED_SNIPPET, IMAGE, CALL, etc."),
  limit: z.number().int().positive().max(10000).default(100),
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
      asset.image_asset.full_size.url,
      asset.policy_summary.approval_status
    FROM asset
    ${typeClause}
    ORDER BY asset.name
    LIMIT ${args.limit}
  `);
  return { rowCount: rows.length, rows };
}

export const campaignAssetsSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call"),
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
};

export async function campaignAssets(args: z.infer<z.ZodObject<typeof campaignAssetsSchema>>) {
  const customer = getCustomer(args.customer_id);
  const campaignClause = args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "";
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      asset.id,
      asset.name,
      asset.type,
      asset.sitelink_asset.link_text,
      asset.callout_asset.callout_text,
      asset.structured_snippet_asset.header,
      campaign_asset.status,
      campaign_asset.field_type
    FROM campaign_asset
    WHERE campaign_asset.status != 'REMOVED'
      ${campaignClause}
    ORDER BY campaign.name
    LIMIT 500
  `);
  return { rowCount: rows.length, rows };
}
