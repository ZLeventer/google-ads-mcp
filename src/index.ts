#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { runGaql, runGaqlSchema } from "./tools/gaql.js";
import { accountInfo, accountInfoSchema, listAccounts, listAccountsSchema } from "./tools/accounts.js";
import {
  adGroupPerformance,
  adGroupPerformanceSchema,
  campaignPerformance,
  campaignPerformanceSchema,
  listCampaigns,
  listCampaignsSchema,
} from "./tools/campaigns.js";
import { keywordPerformance, keywordPerformanceSchema, searchTermsReport, searchTermsSchema } from "./tools/keywords.js";
import {
  conversionsByCampaign,
  conversionsByCampaignSchema,
  listConversionActions,
  listConversionActionsSchema,
} from "./tools/conversions.js";
import { listRsas, listRsasSchema, rsaAssetPerformance, rsaAssetPerformanceSchema } from "./tools/adCopy.js";
import { campaignAssets, campaignAssetsSchema, listAssets, listAssetsSchema } from "./tools/extensions.js";
import {
  campaignAudienceTargeting,
  campaignAudienceTargetingSchema,
  listAudiences,
  listAudiencesSchema,
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
import { budgetPacing, budgetPacingSchema, listBudgets, listBudgetsSchema } from "./tools/budget.js";

const server = new McpServer({
  name: "google-ads-mcp",
  version: "1.0.0",
});

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function err(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return { isError: true, content: [{ type: "text" as const, text: `Error: ${msg}` }] };
}

// ── Core ──────────────────────────────────────────────────────────────────────

server.tool(
  "gads_run_gaql",
  "Escape hatch: run any raw GAQL query against Google Ads. Use when preset tools don't cover the report shape you need. Docs: developers.google.com/google-ads/api/docs/query/overview",
  runGaqlSchema,
  async (args) => { try { return ok(await runGaql(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_list_accounts",
  "List all Google Ads customer accounts the authenticated user has access to. Useful for finding customer IDs.",
  listAccountsSchema,
  async (args) => { try { return ok(await listAccounts(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_account_info",
  "Get basic info for the current Google Ads account: name, currency, timezone, manager flag, status.",
  accountInfoSchema,
  async (args) => { try { return ok(await accountInfo(args)); } catch (e) { return err(e); } }
);

// ── Campaigns ─────────────────────────────────────────────────────────────────

server.tool(
  "gads_list_campaigns",
  "List campaigns in the account with name, status, channel type, bidding strategy, and date range. Filter by status (default ENABLED).",
  listCampaignsSchema,
  async (args) => { try { return ok(await listCampaigns(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_campaign_performance",
  "Campaign-level performance: impressions, clicks, CTR, avg CPC, cost, conversions, conv value, CPA, ROAS. Defaults to last 28 days, enabled campaigns, sorted by cost desc.",
  campaignPerformanceSchema,
  async (args) => { try { return ok(await campaignPerformance(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_ad_group_performance",
  "Ad group performance with campaign context. Optional campaign_id filter. Default last 28 days, enabled ad groups.",
  adGroupPerformanceSchema,
  async (args) => { try { return ok(await adGroupPerformance(args)); } catch (e) { return err(e); } }
);

// ── Keywords ──────────────────────────────────────────────────────────────────

server.tool(
  "gads_keyword_performance",
  "Keyword-level performance with match type, quality score, clicks, cost, conversions. Filter by campaign_id or ad_group_id. Default last 28 days, enabled keywords.",
  keywordPerformanceSchema,
  async (args) => { try { return ok(await keywordPerformance(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_search_terms_report",
  "Search terms that triggered ads (the actual user queries, not your keywords). Essential for finding wasted spend and negative keyword candidates. Default last 28 days.",
  searchTermsSchema,
  async (args) => { try { return ok(await searchTermsReport(args)); } catch (e) { return err(e); } }
);

// ── Conversions ───────────────────────────────────────────────────────────────

server.tool(
  "gads_conversions_by_campaign",
  "Conversions and conversion value broken down by campaign × conversion action. Sorted by conversions desc. Default last 28 days.",
  conversionsByCampaignSchema,
  async (args) => { try { return ok(await conversionsByCampaign(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_list_conversion_actions",
  "List all conversion actions configured in the account: name, category, type, whether included in Conversions metric, counting type.",
  listConversionActionsSchema,
  async (args) => { try { return ok(await listConversionActions(args)); } catch (e) { return err(e); } }
);

// ── Ad Copy / RSAs ────────────────────────────────────────────────────────────

server.tool(
  "gads_list_rsas",
  "List Responsive Search Ads with all headlines, descriptions, Ad Strength rating, and approval status. Filter by campaign or ad group.",
  listRsasSchema,
  async (args) => { try { return ok(await listRsas(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_rsa_asset_performance",
  "Asset-level performance labels (BEST / GOOD / LOW / PENDING / LEARNING) for RSA headlines and descriptions. Identifies which assets to keep, test, or replace.",
  rsaAssetPerformanceSchema,
  async (args) => { try { return ok(await rsaAssetPerformance(args)); } catch (e) { return err(e); } }
);

// ── Assets / Extensions ───────────────────────────────────────────────────────

server.tool(
  "gads_list_assets",
  "List account-level assets: sitelinks, callouts, structured snippets, images, call extensions, and more. Filter by asset type.",
  listAssetsSchema,
  async (args) => { try { return ok(await listAssets(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_campaign_assets",
  "Assets linked to campaigns with field type and status. Shows which extensions are active on which campaigns.",
  campaignAssetsSchema,
  async (args) => { try { return ok(await campaignAssets(args)); } catch (e) { return err(e); } }
);

// ── Audiences ─────────────────────────────────────────────────────────────────

server.tool(
  "gads_list_audiences",
  "List user lists (remarketing audiences, customer match lists) in the account with size, eligibility, and match rate.",
  listAudiencesSchema,
  async (args) => { try { return ok(await listAudiences(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_campaign_audience_targeting",
  "Audiences attached to campaigns with targeting setting (observation vs targeting) and bid modifier. Shows both inclusion and exclusion lists.",
  campaignAudienceTargetingSchema,
  async (args) => { try { return ok(await campaignAudienceTargeting(args)); } catch (e) { return err(e); } }
);

// ── Performance ───────────────────────────────────────────────────────────────

server.tool(
  "gads_geo_performance",
  "Performance broken down by geographic location (country, region, city). Surfaces top and bottom geo segments by cost and conversions.",
  geoPerformanceSchema,
  async (args) => { try { return ok(await geoPerformance(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_device_performance",
  "Clicks, cost, CTR, conversions, and CPA split by MOBILE / DESKTOP / TABLET per campaign. Default last 28 days.",
  devicePerformanceSchema,
  async (args) => { try { return ok(await devicePerformance(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_impression_share",
  "Search Impression Share, Lost IS (Budget), and Lost IS (Rank) per campaign. Identifies whether budget or Quality Score/bid is limiting reach.",
  impressionShareSchema,
  async (args) => { try { return ok(await impressionShare(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_auction_insights",
  "Auction Insights report: impression share, overlap rate, outranking share, top-of-page %, and absolute top % vs competitors. Optional campaign filter.",
  auctionInsightsSchema,
  async (args) => { try { return ok(await auctionInsights(args)); } catch (e) { return err(e); } }
);

// ── Budget ────────────────────────────────────────────────────────────────────

server.tool(
  "gads_list_budgets",
  "All campaign budgets with daily/total amount, delivery method (STANDARD/ACCELERATED), period, and whether a recommended budget exists.",
  listBudgetsSchema,
  async (args) => { try { return ok(await listBudgets(args)); } catch (e) { return err(e); } }
);

server.tool(
  "gads_budget_pacing",
  "Cost vs budget per campaign for the specified period with utilization percentage. Flags over- and under-pacing campaigns. Default last 28 days.",
  budgetPacingSchema,
  async (args) => { try { return ok(await budgetPacing(args)); } catch (e) { return err(e); } }
);

const transport = new StdioServerTransport();
await server.connect(transport);
