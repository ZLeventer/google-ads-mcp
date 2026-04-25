#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { runGaql, runGaqlSchema } from "./tools/gaql.js";
import {
  accountInfo,
  accountInfoSchema,
  listAccounts,
  listAccountsSchema,
} from "./tools/accounts.js";
import {
  adGroupPerformance,
  adGroupPerformanceSchema,
  campaignPerformance,
  campaignPerformanceSchema,
  listCampaigns,
  listCampaignsSchema,
} from "./tools/campaigns.js";
import {
  keywordPerformance,
  keywordPerformanceSchema,
  searchTermsReport,
  searchTermsSchema,
} from "./tools/keywords.js";
import {
  conversionsByCampaign,
  conversionsByCampaignSchema,
  listConversionActions,
  listConversionActionsSchema,
} from "./tools/conversions.js";
import {
  listRsas,
  listRsasSchema,
  rsaAssetPerformance,
  rsaAssetPerformanceSchema,
} from "./tools/adCopy.js";
import {
  listAdGroupAssets,
  listAdGroupAssetsSchema,
  listAssets,
  listAssetsSchema,
} from "./tools/extensions.js";
import {
  listAudiences,
  listAudiencesSchema,
  listCampaignAudiences,
  listCampaignAudiencesSchema,
} from "./tools/audiences.js";
import {
  auctionInsights,
  auctionInsightsSchema,
  devicePerformance,
  devicePerformanceSchema,
  geoPerformance,
  geoPerformanceSchema,
  impressionShare,
  impressionShareSchema,
} from "./tools/performance.js";
import {
  budgetPacing,
  budgetPacingSchema,
  listBudgets,
  listBudgetsSchema,
} from "./tools/budget.js";

const server = new McpServer({
  name: "google-ads-mcp",
  version: "1.0.0",
});

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function err(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return {
    isError: true,
    content: [{ type: "text" as const, text: `Error: ${msg}` }],
  };
}

// ── Core / Accounts ─────────────────────────────────────────────────────────

