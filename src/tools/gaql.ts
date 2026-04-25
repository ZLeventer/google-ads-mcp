import { z } from "zod";
import { getCustomer } from "../client.js";

export const runGaqlSchema = {
  query: z.string().describe(
    "Raw GAQL query. Example: SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros FROM campaign WHERE segments.date DURING LAST_30_DAYS ORDER BY metrics.cost_micros DESC LIMIT 50"
  ),
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call (no dashes)"),
};

export async function runGaql(args: z.infer<z.ZodObject<typeof runGaqlSchema>>) {
  const customer = getCustomer(args.customer_id);
  const rows = await customer.query(args.query);
  return { rowCount: rows.length, rows };
}
