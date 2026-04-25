import { GoogleAdsApi, Customer } from "google-ads-api";

export class GoogleAdsError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "GoogleAdsError";
  }
}

let cachedApi: GoogleAdsApi | null = null;

function getApi(): GoogleAdsApi {
  if (cachedApi) return cachedApi;
  const developer_token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const client_id = process.env.GOOGLE_ADS_CLIENT_ID;
  const client_secret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!developer_token) throw new GoogleAdsError("GOOGLE_ADS_DEVELOPER_TOKEN is not set");
  if (!client_id) throw new GoogleAdsError("GOOGLE_ADS_CLIENT_ID is not set");
  if (!client_secret) throw new GoogleAdsError("GOOGLE_ADS_CLIENT_SECRET is not set");
  cachedApi = new GoogleAdsApi({ client_id, client_secret, developer_token });
  return cachedApi;
}

export function getCustomer(override?: string): Customer {
  const refresh_token = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!refresh_token) throw new GoogleAdsError("GOOGLE_ADS_REFRESH_TOKEN is not set");
  const customer_id = (override ?? process.env.GOOGLE_ADS_CUSTOMER_ID ?? "").replace(/-/g, "");
  if (!customer_id) throw new GoogleAdsError("GOOGLE_ADS_CUSTOMER_ID is not set and no customer_id was passed");
  const login_customer_id = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "") || undefined;
  return getApi().Customer({ customer_id, login_customer_id, refresh_token });
}

export function listAccessibleCustomers(): Promise<string[]> {
  const refresh_token = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!refresh_token) throw new GoogleAdsError("GOOGLE_ADS_REFRESH_TOKEN is not set");
  return getApi().listAccessibleCustomers(refresh_token).then((r) => r.resource_names ?? []);
}

export const DEFAULT_START = "28daysAgo";
export const DEFAULT_END = "yesterday";

export function resolveDate(d: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  if (d === "today") return toISO(new Date());
  if (d === "yesterday") return toISO(offsetDays(new Date(), -1));
  const m = d.match(/^(\d+)daysAgo$/);
  if (m) return toISO(offsetDays(new Date(), -parseInt(m[1], 10)));
  throw new GoogleAdsError(`Unrecognized date: ${d}. Use YYYY-MM-DD, today, yesterday, or NdaysAgo.`);
}

function offsetDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