server.tool(
  "gads_run_gaql",
  "Escape hatch: run any raw GAQL query against Google Ads. Use when preset tools don't cover the report shape you need. Docs: developers.google.com/google-ads/api/docs/query/overview",
  runGaqlSchema,
  async (args) => {
    try { return ok(await runGaql(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_list_accounts",
  "List all Google Ads customer accounts the authenticated user has access to. Useful for finding customer IDs.",
  listAccountsSchema,
  async (args) => {
    try { return ok(await listAccounts(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_account_info",
  "Get basic info for the current Google Ads account: name, currency, timezone, manager flag, status.",
  accountInfoSchema,
  async (args) => {
    try { return ok(await accountInfo(args)); } catch (e) { return err(e); }
  }
);

// ── Campaigns ────────────────────────────────────────────────────────────────

server.tool(
  "gads_list_campaigns",
  "List campaigns in the account with name, status, channel type, bidding strategy, and date range. Filter by status (default ENABLED).",
  listCampaignsSchema,
  async (args) => {
    try { return ok(await listCampaigns(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_campaign_performance",
  "Campaign-level performance: impressions, clicks, CTR, avg CPC, cost, conversions, conv value, CPA, ROAS. Defaults to last 28 days, enabled campaigns, sorted by cost desc.",
  campaignPerformanceSchema,
  async (args) => {
    try { return ok(await campaignPerformance(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_ad_group_performance",
  "Ad group performance with campaign context. Optional campaign_id filter. Default last 28 days, enabled ad groups.",
  adGroupPerformanceSchema,
  async (args) => {
    try { return ok(await adGroupPerformance(args)); } catch (e) { return err(e); }
  }
);

// ── Keywords ─────────────────────────────────────────────────────────────────

server.tool(
  "gads_keyword_performance",
  "Keyword-level performance with match type, quality score, clicks, cost, conversions. Filter by campaign_id or ad_group_id. Default last 28 days, enabled keywords.",
  keywordPerformanceSchema,
  async (args) => {
    try { return ok(await keywordPerformance(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_search_terms_report",
  "Search terms that triggered ads (the actual user queries, not your keywords). Essential for finding wasted spend and negative keyword candidates. Default last 28 days.",
  searchTermsSchema,
  async (args) => {
    try { return ok(await searchTermsReport(args)); } catch (e) { return err(e); }
  }
);

// ── Conversions ───────────────────────────────────────────────────────────────

server.tool(
  "gads_conversions_by_campaign",
  "Conversions and conversion value broken down by campaign × conversion action. Sorted by conversions desc. Default last 28 days.",
  conversionsByCampaignSchema,
  async (args) => {
    try { return ok(await conversionsByCampaign(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_list_conversion_actions",
  "List all conversion actions configured in the account: name, category, type, whether included in Conversions metric, counting type.",
  listConversionActionsSchema,
  async (args) => {
    try { return ok(await listConversionActions(args)); } catch (e) { return err(e); }
  }
);

// ── Ad Copy / RSAs ────────────────────────────────────────────────────────────

server.tool(
  "gads_list_rsas",
  "List Responsive Search Ads with their headlines, descriptions, approval status, and Ad Strength. Filter by campaign_id or ad_group_id.",
  listRsasSchema,
  async (args) => {
    try { return ok(await listRsas(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_rsa_asset_performance",
  "Asset-level performance for RSA headlines and descriptions — shows BEST/GOOD/LOW/LEARNING/PENDING performance labels. Use to identify underperforming creative assets.",
  rsaAssetPerformanceSchema,
  async (args) => {
    try { return ok(await rsaAssetPerformance(args)); } catch (e) { return err(e); }
  }
);

// ── Assets / Extensions ───────────────────────────────────────────────────────

server.tool(
  "gads_list_assets",
  "List account-level assets including sitelinks, callouts, structured snippets, images, and calls. Filter by asset_type.",
  listAssetsSchema,
  async (args) => {
    try { return ok(await listAssets(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_list_ad_group_assets",
  "List assets linked to ad groups (ad-group-level sitelinks, callouts, etc.). Filter by campaign_id or ad_group_id.",
  listAdGroupAssetsSchema,
  async (args) => {
    try { return ok(await listAdGroupAssets(args)); } catch (e) { return err(e); }
  }
);

// ── Audiences ─────────────────────────────────────────────────────────────────

server.tool(
  "gads_list_audiences",
  "List remarketing lists, customer match lists, and in-market/affinity segments available in the account. Shows size range and eligibility.",
  listAudiencesSchema,
  async (args) => {
    try { return ok(await listAudiences(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_list_campaign_audiences",
  "List audiences attached to campaigns with bid modifier and targeting setting. Filter by campaign_id.",
  listCampaignAudiencesSchema,
  async (args) => {
    try { return ok(await listCampaignAudiences(args)); } catch (e) { return err(e); }
  }
);

// ── Performance Analysis ──────────────────────────────────────────────────────

server.tool(
  "gads_geo_performance",
  "Performance broken down by geographic location (country, region, city). Identify top and bottom-performing geos. Filter by campaign_id.",
  geoPerformanceSchema,
  async (args) => {
    try { return ok(await geoPerformance(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_device_performance",
  "Clicks, impressions, cost, conversions, and CPA split by MOBILE / DESKTOP / TABLET. Filter by campaign_id.",
  devicePerformanceSchema,
  async (args) => {
    try { return ok(await devicePerformance(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_impression_share",
  "Search IS, Search Lost IS (Budget), Search Lost IS (Rank), and Display IS per campaign. Identify campaigns losing share to budget or Quality Score.",
  impressionShareSchema,
  async (args) => {
    try { return ok(await impressionShare(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_auction_insights",
  "Auction insights report: impression share, overlap rate, position above rate, outranking share vs. competitors. Filter by campaign_id.",
  auctionInsightsSchema,
  async (args) => {
    try { return ok(await auctionInsights(args)); } catch (e) { return err(e); }
  }
);

// ── Budget ────────────────────────────────────────────────────────────────────

server.tool(
  "gads_list_budgets",
  "List all campaign budgets with daily amount, delivery method (STANDARD/ACCELERATED), period, and number of campaigns sharing each budget.",
  listBudgetsSchema,
  async (args) => {
    try { return ok(await listBudgets(args)); } catch (e) { return err(e); }
  }
);

server.tool(
  "gads_budget_pacing",
  "Cost vs. budget for the current period per campaign with pacing % (cost / expected spend based on days elapsed). Identify over- and under-pacing campaigns.",
  budgetPacingSchema,
  async (args) => {
    try { return ok(await budgetPacing(args)); } catch (e) { return err(e); }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
