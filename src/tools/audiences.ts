import { z } from "zod";
import { getCustomer } from "../client.js";

export const listAudiencesSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call"),
  limit: z.number().int().positive().max(10000).default(100),
};

export async function listAudiences(args: z.infer<z.ZodObject<typeof listAudiencesSchema>>) {
  const customer = getCustomer(args.customer_id);
  const rows = await customer.query(`
    SELECT
      user_list.id,
      user_list.name,
      user_list.description,
      user_list.type,
      user_list.membership_status,
      user_list.size_for_display,
      user_list.size_for_search,
      user_list.eligible_for_search,
      user_list.eligible_for_display,
      user_list.match_rate_percentage
    FROM user_list
    WHERE user_list.membership_status = 'OPEN'
    ORDER BY user_list.size_for_search DESC
    LIMIT ${args.limit}
  `);
  return { rowCount: rows.length, rows };
}

export const campaignAudienceTargetingSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call"),
  campaign_id: z.string().optional().describe("Filter to a specific campaign ID"),
};

export async function campaignAudienceTargeting(args: z.infer<z.ZodObject<typeof campaignAudienceTargetingSchema>>) {
  const customer = getCustomer(args.customer_id);
  const campaignClause = args.campaign_id ? `AND campaign.id = ${args.campaign_id}` : "";
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign_criterion.criterion_id,
      campaign_criterion.type,
      campaign_criterion.bid_modifier,
      campaign_criterion.negative,
      campaign_criterion.user_list.user_list
    FROM campaign_criterion
    WHERE campaign_criterion.type = 'USER_LIST'
      AND campaign_criterion.status != 'REMOVED'
      ${campaignClause}
    ORDER BY campaign.name
    LIMIT 500
  `);
  return { rowCount: rows.length, rows };
}
