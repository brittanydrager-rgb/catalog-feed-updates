# Interactive Data Harmonization Portal — Project Context

Synthesized from: [Selection Initiative Confluence](https://instacart.atlassian.net/wiki/spaces/Catalog/pages/5212176901), [PLS Code Matching API Docs](https://instacart.atlassian.net/wiki/spaces/Catalog/pages/4952162599), [Hackathon Prep meeting (2026-03-04)](https://ava.instacart.tools/meetings/2837de1a-c0c7-479a-bd18-d710cb877e23), [PRD Catalog Retailer Tooling H1'26](https://docs.google.com/document/d/1d6hGpnVKMZvvts5WLUiJo9TLycF9vpz8fvjbZyFt4wM/edit), [\[Product Review\] Retailer App Catalog Tooling H1'26](https://docs.google.com/presentation/d/1gulOWx_5YExw8mkRg-SyPmAjRpiZr5Obuesy3bwuMOA/edit), [\[Product Review\] Catalog Retailer Tooling Vision H2'25](https://docs.google.com/presentation/d/1N2mMWZMVzwDX7f_F8R29CSQ-oPstWKlP52UcXURF1p0/edit), [Catalog Vision 2026 H1 Figma](https://www.figma.com/design/9wyAqtAnvMPY8Mbd1YgpNf/Catalog-Vision-2026-H1?node-id=9279-35753), [Hackathon Ideas Sheet](https://docs.google.com/spreadsheets/d/1ecagCfj3QlwAcvi4cRwT4YP8jejN02IOnOwPm_lBOpU/edit), [Slack discussion](#slack-discussion)

---

## Strategic Context: Where This Fits

This project is a **hackathon MVP** for a feature that directly aligns with the existing H1'26 Catalog Retailer Tooling roadmap. It is **not a standalone project** — it is an accelerant for Phase 3 of the official H1'26 plan (Catalog Dashboard) and a proof-of-concept for the broader "Catalog Diff Viewer" idea surfaced in team discussions.

### The H1'26 Catalog Retailer Tooling 3-Phase Plan

Owned by PM **Kyle Lydon** and **Karin Comas**, Design **Veronica Wong**, Eng **Alejandro Lujan / Mike Wang / Philippe Montero**:

| Phase | What | Who | Timing |
| :---- | :---- | :---- | :---- |
| **1\. Data Transparency** | Product Details Page \+ Attribute Details Drawer — show retailers how/why their data was transformed | All retailers | H1'26 |
| **2\. Error Reporting \+ Editing** | Structured error flagging and attribute editing, differentiated by retailer type (MP vs SFP/WL) and product type | All retailers | H1'26 |
| **3\. Catalog Dashboard** | New dashboard surfacing catalog health metrics, highlighting products requiring attention | All retailers | H1'26 |

**Target**: 10% increase in RSAT (Retailer Satisfaction). Catalog tools are currently rated the **3rd worst IPP tool**; catalog issues account for **64% of daily support tickets** with a **12-day avg. resolution time**.

---

## Problem Statement

Retail partners invest time preparing inventory files, but once submitted, their data enters a **"black box."** Instacart's data transformation — merging, enrichment, clustering, overrides — is invisible to retailers. This creates:

- **Confusion and mistrust** — Retailers don't understand why their product data appears a certain way; 64% of support tickets are catalog-related  
- **Slow resolution** — 12-day average to resolve a catalog error; retailers have no self-service path  
- **No feedback on file quality** — Retailers receive no signal when their nightly feed has bad data, wrong attributes, or anomalous changes  
- **Stale overrides** — "As long as our data in the catalog feed is abbreviated like that, it seems like it overrides IPP until IPP almost learns no, this information needs to stick." — Rosauers retailer  
- **Opt-outs from innovation** — Due to lack of trust, retailers opt out of enrichment, availability algorithms, replacements, and ads — hurting both parties' bottom lines

### Supporting Data (from IPP RSAT Feedback, March 2026\)

Real retailer quotes from in-app survey:

- *"Multiple issues: Updates need to be reflected on site immediately, inability to update private label items, discrepancies between inventory file and product details on site, challenging to pull list of missing product images at scale, and need to add the retailers item number to site in addition to UPC or GTIN barcode."* — Shamrock Foodservice, score: 2/5  
- *"never loads"* — Wegmans, score: 1/5  
- *"Need to be able to remove item and edit all information"* — Geissler's Supermarkets, score: 1/5

---

## The Hackathon Idea: Catalog Diff Viewer / Interactive Data Harmonizator

### Origin (Slack thread, March 2026\)

**Sonali Parthasarathy**: When a retailer feed update comes in, show a before/after diff of what changed: new products, removed products, price changes, attribute updates. Retailers could review and approve changes in IPP before they go live. Catches bad data at the source. This is actually @nicholas.petrielli's idea from when we were brainstorming Product Identity solutions.

**Nicholas Petrielli**: Even just a quick at a glance dashboard would be really cool. "We noticed that things within our produce category have had their name change by about X% in your last file, did you mean to do this?"

**Kyle Lydon**: @muhammad.imran sounds similar to the idea you were talking to me about too\!

**Muhammad Imran**: Yeah, an indicator/score on the quality of their feed might be helpful and/or repurpose bad data prompt to identify unenrichable products to be fixed.

### Registered in Hackathon Ideas Sheet

**Name**: Interactive Data Harmonizator **Description**: When a retailer feed update comes in, show a before/after diff of what changed: new products, removed products, price changes, attribute updates. This will be **via IPP**, not the regular ingestion flow. Retailers could review and approve changes in IPP before they go live. Catches bad data at the source. **Team**: Brittany Drager **Status**: Signed up ✅

---

## Vision

Build an **IPP-native Catalog Diff Viewer** that surfaces feed-level changes to retailers before and after ingestion, giving them transparency into what changed and why — and eventually, the ability to approve or flag issues.

### Value to Retailers

- **Transparency & control** — "I can see exactly what changed between my last file and this one, and how our system interpreted it."  
- **Proactive quality** — "I get alerted when something looks off — e.g., 40% of my produce names changed — before it goes live."  
- **Self-service debugging** — "I can diagnose data format problems myself, without opening a support ticket."

### Value to Instacart

- **Reduced support load** — Reduce catalog's 64% share of daily support tickets  
- **Cleaner upstream data** — Retailers fix errors in their feed before ingestion, not after  
- **Trust rebuild** — Transparency → adoption of enrichment, availability algorithms, ads optimizations  
- **Hackathon → roadmap** — MVP validates Phase 3 Catalog Dashboard design and informs H2 agentic features

---

## Feature Ideas (from Team Discussion)

### Core: Feed Diff View (MVP)

Show before/after comparison when a retailer feed update comes in:

- **New products** added in this file vs. last  
- **Removed products** no longer in the feed  
- **Price changes** — items with price delta above threshold  
- **Attribute changes** — name, size, description, category updates

### Category-Level Anomaly Alerts (Nick's idea)

At-a-glance dashboard showing statistical anomalies by category:

- "40% of items in your **Produce** category had their name change — did you mean to do this?"  
- "12 items previously in **Dairy** are no longer in your file."  
- Helps catch bulk data corruption or accidental overwrites before they propagate

### Feed Quality Score (Muhammad's idea)

- A score or indicator on the quality of each feed submission  
- Flags "unenrichable" products — items missing required attributes that would prevent enrichment (image, UPC, size, brand)  
- Could reuse the "bad data prompt" workflow from existing VLM/enrichment pipelines  
- Related existing work: [Catalog Vision 2026 H1 Figma](https://www.figma.com/design/9wyAqtAnvMPY8Mbd1YgpNf/Catalog-Vision-2026-H1?node-id=9279-35753) and [Prototype](https://www.figma.com/make/t71caihsYjb29AzoAXRHx0/Prototype---Catalog-H1-2026)

### Full Harmonization Simulation (original Selection Initiative vision)

For new retailer onboarding — file upload → three-panel comparison:

- **Panel 1**: Raw uploaded data  
- **Panel 2**: Matching engine (UPC → product\_id, attribute mapping, value standardization, enrichment added)  
- **Panel 3**: Final product record as it will appear in the system  
- See [Selection Initiative Confluence page](https://instacart.atlassian.net/wiki/spaces/Catalog/pages/5212176901) for full spec

---

## Existing Designs & Related Work

| Resource | What It Shows |
| :---- | :---- |
| [Catalog Vision 2026 H1 Figma](https://www.figma.com/design/9wyAqtAnvMPY8Mbd1YgpNf/Catalog-Vision-2026-H1?node-id=9279-35753) | Dashboard frame — retailer nav (Home, Catalog active, Analytics, Marketing, Storefronts, Operations, Settings), TDS table with filter row \+ dropdowns |
| [Prototype — Catalog H1 2026](https://www.figma.com/make/t71caihsYjb29AzoAXRHx0/Prototype---Catalog-H1-2026) | Interactive prototype of the H1 Catalog tooling vision |
| [\[Product Review\] Retailer App Catalog Tooling H1'26 (Slides)](https://docs.google.com/presentation/d/1gulOWx_5YExw8mkRg-SyPmAjRpiZr5Obuesy3bwuMOA/edit) | Full H1'26 plan, phased delivery, retailer research from Jan 2026 interviews, future agentic vision |
| [\[Product Review\] Catalog Retailer Tooling Vision H2'25 (Slides)](https://docs.google.com/presentation/d/1N2mMWZMVzwDX7f_F8R29CSQ-oPstWKlP52UcXURF1p0/edit) | Crawl/Walk/Run framework, 3 pillars, retailer pain points, user persona (Sarah) |
| [Price Anomaly Dashboard (Slack thread)](https://instacart.slack.com/archives/C04LQ8YJ28N/p1771521883903439) | Related Sonali initiative: digest of price-anomalous items grouped by category, surfacing LLM explanation to retailers; Figma prototype exists at node 10683-17802 |
| [IPP Catalog deficiencies (Confluence)](https://instacart.atlassian.net/wiki/spaces/Catalog/pages/6138953839) | Detailed list of current IPP catalog tool gaps (no export/import, no edit feedback, no status tracking) |
| [Catalog Tools Vision Brief](https://docs.google.com/document/d/1WlWSZh-62EO9Ts4wDMEcVLzbVrmSMkF_d2OE3NfsUC8/edit) | P1 H1 2026 priorities: data source transparency, error flagging with AI review, catalog dashboard |

---

## Technical Context: Product Lookup Service (PLS) / Code Matching API

The [Product Lookup Service](https://instacart.atlassian.net/wiki/spaces/Catalog/pages/4952162599) is the backbone for the matching layer. It provides centralized, API-based product code matching.

### What It Does

Given a `retailer_id`, `code` (UPC, RRC, `external_integration_id`), and `code_type`, returns the best `product_id` and any alternative matches.

### Service Tiers

| Tier | Use Case | Latency |
| :---- | :---- | :---- |
| **Foreground** (`rpc.product-retrieval.customers`) | Real-time, low-latency (\<50ms) | \~10ms per code |
| **Background** (`background.rpc.product-retrieval.customers`) | Bulk, non-time-critical | \~350ms / 10k codes |

### Key Endpoints

- **Single match**: `GetRetailerProductCodeMatching`  
- **Bulk match**: `GetBulkRetailerProductCodeMatching` (max 10,000 codes)  
- **Match \+ fetch products**: `GetRetailerProductsWithCodes`  
- **Match \+ fetch items**: `GetItemsWithCodes`

### Relevance to the Diff Viewer

The diff view's matching layer would use PLS background service to:

1. Take each code from the new retailer file  
2. Call `GetBulkRetailerProductCodeMatching` — returns matched `product_id`, `matched_method`, and confidence  
3. Compare against the previous file's matched state to generate the diff  
4. Surface duplicate detection and code mismatch flags

**Contact**: `#prj-product-code-matching` | Owned by Catalog Interfaces team

---

---

## Success Metrics

| Metric | Type | Baseline / Goal |
| :---- | :---- | :---- |
| Retailer RSAT | Primary | \+10% from current baseline (H1'26 target) |
| Catalog support tickets | Primary | Reduce from 64% share of daily tickets; 12-day avg → target TBD |
| Time to first successful ingestion | Secondary | Reduction for new retailer onboarding |
| Feed error rate | Secondary | Reduction in errors found post-ingestion |
| Retailer engagement with diff view | Hackathon | % of retailers who open and interact with diff on each file upload |

---

## Analytics & Instrumentation

### Goals

1. Prove hackathon adoption — demonstrate that retailers are opening and engaging with the diff view post-demo so the feature can qualify for the H1'26 roadmap  
2. Measure long-term impact — correlate diff view usage with downstream improvements in feed quality score and support ticket reduction  
3. Surface retailer behavior signals — understand which change types and anomaly alerts retailers pay most attention to, informing v2 prioritization

---

### Event Tracking Schema

#### Feature 1: Feed Diff View

| Event | Trigger | Required properties |
| :---- | :---- | :---- |
| `catalog_diff_page_viewed` | Retailer lands on the Feed Updates page | `retailer_id`, `feed_id`, `feed_date`, `total_added`, `total_removed`, `total_changed` |
| `catalog_diff_product_expanded` | Retailer expands a product row to see field-level diff | `retailer_id`, `feed_id`, `product_id`, `scan_code`, `change_types[]` (e.g., `["price", "cost_unit"]`) |
| `catalog_diff_filter_applied` | Retailer applies a filter (e.g., "show only removed") | `retailer_id`, `feed_id`, `filter_type` (added / removed / changed / high\_severity) |
| `catalog_diff_feed_compared` | Retailer changes the comparison baseline (e.g., selects a prior feed) | `retailer_id`, `feed_id`, `compared_to_feed_id` |

#### Feature 2: Anomaly Alerts

| Event | Trigger | Required properties |
| :---- | :---- | :---- |
| `catalog_anomaly_alert_viewed` | An anomaly alert card is rendered and visible on screen | `retailer_id`, `feed_id`, `alert_type` (bulk\_name\_change / bulk\_removal / bulk\_price\_change / alcohol\_flag\_change / cost\_unit\_flip), `category`, `affected_count`, `affected_pct` |
| `catalog_anomaly_alert_expanded` | Retailer clicks "View affected items" | `retailer_id`, `feed_id`, `alert_type`, `category` |
| `catalog_anomaly_alert_dismissed` | Retailer dismisses an alert card | `retailer_id`, `feed_id`, `alert_type`, `category` |

#### Feature 3: Feed Quality Score

| Event | Trigger | Required properties |
| :---- | :---- | :---- |
| `catalog_quality_score_viewed` | Quality score panel is rendered | `retailer_id`, `feed_id`, `score_pct`, `catalog_ready_count`, `total_count`, `not_ready_count` |
| `catalog_quality_breakdown_viewed` | Retailer expands the not-catalog-ready product breakdown table | `retailer_id`, `feed_id`, `score_pct` |
| `catalog_quality_product_clicked` | Retailer clicks a specific not-catalog-ready product | `retailer_id`, `feed_id`, `product_id`, `failing_criteria[]` (e.g., `["missing_brand", "invalid_price"]`) |
| `catalog_quality_trend_viewed` | Retailer hovers/views the sparkline trend | `retailer_id`, `feed_id`, `trend_direction` (improving / declining / stable) |

---

### Key Metrics & Definitions

#### Hackathon adoption metrics (measure within 2 weeks of launch)

| Metric | Definition | Target |
| :---- | :---- | :---- |
| Diff view open rate | % of retailers who open Feed Updates within 48hrs of a feed being processed | Baseline TBD; directional signal only |
| Diff interaction rate | % of retailers who expand at least one product row per feed | \>30% of retailers who open the page |
| Anomaly alert click-through rate | % of anomaly alerts that result in "View affected items" click | \>20% |
| Quality score engagement rate | % of retailers who expand the not-catalog-ready breakdown | \>25% of retailers who see a score \< 100% |

#### Long-term impact metrics (measure 60–90 days post-launch)

| Metric | Definition | Leading indicator of |
| :---- | :---- | :---- |
| Feed quality score improvement rate | % of retailers whose catalog-readiness score improves feed-over-feed after seeing the score | Feed error rate reduction |
| Post-alert feed correction rate | % of retailers who fix flagged issues in their next feed after receiving an anomaly alert | Support ticket reduction |
| Support ticket deflection | Change in catalog-related support tickets for retailers using diff view vs. not | Primary H1'26 success metric |

---

### Funnel Definition

For reporting, define the engagement funnel per feed cycle:

```
Feed processed
    → Diff page viewed          (reach)
        → Product expanded      (engagement)
            → Alert clicked     (action)
```

A retailer who completes all three steps in a feed cycle is considered **fully engaged** for that cycle. Track fully engaged rate as the primary hackathon engagement metric.

---

---

## Requirements Specification

Decisions captured from PRD review session (2026-03-04):

- **Q1 (Retailer scope):** MP first; SFP approve/block in v2  
- **Q2 (Trigger):** Hackathon: fake upload UI in IPP with seeded mock data. Production v1: automatic post-ingestion. Production v2: both.  
- **Q3 (Fields):** See field table below (stress-tested against ShopRite and Kroger retailer files)  
- **Q4 (Scope):** Feed quality score \+ anomaly alerts bundled together as one surface

### \# Feature 1: Feed Diff Viewer

### 

### Scope: All retailers (MP \+ SFP). V1 is read-only. V2 adds approve/block gating for SFP/WL only — consistent with the H1'26 framework (error flagging all retailers; overrides WL only).

### 

### Trigger:

### · Hackathon: Manual upload in IPP — retailer uploads a file, sees a "processing..." state, then the summary panel opens. Backed by seeded mock data (no real parsing). Demo narrative: "upload your file and catch issues before they go live."

### · Production v1: Automatic — surfaced after nightly feed ingestion \+ clustering completes (\~4hr post-file-receipt). No behavior change required from retailer.

### · Production v2: Both — manual upload as a "preview mode" pre-flight check \+ automatic post-ingestion for passive monitoring.

### 

### \#\# File Status Model

### 

### Each processed file is assigned one of four statuses:

### 

### | Status | Meaning |

### |---|---|

### | Completed | All items uploaded and processed successfully |

### | Completed with warnings | File uploaded; some items had missing data, previous values used as fallback |

### | Rejected: Missing fields | File not uploaded; one or more items are missing required fields |

### | Rejected: Mismatch detected | File not uploaded; item values conflict with Instacart catalog data for that UPC |

### 

### Status badges appear in the file history table. Each badge includes an info tooltip explaining the status and what action is required.

### 

### \#\# Panel Design

### 

### Clicking "View summary" on any file row opens a full-screen summary panel that slides up from the bottom. The file history table remains accessible behind it.

### 

### The panel content varies by file status:

### 

### \*\*Completed with warnings:\*\*

### · Header: "Inventory file summary" \+ filename \+ upload timestamp

### · Stats grid (2×2): catalog quality issues (flagged amber), price & promo updates, UoM & size changes, new items

### · AI summary: plain-language explanation of key changes (purple-tinted section with AI icon)

### · Warning banner: "Some products had missing information — we're using data from the previous file"

### · Severity-sorted tabs:

###   \- 🔴 Critical: Catalog quality issues (missing images, brand, nutrition data), Unit of measure changes

###   \- 🟡 Warning: Size changes, Availability changes

###   \- ℹ️ Info: Price & promo updates, New items

### · Each tab shows a data table with columns specific to that change type (see Field-Level Display below)

### 

### \*\*Rejected: Missing fields:\*\*

### · Header: "Rejection details: Missing fields"

### · Stats grid: items affected, fields missing, validation errors, rejection reason ("Missing fields")

### · AI summary: explains which fields are missing and that no changes were applied

### · Red error banner: "This file was not uploaded. Fix the missing required fields below and re-upload."

### · Single tab: "Missing required fields" — table shows item name, specific issues (e.g., \`item\_name: empty · price: empty\`), and UPC

### 

### \*\*Rejected: Mismatch detected:\*\*

### · Header: "Rejection details: Mismatch detected"

### · Stats grid: items affected, conflicts detected, rejection reason ("Mismatch detected")

### · AI summary: explains which items conflict with catalog data and that no changes were applied

### · Red error banner: "This file was not uploaded. Correct the mismatched values to match catalog data and re-upload."

### · Single tab: "Mismatch detected" — table shows item name, field, your feed value, Instacart catalog value, and an "Also update" column listing other fields likely affected by the conflict

### 

### \#\# Rejection Validation Rules

### 

### Files are rejected (not uploaded) when any item triggers one of the following:

### 

### \*\*Missing required fields (→ Rejected: Missing fields status):\*\*

### | Field | Rule |

### |---|---|

### | lookup\_code | Must be present and must not start with \`:\` (invalid scan code format) |

### | item\_name | Must be present and non-empty |

### | price | Must be present and \> $0 |

### | cost\_unit | Must be present (EA, LB, or equivalent) |

### | size | Must be present and non-empty |

### | available | Must be present |

### 

### \*\*Catalog mismatch (→ Rejected: Mismatch detected status):\*\*

### · Item name in feed conflicts with the known catalog name for that UPC

### · Brand name in feed conflicts with catalog brand for that UPC

### · Size format is inconsistent with catalog standard for that UPC

### 

### \#\# Field-Level Display (per tab)

### 

### | Tab | Columns shown |

### |---|---|

### | Catalog quality issues | Item name · Issues (missing/invalid fields) · UPC |

### | Unit of measure changes | Item name · Previous UoM · New UoM · UPC |

### | Size changes | Item name · Previous size · New size · UPC |

### | Availability changes | Item name · Previous · New · UPC |

### | Price & promo updates | Item name · Price (old → new) · Promotion · UPC |

### | New items | Item name · UPC |

### | Missing required fields | Item name · Issues · UPC |

### | Mismatch detected | Item name · Field · Your feed · Instacart catalog · Also update |

### 

### The "Also update" column in the mismatch tab proactively surfaces other fields that are likely affected by the conflict — e.g., if \`item\_name\` conflicts, it suggests reviewing \`size\`, \`remote\_image\_url\`, and \`item\_details\`.

### 

### \#\# IPP Placement

### 

### · Hackathon: Catalog tab → existing "Inventory Files" page. Upload area at top of page above file history table. After upload \+ fake processing, the summary panel opens automatically over the page.

### · Production v1: Catalog tab → "Inventory Files" page. Summary panel accessible via "View summary" button on each processed file row. Panel also opens automatically after a new feed is uploaded.

### · Production v2: Also surfaced as an inline banner on the catalog list view when a new feed is ready.

### Feature 2: Category-Level Anomaly Alerts

**Scope:** All retailers. Surfaced alongside the diff view as an at-a-glance summary panel at the top of the page.

**Trigger:**

- **Hackathon:** Rendered immediately when the fake upload processing state completes — seeded alongside the diff data.  
- **Production:** Computed server-side at the same time as the diff, after clustering completes on the nightly feed.

**Alert conditions:**

| Condition | Threshold | Alert text example |
| :---- | :---- | :---- |
| Bulk name change in a category | \>20% of items in a category have name changes | "40% of items in your **Produce** category had their name change — did you mean to do this?" |
| Bulk removal from a category | \>10% of items in a category removed | "12 items previously in **Dairy** are no longer in your file." |
| Bulk price change | \>15% of items in a category have price changes | "23 items in **Bakery** had price changes — review for accuracy." |
| Alcohol flag bulk change | Any item gains or loses alcohol flag | "3 items had their alcohol status changed — please review." |
| Cost unit bulk flip | Any item flips EA↔LB | "2 items changed their sell-by unit (EA↔LB) — this affects pricing calculation." |

**Display:** Dismissible alert cards at top of diff view. Retailer can expand to see the affected items.

---

### Feature 3: Feed Quality Score

**Scope:** All retailers.

**Trigger:** Computed per feed submission. Displayed on the diff view and optionally on the main catalog dashboard as a feed history metric.

**Score definition:** Percentage of products in the feed that are "catalog-ready" — i.e., have all required attributes for Instacart to match, categorize, and display the product correctly.

**Catalog-readiness requirements:**

| Attribute | Required | Validation rule |
| :---- | :---- | :---- |
| Scan code (UPC/GTIN/RRC/SKU) | Required | Must be present, non-empty, and pass format validation (correct length \+ check digit). No duplicate scan codes within the same feed. |
| Item name | Required | Must be present and non-empty |
| Brand name | Required | Must be present and non-empty |
| Price | Required | Must be present and \> $0 |
| Cost unit (sell by) | Required | Must be EA or LB (or equivalent); blank/null is a blocking gap |
| Size / weight / unit | Required | At least one of these must be present |
| Category / department | Required | Must be present; used for taxonomy assignment and anomaly detection |

**Score display:**

- Score: `87% catalog-ready (1,204 / 1,384 products)`  
- Summary: `"180 products are missing required attributes and cannot be listed on Instacart."`  
- Breakdown table: lists not-catalog-ready products with specific missing fields  
- Trend: sparkline showing catalog-readiness score over last 5 feed submissions

---

## Acceptance Criteria

Each AC is written in two tiers: **Hackathon** (fake upload \+ seeded mock data) and **Production** (automatic post-ingestion). AC-2 through AC-4 share the same display behavior across both — the only difference is what triggers the data.

---

### \# AC-1: Feed Diff View — Trigger

### 

### \*\*Hackathon\*\*

### 

### Given the retailer is on the Catalog → Inventory Files page in IPP

### When they drag and drop (or select) a file in the upload area at the top of the page

### Then:

### · A "Analyzing your feed..." processing state displays for \~2 seconds

### · The summary panel opens automatically (full-screen, slides up from bottom)

### · Panel renders from seeded mock data showing: stats summary, AI summary, and severity-sorted tabs with change details

### 

### Hackathon edge cases:

### · Any file type accepted (parsing is fake — mock data renders regardless of file contents)

### · If no file has been uploaded yet, show the upload area above the file history table with instructions: "Upload your feed file to preview changes before they go live"

### · Panel can be closed; file row remains in the history table with "Completed with warnings" status and a "View summary" button to reopen

### 

### \*\*Production v1\*\*

### 

### Given a retailer's nightly feed file is received and processed

### And clustering has completed (\~4hr post-file-receipt)

### When the retailer navigates to Catalog → Inventory Files

### Then they see a file history row for the most recently processed feed with:

### · Status badge (Completed, Completed with warnings, Rejected: Missing fields, or Rejected: Mismatch detected)

### · A "View summary" button that opens the full-screen summary panel

### 

### Production edge cases:

### · First-ever feed → summary panel shows "Initial load — no previous feed to compare against"

### · Clustering still in progress → status shows "Processing" with estimated completion time

### · Zero changes → "No changes detected in this feed"

### · Rejected file → panel opens to rejection details view; no diff tabs shown

### AC-2: Feed Diff View — Field-Level Change Display

*Applies to both hackathon and production — display behavior is identical.*

**Given** a product has one or more changed attributes between the previous and current feed **When** the retailer views that product in the diff view **Then** they see:

- A "Changed" badge on the product row  
- An expandable field-level diff showing: field name | previous value | new value  
- High-severity changes (cost unit flip, alcohol flag change) displayed with a red ⚠ badge and surfaced at the top of the changed-products list

**Acceptance thresholds:**

- All 15 tracked fields must be included in the diff (see field table above)  
- Price delta must display as a signed dollar amount (e.g., "+$0.50" or "-$1.00")  
- Cost unit flip (EA↔LB) must trigger the high-severity badge regardless of any other changes on that product

**Hackathon note:** Seed at least 2 high-severity items (1 cost unit flip EA→LB, 1 alcohol flag change) to demonstrate the ⚠ badge in the demo.

**Out of scope for v1:** Inline editing, approval/rejection actions (SFP v2 only)

---

### AC-3: Category-Level Anomaly Alerts

*Applies to both hackathon and production — display behavior is identical.*

**Given** a diff has been computed (or seeded) **When** any anomaly threshold is met **Then** the retailer sees alert cards above the diff table containing:

- The affected category name  
- The count and percentage of affected items  
- A plain-language description of the anomaly (see alert text examples in Feature 2\)  
- A "View affected items" link that filters the diff table to those items

**Edge cases:**

- Multiple alerts shown as a dismissible stack (not collapsed)  
- Dismissal persists for that feed session (reopening IPP does not re-show dismissed alerts)  
- Alcohol flag alerts are never dismissible — always shown until retailer confirms

**Hackathon note:** Seed 2 alerts minimum — a bulk name change in Produce (40%) and a cost unit flip — to show the full alert interaction in the demo.

---

## \# AC-4: Feed Quality Score

## 

## Applies to both hackathon and production — display behavior is identical.

## 

## Given a feed has been uploaded (hackathon) or processed (production)

## When the retailer views the diff view

## Then they see a quality score panel showing:

## · Overall catalog-readiness score as a percentage (e.g., "82% catalog-ready")

## · Raw counts: catalog-ready products / total products

## · A count of not-catalog-ready products with a breakdown by missing field (e.g., "45 missing scan code, 12 missing brand name")

## · A trend sparkline showing catalog-readiness score over the last 5 feeds

## 

## Catalog-readiness definition (testable): A product is catalog-ready if and only if ALL of the following are true:

## 1\. Scan code is present, non-empty, passes format validation, and is not a duplicate within the feed

## 2\. Item name is present and non-empty

## 3\. Brand name is present and non-empty

## 4\. Price is present and \> $0

## 5\. Cost unit (sell by) is present and a recognized value (EA, LB, or retailer equivalent)

## 6\. At least one of size, weight, or unit of measure is present

## 7\. Category or department is present and non-empty

## 

## A product is not catalog-ready if it fails any one of the above criteria. The breakdown table lists each failing product alongside the specific criteria it failed.

## 

## Edge cases:

## · Duplicate scan code: both products flagged as not-catalog-ready with reason "duplicate scan code: \[value\]"

## · Price of $0.00: flagged as not-catalog-ready with reason "price must be greater than $0"

## · Fewer than 5 prior feeds: sparkline shows only available data points

## · Score of 100%: "Perfect score\! 🎉" celebratory state

## · Score below 50%: warning state \+ CTA: "Contact your TAM for help improving your feed quality"

## 

## Hackathon note: Seed score at 82% (90 not-catalog-ready out of 500), with an upward trend over 5 feeds, to show the improvement narrative in the demo.

## 

## \# AC-5: Rejection — Missing Required Fields

## 

## Applies to both hackathon and production.

## 

## Given a feed file contains one or more items missing required fields (item\_name, price, size, cost\_unit, available) or with an invalid lookup\_code format (starts with \`:\`)

## When the file is processed

## Then:

## · The file row in the history table shows status "Rejected: Missing fields"

## · The status badge tooltip reads: "File was not uploaded. Required fields are missing or invalid. Fix the errors and re-upload."

## · Clicking "View summary" opens the full-screen panel to the rejection view showing:

##   \- Section heading: "Rejection details: Missing fields"

##   \- Stats: items affected · fields missing · validation errors · rejection reason ("Missing fields")

##   \- AI summary identifying the specific missing fields and items affected

##   \- Red error banner: "This file was not uploaded. Fix the missing required fields below and re-upload the file to apply your changes."

##   \- Single tab "Missing required fields" with table: Item name · Issues · UPC

## · Issues column lists each failing field in the format: \`field\_name: empty\` or \`field\_name: invalid format\`

## · No diff tabs are shown (no changes were applied)

## 

## Hackathon note: Seed 4 items — 3 with missing fields (item\_name, price/size, size/available) and 1 with an invalid lookup\_code starting with \`:\` — to demonstrate the full range of validation errors.

## 

## \# AC-6: Rejection — Mismatch Detected

## 

## Applies to both hackathon and production.

## 

## Given a feed file contains one or more items whose values conflict with Instacart's catalog data for that UPC (item name, brand name, or size format mismatch)

## When the file is processed

## Then:

## · The file row in the history table shows status "Rejected: Mismatch detected"

## · The status badge tooltip reads: "File was not uploaded. Item values conflict with Instacart catalog data. Correct the mismatches and re-upload."

## · Clicking "View summary" opens the full-screen panel to the rejection view showing:

##   \- Section heading: "Rejection details: Mismatch detected"

##   \- Stats: items affected · conflicts detected · rejection reason ("Mismatch detected")

##   \- AI summary identifying the specific conflicts and items

##   \- Red error banner: "This file was not uploaded. Correct the mismatched values below to match catalog data and re-upload."

##   \- Single tab "Mismatch detected" with table: Item name · Field · Your feed · Instacart catalog · Also update

## · "Also update" column proactively lists other fields likely affected by the conflict with a plain-language reason for each (e.g., if item\_name conflicts: suggests reviewing size, remote\_image\_url, item\_details)

## · No diff tabs are shown (no changes were applied)

## 

## Hackathon note: Seed 3 mismatch items — one item\_name conflict, one brand\_name \+ size conflict, one size format inconsistency — with populated "Also update" suggestions for each.

## Technical Feasibility

### The Core Problem

To show a diff, we need two things:

1. **Current feed state** — the retailer's latest file, post-ingestion  
2. **Previous feed state** — something to compare it against

The open question from the PRD is: *where do we get the previous state, and when can we compute the diff?* There are three viable approaches, each with different tradeoffs.

---

### Option A: Reconstruct diff from catalog store (Recommended for production)

**How it works:**

- After each nightly feed completes ingestion \+ clustering, query the catalog store for the retailer's current `retailer_product` records  
- Compare against a snapshot taken before that feed run  
- Snapshot storage: a new `retailer_feed_snapshots` table or an existing audit/history mechanism if one exists

**Pros:**

- Reflects the actual state of data as it exists in the catalog — not just the raw file  
- Captures enrichment deltas (e.g., a product that got enriched between feeds)  
- PLS matching results are baked in post-clustering

**Cons:**

- Requires either a new snapshot table or confirmation that catalog store has history/audit trail  
- \~4hr clustering delay before diff is available  
- Snapshot storage cost at scale (large retailers have 100k+ SKUs)

**Key unknown to resolve:** Does the catalog store (or data-ingestion service) already maintain feed-level history? Contact: Alejandro Lujan / data-ingestion team

---

### Option B: Compare raw feed files (Simpler, faster to build)

**How it works:**

- Data ingestion service stores the raw feed files it receives  
- To generate a diff, fetch the last two files for a retailer and do a field-by-field comparison keyed on scan code  
- No dependency on clustering — can run immediately after file receipt

**Pros:**

- No new storage infrastructure needed if files are already retained  
- Diff available immediately after file receipt (\~0hr delay vs. \~4hr for Option A)  
- Simpler computation — no need to join against catalog state

**Cons:**

- Diff reflects raw retailer data, not enriched/matched state — won't show enrichment changes  
- Matching layer (PLS) not involved — duplicate scan code detection requires a separate pass  
- Depends on data-ingestion service retaining raw files (unconfirmed — SSO-gated docs)

**Key unknown to resolve:** Does data-ingestion retain raw files, and for how long? What's the API surface? Contact: data-ingestion team (URL: data-ingestion.icprivate.com — requires SSO access to review)

---

### Option C: Fake upload UI \+ seeded mock data (Recommended for hackathon)

**How it works:**

- Retailer sees a file upload UI in IPP (drag \+ drop or file picker)  
- Uploading any file triggers a fake "processing..." loading state (\~2 second delay)  
- Diff view, anomaly alerts, and quality score render from pre-seeded mock data regardless of what was uploaded  
- No file parsing, no diff computation engine, no backend dependency

**Why fake upload instead of pure mock:**

- Stronger demo narrative: "watch me upload this file and see exactly what would change before it goes live" — the audience experiences the pre-flight check story directly  
- Avoids 3–5hr of risky parser \+ diff engine work (retailer file formats vary wildly: pipe-delimited, newline-delimited JSON, CSV)  
- Full control over the diff scenario — seed interesting anomalies and quality issues for maximum impact

**Estimated hackathon build time:**

| Task | Time |
| :---- | :---- |
| File upload UI \+ fake processing state | 1hr |
| Seed mock diff JSON (adds / removes / changes \+ high-severity items) | 1hr |
| Diff display UI (table, badges, expandable field-level rows) | 3–4hr |
| Anomaly alerts panel | 1–2hr |
| Quality score panel \+ sparkline | 2hr |
| **Total** | **\~8–10hr — fits in 1 day** |

**Pros:**

- Zero backend dependency — entirely frontend  
- Compelling demo narrative without parser complexity  
- Fastest path to a polished, demoable prototype

**Cons:**

- Doesn't prove technical feasibility of the pipeline  
- Post-hackathon requires a real backend before production launch

**Recommendation:** Use Option C for the hackathon. Document Option A as the production v1 path. Use the hackathon demo to get stakeholder buy-in and data-ingestion team alignment on Option B as a near-term bridge.

---

### Data Flow Diagram (Hackathon — Option C)

```
Retailer visits Catalog → Inventory Files page
  - Upload zone displayed above file history table
        │
        ▼
Retailer drags or selects a file in the upload zone
        │
        ▼
Fake processing state (~2 sec)
  "Analyzing your feed..."
        │
        ▼
IPP Frontend loads seeded mock JSON
  - mockDiff.json  →  diff table (adds / removes / changes)
  - mockAlerts.json  →  anomaly alert cards
  - mockQuality.json  →  quality score panel + sparkline
        │
        ▼
Diff view renders (replaces file history table)
  - No backend calls, no file parsing
```

---

### Data Flow Diagram (Production — Option A)

```
Retailer uploads nightly feed
        │
        ▼
Data Ingestion Service
  - Validates file
  - Stores raw file
  - Triggers ingestion pipeline
        │
        ▼
Clustering (~4hr)
  - PLS bulk match: GetBulkRetailerProductCodeMatching
  - product_id assigned to each scan code
  - Attributes normalized
        │
        ▼
Catalog Store updated
  - retailer_product records updated
        │
        ▼
Diff Computation Service (new)
  - Fetches current snapshot from catalog store
  - Compares against previous snapshot
  - Computes: adds, removes, field-level changes
  - Runs catalog-readiness checks
  - Runs anomaly alert thresholds
  - Writes diff result to diff_results table
        │
        ▼
IPP Frontend
  - GET /v1/retailers/:id/feed-diff?feed_id=X
  - Renders diff view, anomaly alerts, quality score
```

---

### New API Surface Required (Production)

| Endpoint | Description | Owner |
| :---- | :---- | :---- |
| `GET /v1/retailers/:id/feed-diff` | Returns latest diff summary \+ paginated changed products | Catalog Interfaces / IPP eng |
| `GET /v1/retailers/:id/feed-diff/:feed_id/products` | Paginated product-level diff with field changes, filterable by change type | Catalog Interfaces / IPP eng |
| `GET /v1/retailers/:id/feed-quality` | Returns catalog-readiness score, breakdown by failing criteria, trend history | Catalog Interfaces / IPP eng |
| `GET /v1/retailers/:id/anomaly-alerts` | Returns active anomaly alerts for latest feed | Catalog Interfaces / IPP eng |

---

### Clustering Dependency Decision (Production only)

*Not applicable to the hackathon — fake upload renders immediately from mock data.*

For production, the clustering delay (\~4hr) creates a UX problem. Recommended approach:

| Approach | Diff available | Trade-off |
| :---- | :---- | :---- |
| Pre-clustering (raw file comparison) | \~0hr after file receipt | Shows raw data changes only; no match quality signal |
| Post-clustering (catalog store comparison) | \~4hr after file receipt | Full fidelity; shows enrichment \+ match changes |
| **Both (recommended for prod v1)** | Pre: immediate summary; post: enriched detail | Best UX — show "feed received" banner immediately, replace with full diff when clustering completes |

**Recommended production UX:** Show a "Your feed was received — reviewing changes..." banner immediately after file receipt. Automatically update to the full diff view when clustering completes (\~4hr). Eliminates the wait frustration without sacrificing data fidelity.

---

## \# Hackathon Technical Checklist

## 

## Build (fake upload \+ seeded mock data):

## · File upload UI — drag \+ drop or file picker, accepts any file type

## · Fake processing state — 2-second loading animation after file is dropped ("Analyzing your feed...")

## · File history table — shows all processed files with status badges and "View summary" buttons

## · Status badges with info tooltips explaining each status (Completed, Completed with warnings, Rejected: Missing fields, Rejected: Mismatch detected)

## · Full-screen summary panel — slides up from bottom, closeable, different content per file status

## 

## \*\*Completed with warnings panel:\*\*

## · Stats grid: catalog quality issues, price & promo updates, UoM & size changes, new items

## · AI summary section (purple, sparkle icon) with plain-language explanation

## · Warning banner (yellow left-border callout)

## · Severity-sorted tabs with icons: Critical (red) → Warning (orange) → Info (gray)

##   \- Catalog quality issues tab (critical): missing images, brand, nutrition

##   \- Unit of measure changes tab (critical): cost\_unit before/after

##   \- Size changes tab (warning): size before/after

##   \- Availability changes tab (warning): available before/after

##   \- Price & promo updates tab (info): price with old→new, promotion summary

##   \- New items tab (info)

## 

## \*\*Rejected: Missing fields panel:\*\*

## · Stats: items affected, fields missing, validation errors

## · AI summary \+ red rejection banner

## · Missing required fields tab: item/issues/UPC table

## · Seed 4 items with real field names (item\_name, price, size, cost\_unit, available, lookup\_code)

## 

## \*\*Rejected: Mismatch detected panel:\*\*

## · Stats: items affected, conflicts detected

## · AI summary \+ red rejection banner

## · Mismatch detected tab: item/field/your feed/catalog/also update table

## · Seed 3 mismatch items with "Also update" suggestions

## 

## Instrumentation (minimum viable):

## · catalog\_diff\_page\_viewed

## · catalog\_diff\_product\_expanded

## · catalog\_quality\_score\_viewed

## 

## Post-hackathon follow-up:

## · Spike with data-ingestion team to confirm raw file retention (Option B feasibility)

## · Design session with Alejandro to scope the diff computation service (Option A)

## · Align with Sonali on merging Price Anomaly Dashboard with anomaly alerts surface

## · Determine production validation rules for mismatch detection (current mock uses item\_name, brand\_name, size format)

## Retailer Data Reference Files

Files used during PRD development to stress-test field lists and validate design decisions.

### ShopRite

- **File:** `/Users/brittanydrager/Downloads/pg4b0813__version_3__....txt`  
- **Format:** Pipe-delimited text, full catalog dump  
- **Key columns:** SKU, STORE NUMBER, BRAND NAME, PRODUCT NAME, DESCRIPTION, HOW TO SELL BY, AVERAGE WEIGHT, WEIGHT SELECTOR, REGULAR PRICE, SALES QUANTITY, SALES PRICE, TAX VALUE, FAMILY SALE FLAG, DEPARTMENT CODE, COMMODITY, SIZE, UOM, ALCOHOL, USA\_SNAP\_ELIGIBLE, LOYALTY\_PRICE, MAX\_IN\_CART

### Kroger (Delta Files)

These are **delta files** — Kroger sends change feeds per store, not full catalog dumps. This validates the diff concept: the idea of showing retailers what changed is already how Kroger structures their data pipeline.

| File | Store | Records |
| :---- | :---- | :---- |
| `kroger_products_inventory_api_delta_016-00920_20260304-13537-m4isp3.json` | 016-00920 | \~13,537 |
| `kroger_products_inventory_api_delta_029-00350_20260304-6168-21f8gy.json` | 029-00350 | 3,805 |
| `kroger_products_inventory_api_delta_029-00202_20260304-3695-s4g6m1.json` | 029-00202 | 4,065 |
| `kroger_products_inventory_api_delta_016-00328_20260304-74-2rgagb.json` | 016-00328 | 937 |
| `kroger_products_inventory_api_delta_034-00747_20260304-3230-47brg1.json` | 034-00747 | 1,265 |

**All files path prefix:** `/Users/brittanydrager/Downloads/`

**Kroger record structure:**

```json
{
  "name": "Stars Pimento Cheese Spread",
  "upc": "0007754100515",
  "base_upc": "0007754100515",
  "available": true,
  "location_code": "029-00350",
  "updatedAt": { "value": "2026-03-04T14:46:13Z" },
  "priceUpdatedAt": { "value": "2026-03-02T14:26:18Z" },
  "fulfillmentUpdatedAt": { "value": "2024-04-23T14:45:28Z" },
  "stockLevelUpdatedAt": { "value": "2026-03-04T14:41:13Z" },
  "locations": [{
    "fulfillment": { "delivery": true, "instore": false, "pickup": false, "ship": false },
    "inventory": [{
      "instock": true,
      "prices": [{ "regular": { "unit": 4.19, "nfor": [{ "price": 4.19, "quantity": 1 }] }, "soldBy": "UNIT" }],
      "stock": { "level": "OSS", "availableToSell": 2 }
    }],
    "aisleLocations": [{ "aisle": "0", "aisleDescription": "MEAT", "departmentDescription": "MEAT" }]
  }]
}
```

**Design-relevant Kroger insights:**

- **Granular change timestamps** — `priceUpdatedAt`, `fulfillmentUpdatedAt`, `stockLevelUpdatedAt` are separate fields. The diff view could show *what type* of change triggered each entry (e.g., "price updated 2 days ago") rather than just "changed."  
- **Category field** — `aisleLocations[].aisleDescription` \+ `departmentDescription` (e.g., "MEAT", "PRODUCE") present in all records. Reliable signal for anomaly alert grouping.  
- **Cost unit** — `soldBy: "UNIT"` or `"LB"` — maps directly to the cost unit field in the catalog-readiness spec.  
- **Dual availability signals** — `available` (product-level boolean) and `inventory[].instock` (store-level boolean) are separate. A product can be `available: true` but `instock: false`.  
- **Stock level** — `stock.level` (e.g., `"OSS"` \= out of stock slot) alongside `instock` boolean — two separate representations of availability.  
- **Per-store files** — each file is scoped to one `location_code`. Diff computation will need to aggregate across stores for a retailer-level view in IPP.

---

## Session Log

| Date | What was done |
| :---- | :---- |
| 2026-03-04 | Created context doc from Confluence, Ava meeting, Google Docs, Slack, Figma, Google Slides sources |
| 2026-03-04 | PRD review session: addressed MP vs SFP scope, requirements spec, field list stress-test (ShopRite \+ Kroger), acceptance criteria, analytics instrumentation, technical feasibility, stakeholder sign-off |
| 2026-03-04 | Uploaded to Google Doc: [https://docs.google.com/document/d/1K15QRXn5IJIiG8cVyzUI27Nt1K-nrQ8iyGKX6TtON7A/edit](https://docs.google.com/document/d/1K15QRXn5IJIiG8cVyzUI27Nt1K-nrQ8iyGKX6TtON7A/edit) |
| 2026-03-05 | Started IPP prototype (Vite \+ React \+ TDS). Built FeedUpload component with idle/processing states. |
| 2026-03-05 | Placement decision: feature lives within existing **Inventory Files** page (Catalog tab) — upload zone at top, file history table below, diff view replaces table after upload. Updated PRD, AC-1, data flow diagram, and IPP placement accordingly. |

| 2026-03-05 | Iterated on prototype design: replaced table-replacement pattern with full-screen summary panel (slides up from bottom). Added four file statuses with distinct panel views. |  
| 2026-03-05 | Added severity-sorted tabs to completed-file panel (critical → warning → info) with tab icons. Tabs: Catalog quality issues, Unit of measure changes, Size changes, Availability changes, Price & promo updates, New items. |  
| 2026-03-05 | Added AI summary section (purple, sparkle icon) with per-status plain-language explanation. |  
| 2026-03-05 | Added two rejection status panels: "Rejected: Missing fields" (real validation rules: lookup\_code, item\_name, price, cost\_unit, size, available) and "Rejected: Mismatch detected" (item\_name, brand\_name, size format conflicts vs. Instacart catalog). |  
| 2026-03-05 | Added "Also update" column to mismatch panel — proactively surfaces related fields likely affected by each conflict. |  
| 2026-03-05 | Added status badge info tooltips, page description. Removed Manage Validation Rules CTA. |  
| 2026-03-05 | Updated PRD (Feature 1, AC-1, AC-5, AC-6, Hackathon Checklist) to reflect all design decisions. Captured updated Figma frames (nodes 19-2, 20-2, 21-2). |  
