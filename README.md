# Catalog Feed Diff Viewer

**Interactive Data Harmonization Portal — Hackathon Prototype for IPP**

A prototype IPP (Instacart Partner Platform) feature that shows retailers a before/after diff of their catalog feed updates, helping them catch data quality issues before they affect their storefront.

## Features

- File upload with drag-and-drop + 5-phase "Analyzing your feed..." processing pipeline
- File history table with 4 status types (Completed, Completed with warnings, Rejected: Missing fields, Rejected: Mismatch detected)
- Full-screen summary panel with status-specific content
- AI summary section with plain-language explanation of changes
- Severity-sorted change tabs (Critical / Warning / Info)
- Feed Quality Score with catalog-readiness percentage, breakdown, and sparkline trend
- Category-level Anomaly Alerts with dismiss and "View affected items" linking
- Rejection detail views for missing fields and catalog mismatches
- "Also update" suggestions on mismatch items
- Mock GraphQL API layer (schema, resolvers, typed client)
- Analytics event tracking (11 event types, console logger)

## Tech Stack

Vite, React 19, TypeScript, @instacart/tds, Plain CSS (BEM naming)

## Getting Started

```sh
npm install
npm run dev    # starts dev server at localhost:5173
npm test       # runs Vitest tests
```

> **Note:** `@instacart/tds` requires GitHub npm registry auth. See `.npmrc` configuration.

## Project Structure

### Frontend Components

| File | Description |
|---|---|
| `App.tsx` | Root layout (TopNav + Sidebar + MainPage) |
| `MainPage.tsx` | Inventory files page — upload zone, filter bar, file table |
| `FeedUpload.tsx` | Drag-and-drop file upload with 5-phase processing animation |
| `DiffDetailPanel.tsx` | Full-screen summary panel — stats, AI summary, tabs, item tables |
| `FeedQualityScore.tsx` | Catalog-readiness score with sparkline trend |
| `AnomalyAlerts.tsx` | Dismissible category-level anomaly alert cards |
| `TopNav.tsx` / `Sidebar.tsx` | IPP shell chrome |

### Data Layer

| File | Description |
|---|---|
| `mockDiff.ts` | Seeded mock data (diff categories, quality score, alerts) |
| `types/feedTypes.ts` | TypeScript interfaces for all 11 backend design tables |
| `mock/mockData.ts` | Typed mock data factories for all 4 file statuses |
| `mock/mockPipeline.ts` | 5-phase processing pipeline simulation (~2s) |
| `graphql/schema.ts` | GraphQL type definitions (enums, objects, queries, mutations) |
| `graphql/resolvers.ts` | Mock resolvers returning shaped data from `mockDiff.ts` |
| `graphql/mockClient.ts` | Typed async client with simulated 120ms latency |
| `analytics/events.ts` | 11 analytics event types + `track()` logger |

### Docs

| File | Description |
|---|---|
| `docs/backend-design.md` | Backend ERD, pipeline, API surface, scalability notes |
| `docs/backend-design-review.md` | Ren Chen's backend review |
| `docs/2026-03-05-inventory-files-design.md` | Frontend design spec |
| `docs/2026-03-05-inventory-files-implementation.md` | Frontend implementation plan |

## Mock Data

All data is seeded and deterministic. No backend, no real file parsing. Any file dropped into the upload zone triggers the same mock diff scenario.

**Mock scenario:**
- 7 files in the history table across all 4 statuses
- Quality score: 82% (410/500 products catalog-ready), trend: 68 → 71 → 75 → 78 → 82
- 4 anomaly alerts (bulk name change, cost unit flip, alcohol flag, bakery price)
- 6 diff categories: catalog quality (4), UoM (2), size (3), availability (2), price/promo (5), new items (2)

**GraphQL mock client** (`src/graphql/mockClient.ts`) exposes typed async functions for all 7 queries and 4 mutations from the backend design. Swap each function body to use `client.query()` / `client.mutate()` for real Apollo Client integration post-hackathon.

**Pipeline simulation** (`src/mock/mockPipeline.ts`) runs 5 phases: Parsing → Validating → Matching → Computing diff → Analyzing quality (~2s total).

## Analytics

11 event types defined in `src/analytics/events.ts`, matching the PRD spec. The `track()` function logs structured JSON to the console. Wire to a real analytics backend post-hackathon.

Events tracked: page viewed, product expanded, filter applied, feed compared, anomaly alert viewed/expanded/dismissed, quality score viewed, breakdown viewed, product clicked, trend viewed.

## Production Path

See `docs/backend-design.md` for full architecture and the hackathon PRD for product context.

- Production v1 would use post-ingestion catalog store snapshots (Option A)
- The hackathon validates the UX for Phase 3 of the H1'26 Catalog Dashboard roadmap
- Key production dependencies: data-ingestion file retention, PLS bulk matching API, diff computation service
- Pipeline: sync for hackathon, Temporal workflows for production

## Team

Sonali Parthasarathy, Brittany Drager, Ren Chen
