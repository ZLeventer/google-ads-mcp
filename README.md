# google-ads-mcp

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-green.svg)](https://modelcontextprotocol.io)

A Model Context Protocol server for Google Ads — give Claude and other AI assistants direct access to your Google Ads account.

> **Community edition.** This server focuses on B2B and agency workflows: impression share, auction insights, RSA asset performance, budget pacing, audience management, and geo/device splits — tooling that goes beyond the official [`googleads/google-ads-mcp`](https://github.com/googleads/google-ads-mcp).

---

## Features

| Category | Tools |
|---|---|
| Accounts | List accessible accounts, account info |
| Campaigns | List campaigns, campaign performance, ad group performance |
| Keywords | Keyword performance, search terms report |
| Conversions | Conversions by campaign, list conversion actions |
| Ad Copy / RSAs | List RSAs, RSA asset performance (BEST/GOOD/LOW labels) |
| Assets | List account assets, list ad group assets |
| Audiences | List remarketing/customer match lists, campaign audiences |
| Performance | Geo performance, device performance, impression share, auction insights |
| Budget | List budgets, budget pacing |

---

## Prerequisites

You need Google Ads API credentials. Follow the [Google Ads API quickstart](https://developers.google.com/google-ads/api/docs/get-started/introduction) to obtain:

- A **developer token** (apply in your MCC account → API Center)
- An **OAuth 2.0 client ID and secret** (Google Cloud Console → Credentials → OAuth 2.0 Client ID, type: Desktop App)
- A **refresh token** (run the OAuth flow with the `google-ads-api` library or the [Google OAuth Playground](https://developers.google.com/oauthplayground/) using scope `https://www.googleapis.com/auth/adwords`)
- Your **customer ID** (10-digit number shown in the top right of Google Ads, without dashes)

---

## Setup

### 1. Clone and build

```bash
git clone https://github.com/ZLeventer/google-ads-mcp.git
cd google-ads-mcp
npm install
npm run build
```

### 2. Set environment variables

```bash
export GOOGLE_ADS_DEVELOPER_TOKEN="your-developer-token"
export GOOGLE_ADS_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_ADS_CLIENT_SECRET="your-client-secret"
export GOOGLE_ADS_REFRESH_TOKEN="your-refresh-token"
export GOOGLE_ADS_CUSTOMER_ID="1234567890"          # no dashes
# Optional — set if connecting via a manager (MCC) account:
export GOOGLE_ADS_LOGIN_CUSTOMER_ID="0987654321"
```

---

## Usage

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "google-ads": {
      "command": "node",
      "args": ["/path/to/google-ads-mcp/dist/index.js"],
      "env": {
        "GOOGLE_ADS_DEVELOPER_TOKEN": "your-developer-token",
        "GOOGLE_ADS_CLIENT_ID": "your-client-id",
        "GOOGLE_ADS_CLIENT_SECRET": "your-client-secret",
        "GOOGLE_ADS_REFRESH_TOKEN": "your-refresh-token",
        "GOOGLE_ADS_CUSTOMER_ID": "1234567890"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add google-ads -- node /path/to/google-ads-mcp/dist/index.js
```

Then set the env vars in your shell profile or `.env` file.

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "google-ads": {
      "command": "node",
      "args": ["/path/to/google-ads-mcp/dist/index.js"],
      "env": {
        "GOOGLE_ADS_DEVELOPER_TOKEN": "your-developer-token",
        "GOOGLE_ADS_CLIENT_ID": "your-client-id",
        "GOOGLE_ADS_CLIENT_SECRET": "your-client-secret",
        "GOOGLE_ADS_REFRESH_TOKEN": "your-refresh-token",
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
  -e GOOGLE_ADS_DEVELOPER_TOKEN=... \
  -e GOOGLE_ADS_CLIENT_ID=... \
  -e GOOGLE_ADS_CLIENT_SECRET=... \
  -e GOOGLE_ADS_REFRESH_TOKEN=... \
  -e GOOGLE_ADS_CUSTOMER_ID=... \
  google-ads-mcp
```

---

## Tools reference

| Tool | Description |
|---|---|
| `gads_run_gaql` | Run any raw GAQL query — escape hatch for custom reports |
| `gads_list_accounts` | List all accessible customer accounts |
| `gads_account_info` | Account name, currency, timezone, status |
| `gads_list_campaigns` | List campaigns with status, channel type, bidding strategy |
| `gads_campaign_performance` | Impressions, clicks, CTR, CPC, cost, conversions, CPA, ROAS |
| `gads_ad_group_performance` | Ad group performance with campaign context |
| `gads_keyword_performance` | Keyword stats with match type and quality score |
| `gads_search_terms_report` | Actual search queries that triggered ads (find negative KW candidates) |
| `gads_conversions_by_campaign` | Conversions by campaign × conversion action |
| `gads_list_conversion_actions` | All conversion actions with type, category, counting method |
| `gads_list_rsas` | Responsive Search Ads with headlines, descriptions, Ad Strength |
| `gads_rsa_asset_performance` | RSA headline/description performance labels (BEST/GOOD/LOW) |
| `gads_list_assets` | Account-level sitelinks, callouts, structured snippets, images |
| `gads_list_ad_group_assets` | Assets attached at ad-group level |
| `gads_list_audiences` | Remarketing lists, customer match, in-market/affinity segments |
| `gads_list_campaign_audiences` | Audiences on campaigns with bid modifier and targeting setting |
| `gads_geo_performance` | Performance by country, region, and city |
| `gads_device_performance` | Cost, clicks, conversions split by MOBILE/DESKTOP/TABLET |
| `gads_impression_share` | Search IS, Lost IS (Budget), Lost IS (Rank) per campaign |
| `gads_auction_insights` | Impression share, overlap rate, outranking share vs. competitors |
| `gads_list_budgets` | All campaign budgets with amount, delivery method, campaign count |
| `gads_budget_pacing` | Spend vs. expected budget for current period — flags over/under-pacing |

---

## Example prompts

- "What's my impression share vs. competitors this month, and where am I losing to budget vs. rank?"
- "Show me RSA assets with LOW performance labels across all ad groups — I want to swap them out."
- "Which keywords are spending the most with zero conversions in the last 30 days?"
- "What's my mobile vs. desktop CPA split by campaign?"
- "Which campaigns are over-pacing their monthly budget right now?"
- "Give me the top 20 search terms driving spend that aren't in my keyword list — potential negatives."

---

## License

MIT — see [LICENSE](LICENSE).
