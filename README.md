# google-ads-mcp

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![glama score](https://glama.ai/mcp/servers/ZLeventer/google-ads-mcp/badges/score.svg)](https://glama.ai/mcp/servers/ZLeventer/google-ads-mcp)

**A Model Context Protocol server for Google Ads — give Claude and other AI assistants direct access to your Google Ads account.**

This is a community edition with B2B/agency-focused tooling that goes beyond the official `googleads/google-ads-mcp`. It adds RSA asset performance labels, auction insights, impression share analysis, geo/device splits, audience targeting inspection, and budget pacing — the tools you actually need to diagnose spend efficiency and optimize campaigns in conversation.

---

## Features

| Category | Tools |
|---|---|
| Account | List accounts, account info |
| Campaigns | List campaigns, campaign performance, ad group performance |
| Keywords | Keyword performance, search terms report |
| Conversions | Conversions by campaign, list conversion actions |
| Ad Copy / RSAs | List RSAs with Ad Strength, RSA asset performance labels |
| Assets / Extensions | List account assets, campaign assets |
| Audiences | List user lists, campaign audience targeting |
| Performance | Geo performance, device performance, impression share, auction insights |
| Budget | List budgets, budget pacing |
| Escape hatch | Raw GAQL query |

---

## Prerequisites

- Node.js 20+
- A Google Ads Developer Token ([apply here](https://developers.google.com/google-ads/api/docs/get-started/dev-token))
- OAuth 2.0 credentials (Client ID + Secret) from Google Cloud Console
- A refresh token with `https://www.googleapis.com/auth/adwords` scope

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Yes | Your Google Ads developer token |
| `GOOGLE_ADS_CLIENT_ID` | Yes | OAuth 2.0 client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | Yes | OAuth 2.0 client secret |
| `GOOGLE_ADS_REFRESH_TOKEN` | Yes | OAuth 2.0 refresh token |
| `GOOGLE_ADS_CUSTOMER_ID` | Yes* | Default customer ID (no dashes). Can be overridden per tool call. |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | No | Manager account ID for MCC access |

---

## Usage

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "google-ads": {
      "command": "npx",
      "args": ["-y", "google-ads-mcp"],
      "env": {
        "GOOGLE_ADS_DEVELOPER_TOKEN": "YOUR_TOKEN",
        "GOOGLE_ADS_CLIENT_ID": "YOUR_CLIENT_ID",
        "GOOGLE_ADS_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
        "GOOGLE_ADS_REFRESH_TOKEN": "YOUR_REFRESH_TOKEN",
        "GOOGLE_ADS_CUSTOMER_ID": "1234567890"
      }
    }
  }
}
```

### Claude Code

```json
{
  "mcpServers": {
    "google-ads": {
      "command": "node",
      "args": ["/path/to/google-ads-mcp/dist/index.js"],
      "env": {
        "GOOGLE_ADS_DEVELOPER_TOKEN": "YOUR_TOKEN",
        "GOOGLE_ADS_CLIENT_ID": "YOUR_CLIENT_ID",
        "GOOGLE_ADS_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
        "GOOGLE_ADS_REFRESH_TOKEN": "YOUR_REFRESH_TOKEN",
        "GOOGLE_ADS_CUSTOMER_ID": "1234567890"
      }
    }
  }
}
```

### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "google-ads": {
      "command": "npx",
      "args": ["-y", "google-ads-mcp"],
      "env": {
        "GOOGLE_ADS_DEVELOPER_TOKEN": "YOUR_TOKEN",
        "GOOGLE_ADS_CLIENT_ID": "YOUR_CLIENT_ID",
        "GOOGLE_ADS_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
        "GOOGLE_ADS_REFRESH_TOKEN": "YOUR_REFRESH_TOKEN",
        "GOOGLE_ADS_CUSTOMER_ID": "1234567890"
      }
    }
  }
}
```

### Docker

```bash
docker build -t google-ads-mcp .
docker run --rm \
  -e GOOGLE_ADS_DEVELOPER_TOKEN=YOUR_TOKEN \
  -e GOOGLE_ADS_CLIENT_ID=YOUR_CLIENT_ID \
  -e GOOGLE_ADS_CLIENT_SECRET=YOUR_CLIENT_SECRET \
  -e GOOGLE_ADS_REFRESH_TOKEN=YOUR_REFRESH_TOKEN \
  -e GOOGLE_ADS_CUSTOMER_ID=1234567890 \
  google-ads-mcp
```

---

## Tools reference

| Tool | Description |
|---|---|
| `gads_run_gaql` | Run any raw GAQL query — escape hatch for custom reports |
| `gads_list_accounts` | List all accessible Google Ads accounts |
| `gads_account_info` | Name, currency, timezone, manager flag, status |
| `gads_list_campaigns` | Campaigns with status, channel type, bidding strategy |
| `gads_campaign_performance` | Impressions, clicks, CTR, CPC, cost, conversions, CPA, ROAS |
| `gads_ad_group_performance` | Ad group metrics with campaign context |
| `gads_keyword_performance` | Keywords with match type, quality score, cost, conversions |
| `gads_search_terms_report` | Actual user queries that triggered ads — find negatives and opportunities |
| `gads_conversions_by_campaign` | Conversions × conversion action per campaign |
| `gads_list_conversion_actions` | All conversion actions with category, type, counting method |
| `gads_list_rsas` | RSAs with all headlines, descriptions, Ad Strength, approval status |
| `gads_rsa_asset_performance` | Per-asset performance labels: BEST / GOOD / LOW / PENDING / LEARNING |
| `gads_list_assets` | Account assets: sitelinks, callouts, structured snippets, images |
| `gads_campaign_assets` | Assets linked to campaigns with field type |
| `gads_list_audiences` | User lists (remarketing, customer match) with size and match rate |
| `gads_campaign_audience_targeting` | Audiences on campaigns with bid modifiers and inclusion/exclusion |
| `gads_geo_performance` | Performance by country, region, and city |
| `gads_device_performance` | Cost, conversions, CPA split by MOBILE / DESKTOP / TABLET |
| `gads_impression_share` | Search IS, Lost IS (Budget), Lost IS (Rank) per campaign |
| `gads_auction_insights` | Impression share, overlap rate, outranking share vs competitors |
| `gads_list_budgets` | All budgets: amount, delivery method, period, recommended budget |
| `gads_budget_pacing` | Cost vs budget per campaign with utilization % |

---

## Example prompts

- "What's my impression share vs competitors this month? Who am I most often losing to?"
- "Show me all RSA assets with LOW performance labels so I can replace them."
- "Which keywords are spending the most with zero conversions in the last 30 days?"
- "What's my mobile vs desktop CPA difference across all campaigns?"
- "Are any campaigns budget-limited right now? Show me Lost IS (Budget)."
- "List my remarketing audiences and tell me which ones are large enough to target in Search."

---

## Build from source

```bash
git clone https://github.com/ZLeventer/google-ads-mcp.git
cd google-ads-mcp
npm install
npm run build
```

---

## License

MIT — Copyright (c) 2026 Zach Leventer
