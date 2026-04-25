import { z } from "zod";
import { getCustomer, listAccessibleCustomers } from "../client.js";

export const listAccountsSchema = {};

export async function listAccounts(_args: Record<string, never>) {
  const resourceNames = await listAccessibleCustomers();
  return {
    count: resourceNames.length,
    accounts: resourceNames.map((rn) => ({
      resource_name: rn,
      customer_id: rn.replace("customers/", ""),
    })),
  };
}

export const accountInfoSchema = {
  customer_id: z.string().optional().describe("Override GOOGLE_ADS_CUSTOMER_ID for this call (no dashes)"),
};

export async function accountInfo(args: z.infer<z.ZodObject<typeof accountInfoSchema>>) {
  const customer = getCustomer(args.customer_id);
  const rows = await customer.query(`
    SELECT
      customer.id,
      customer.descriptive_name,
      customer.currency_code,
      customer.time_zone,
      customer.auto_tagging_enabled,
      customer.manager,
      customer.test_account,
      customer.status
    FROM customer
    LIMIT 1
  `);
  return rows[0] ?? null;
}
