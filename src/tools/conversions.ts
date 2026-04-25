import { z } from "zod";
import { DEFAULT_END, DEFAULT_START, getCustomer, resolveDate } from "../client.js";

export const conversionsByCampaignSchema = {
  start_date: z.string().default(DEFAULT_START),
  end_date: z.string().default(DEFAULT_END),
  customer_id: z.string().optional(),
  limit: z.number().int().positive().max(10000).default(100),
};

export async function conversionsByCampaign(args: z.infer<z.ZodObject<typeof conversionsByCampaignSchema>>) {
  const customer = getCustomer(args.customer_id);
  const start = resolveDate(args.start_date);
  const end = resolveDate(args.end_date);
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      segments.conversion_action_name,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion,
      metrics.value_per_conversion
    FROM campaign
    WHERE segments.date BETWEEN '${start}' AND '${end}'
      AND metrics.conversions > 0
    ORDER BY metrics.conversions DESC
    LIMIT ${args.limit}
  `);
  return { rowCount: rows.length, rows };
}

export const listConversionActionsSchema = {
  customer_id: z.string().optional(),
  status: z.enum(["ENABLED", "REMOVED", "HIDDEN", "ALL"]).default("ENABLED"),
};

export async function listConversionActions(args: z.infer<z.ZodObject<typeof listConversionActionsSchema>>) {
  const customer = getCustomer(args.customer_id);
  const statusClause = args.status === "ALL" ? "" : `WHERE conversion_action.status = '${args.status}'`;
  const rows = await customer.query(`
    SELECT
      conversion_action.id,
      conversion_action.name,
      conversion_action.status,
      conversion_action.category,
      conversion_action.type,
      conversion_action.include_in_conversions_metric,
      conversion_action.counting_type,
      conversion_action.primary_for_goal
    FROM conversion_action
    ${statusClause}
    ORDER BY conversion_action.name
  `);
  return { rowCount: rows.length, rows };
}
