# Catalog Feed Diff Viewer

**Interactive Data Harmonization Portal — Hackathon Prototype for IPP**

A prototype IPP (Instacart Partner Platform) feature that shows retailers a before/after diff of their catalog feed updates, helping them catch data quality issues before they affect their storefront.

## Features

- File upload with drag-and-drop + "Analyzing your feed..." processing state
- File history table with 4 status types (Completed, Completed with warnings, Rejected: Missing fields, Rejected: Mismatch detected)
- Full-screen summary panel with status-specific content
- AI summary section with plain-language explanation of changes
- Severity-sorted change tabs (Critical / Warning / Info)
- Feed Quality Score with catalog-readiness percentage, breakdown, and sparkline trend
- Category-level Anomaly Alerts with dismiss and "View affected items" linking
- Rejection detail views for missing fields and catalog mismatches
- "Also update" suggestions on mismatch items

## Tech Stack

Vite, React 19, TypeScript, @instacart/tds, Plain CSS (BEM naming)

## Getting Started

```sh
npm install
npm run dev    # starts dev server at localhost:5173
npm test       # runs Vitest smoke tests
```

> **Note:** `@instacart/tds` requires GitHub npm registry auth. See `.npmrc` configuration.

## Project Structure

| File | Description |
|---|---|
| `App.tsx` | Root layout (TopNav + Sidebar + MainPage) |
| `MainPage.tsx` | Inventory files page — upload zone, filter bar, file table |
| `FeedUpload.tsx` | Drag-and-drop file upload with processing animation |
| `DiffDetailPanel.tsx` | Full-screen summary panel — stats, AI summary, tabs, item tables |
| `FeedQualityScore.tsx` | Catalog-readiness score with sparkline trend |
| `AnomalyAlerts.tsx` | Dismissible category-level anomaly alert cards |
| `mockDiff.ts` | All seeded mock data (diff categories, quality score, alerts) |
| `TopNav.tsx` / `Sidebar.tsx` | IPP shell chrome |

## Data

All data is seeded mock data. No backend, no real file parsing. Any file dropped into the upload zone triggers the same mock diff scenario.

## Production Path

See the hackathon PRD for full context.

- Production v1 would use post-ingestion catalog store snapshots (Option A)
- The hackathon validates the UX for Phase 3 of the H1'26 Catalog Dashboard roadmap
- Key production dependencies: data-ingestion file retention, PLS bulk matching API, diff computation service

## Team

Sonali Parthasarathy, Brittany Drager, Ren Chen
