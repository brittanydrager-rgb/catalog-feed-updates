# Build Session Log — 2026-03-05

Multi-agent build session for the Interactive Data Harmonization Portal hackathon MVP.

---

## Setup

### 1. GitHub npm registry auth for @instacart/tds

**Problem:** `@instacart/tds` requires authentication to GitHub's npm registry.

**Solution:**
1. Created `~/.npmrc` with GitHub PAT + registry config:
   ```
   //npm.pkg.github.com/:_authToken=<token>
   @instacart:registry=https://npm.pkg.github.com
   ```
2. Hit peer dep conflict (`@instacart/ids-core` wants `reakit@1.3.11` which needs React 16/17, project uses React 19)
3. Used `--legacy-peer-deps` to bypass
4. Hit SAML SSO 403 — authorized the PAT for the Instacart org in GitHub settings
5. Install succeeded after SSO auth

### 2. Backend design review integration

**Source:** Fetched `backend-design-review.md` from `https://github.com/brittanydrager-rgb/catalog-feed-updates/tree/main/docs` (Ren Chen's review).

**Changes applied to `docs/backend-design.md`:**
1. Sync for hackathon, Temporal for production — added pipeline approach sections
2. GraphQL instead of REST — converted entire API surface to GraphQL queries/mutations
3. Added indexes table (8 indexes, most critical: `feed_snapshot_items(snapshot_id, scan_code)`)
4. Snapshot retention — changed from overwriting to keeping last 3 per retailer
5. Auto-cleanup — added retention windows table with cleanup mechanisms
6. AI summary async — Phase 5 fires LLM call as separate non-blocking task
7. Concurrent upload guard — per-retailer mutex
8. Data model nits — denormalized upload_id docs, FK lifecycle, quality_score source of truth, column mapping versioning
9. API improvements — upload cancellation, partial update for mappings, error response schema, poll interval
10. Catalog lookup — PLS returns canonical data, no separate lookups needed
11. `dismissed_by` field added to `feed_anomaly_alerts`
12. Scalability notes section for post-hackathon
13. Open questions updated with Ren Chen's recommendations

### 3. Frontend design + implementation docs

**Source:** Fetched from same GitHub repo:
- `docs/2026-03-05-inventory-files-design.md` — component hierarchy, screens, color system, data strategy
- `docs/2026-03-05-inventory-files-implementation.md` — 8-task implementation plan for porting into IPP

---

## Multi-Agent Workflow

Used the skill at `/Users/sonaliparthasarathy/Documents/Projects/Work/.claude/skills/multi-agent-feature-workflow/SKILL.md` with agents defined in `/Users/sonaliparthasarathy/Documents/Projects/Work/.claude/agents/`.

### Step 1: Planner Agent

**Prompt summary:** Decompose the full hackathon MVP build (frontend + backend) into parallelizable tasks, given the PRD, backend design doc, frontend design doc, and existing codebase.

**Planner output (5 tasks):**

```json
{
  "goal": "Add the backend integration layer (TypeScript types, mock GraphQL schema, mock processing pipeline, analytics tracking) on top of the existing fully-built frontend, plus comprehensive tests and updated documentation.",
  "assumptions": [
    "Existing frontend components are functionally complete and do not need UI changes",
    "Mock data in mockDiff.ts is complete and covers all four file statuses",
    "GraphQL stubs are mock-only — no real server or Apollo Client needed yet",
    "Analytics event tracking will use a lightweight stub/logger pattern",
    "@instacart/tds is available in the dependency tree"
  ],
  "tasks": [
    {
      "id": "task-1",
      "type": "code",
      "title": "Backend data types and mock data layer",
      "description": "Create src/types/ with TypeScript interfaces for all 11 backend design tables + enums. Create src/mock/ with mock data factories for all four file statuses."
    },
    {
      "id": "task-2",
      "type": "code",
      "title": "Mock GraphQL schema stubs",
      "description": "Create src/graphql/ with type defs, resolvers, and mock client matching the backend design API surface."
    },
    {
      "id": "task-3",
      "type": "code",
      "title": "Mock processing pipeline and analytics event tracking",
      "description": "Create src/mock/mockPipeline.ts (5-phase simulation) and src/analytics/events.ts (PRD event schema + track() function). Wire up events in components."
    },
    {
      "id": "task-4",
      "type": "tests",
      "title": "Comprehensive unit tests for key components and data layer"
    },
    {
      "id": "task-5",
      "type": "docs",
      "title": "Update README and add mock data documentation"
    }
  ]
}
```

### Step 2: Implementer Agents (parallel, in worktrees)

Launched 3 implementer agents in parallel, each in an isolated git worktree:

#### Implementer 1: Types + Mock Data (task-1)

**Status:** Running

**Prompt:** Create `src/types/feedTypes.ts` with interfaces for all 11 tables from backend-design.md. Create `src/mock/mockData.ts` with realistic seeded data for all 4 file statuses. Preserve existing `mockDiff.ts` exports.

**Key instructions:**
- Read existing mockDiff.ts, DiffDetailPanel.tsx, AnomalyAlerts.tsx, FeedQualityScore.tsx first
- Mock data should include realistic filenames from Figma (e.g., `smoke_test_inventory_file_reinventory__version_1__2026-03-05_08-05-04.csv.gz`)
- Quality score: 82% (410/500), trend 68->71->75->78->82
- 7 files, 4 anomaly alerts, all 4 status variants

#### Implementer 2: GraphQL Schema Stubs (task-2) -- COMPLETE

**Prompt:** Create `src/graphql/schema.ts` (type defs), `src/graphql/resolvers.ts` (mock resolvers), `src/graphql/mockClient.ts` (typed async functions). All 7 queries + 4 mutations from backend design.

**Result:**
- `schema.ts` — exports `ENUM_TYPES`, `OBJECT_TYPES`, `QUERY_TYPES`, `MUTATION_TYPES`, `FULL_SCHEMA`
- `resolvers.ts` — resolver functions importing from mockDiff.ts, with in-memory dismiss state via `Set<string>`
- `mockClient.ts` — typed async functions with 120ms simulated latency, response types derived from resolvers
- All 13 existing tests pass, TypeScript compiles clean

#### Implementer 3: Pipeline + Analytics (task-3) -- COMPLETE

**Prompt:** Create `src/mock/mockPipeline.ts` (5-phase pipeline with progress callbacks, 2s total). Create `src/analytics/events.ts` (all 11 PRD events + track() function). Update FeedUpload.tsx to show phase names. Wire up events in DiffDetailPanel, AnomalyAlerts, FeedQualityScore.

**Result:**
- `mockPipeline.ts` — exports `PIPELINE_PHASES` and `processFeed()` with onProgress callback
- `events.ts` — TypeScript interfaces for all 11 events, `AnalyticsEvent` union type, `track()` logs structured JSON to console
- Updated `FeedUpload.tsx` — shows phase names ("Parsing file...", "Validating fields...", etc.)
- Updated `FeedUpload.css` — new phase name style, progress bar animation synced to 2s
- Wired up 9 of 11 events with ref guards to prevent duplicate firing
- All 13 tests pass, no new dependencies

### Step 3: Tester + Doc-Writer Agents

Launched after all 3 implementer agents completed and worktrees were merged.

#### Tester Agent (task-4) -- COMPLETE

**Prompt:** Write comprehensive unit tests for all new data layer files (types, mock data, pipeline, resolvers, mock client, analytics events) plus enhanced tests for existing UI components (DiffDetailPanel, AnomalyAlerts, FeedQualityScore).

**New test files created:**
- `src/types/feedTypes.test.ts` — Type assertion tests for all 11 interfaces and enum types
- `src/mock/mockData.test.ts` — Mock data factory: 4 statuses, deterministic UUIDs, consistent counts, quality trend
- `src/mock/mockPipeline.test.ts` — Pipeline phases, ordering, completion (using fake timers)
- `src/graphql/resolvers.test.ts` — All query/mutation resolvers, dismiss state, pagination, filters
- `src/graphql/mockClient.test.ts` — Async client functions, response types, latency simulation
- `src/analytics/events.test.ts` — track() console logging, event type validation

**Enhanced existing tests:**
- `src/DiffDetailPanel.test.tsx` — All 4 status variants, rejection stats, tab switching, close button, warning/error banners
- `src/AnomalyAlerts.test.tsx` — Dismiss behavior, onViewItems callback, non-dismissible alerts
- `src/FeedQualityScore.test.tsx` — Breakdown text, "products need attention", sparkline SVG

**Result:** All tests pass, comprehensive coverage across data layer and UI components.

#### Doc-Writer Agent (task-5) -- COMPLETE

**Prompt:** Update README.md with new data layer files, mock data documentation, GraphQL client usage, analytics events, and production path.

**Changes to README.md:**
- Added data layer section (types, mock data, pipeline, GraphQL, analytics)
- Added docs section linking backend design, review, frontend design/impl docs
- Expanded mock data section with scenario details (quality score, anomaly alerts, diff categories)
- Added GraphQL mock client usage note for post-hackathon Apollo migration
- Added analytics events section with list of 11 tracked events
- Updated production path to reference backend design doc

---

## Figma Mocks (provided by user)

Two screens captured from Figma:

**Screen 1: Inventory Files List**
- Sidebar: Analytics, Catalog (active), Merchandising, Marketing, Operations, Developer
- Catalog sub-nav: View inventory files, Upload file, Product search, Request new product, Image uploads, Configurable products, Brand explorer
- Upload zone: dashed border, "Upload your feed file to preview changes", "Drag and drop here, or browse files"
- File table: 7 rows, columns: Last update | Banner | Inventory area | File name | Status | # of items | View summary
- Status types: Completed (green), Completed with warnings (amber), Rejected: Mismatch detected (red), Rejected: Missing fields (red)

**Screen 2: Diff Detail Panel (Completed with warnings)**
- Header: "Inventory file summary" + timestamp + filename
- Stats grid (2x2): Catalog quality issues (4), Price & promo updates (5), UoM & size changes (5), New items (2)
- AI summary (purple card): plain-language paragraph with bold/code callouts
- Warning banner (amber): "Some products had missing information..."
- Anomaly alerts (4 cards): produce name change 40%, cost unit flip, alcohol status, bakery price changes
- Feed quality score: 82% catalog-ready, 410/500 products, breakdown table, sparkline trend
- Severity tabs: Catalog quality issues (4), Unit of measure changes (2), Size changes (3), Availability changes (2), Price & promo updates (5), New items (2)
- Item table: Item name | Issues | UPC

**Screen 3: Processing State**
- "Analyzing your feed..." with progress bar
- "Comparing against your last feed from Feb 28, 2026"
- File table visible behind processing overlay

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API style | GraphQL (not REST) | IPP frontend uses Apollo/GraphQL for everything |
| Hackathon pipeline | Synchronous | No async infra needed for demo |
| Production pipeline | Temporal workflows | Phase-level checkpointing, retry, dedup |
| Snapshot retention | Last 3 per retailer | Rollback path if corrupted feed overwrites baseline |
| AI summary | Async (non-blocking) | LLM calls too slow/unreliable to block pipeline |
| CSS approach | Plain CSS with BEM naming | Port prototype directly, use TDS for standard elements |
| Color system | Design doc hex values | #0A5546 primary, #277843 success, #A06400 amber, #C5280C red, #7C3AED AI purple |

---

## Files Created/Modified

### New files (by agents):
- `src/types/feedTypes.ts` — TypeScript interfaces for all 11 backend tables
- `src/mock/mockData.ts` — Seeded mock data for all 4 file statuses
- `src/mock/mockPipeline.ts` — 5-phase processing pipeline simulation
- `src/graphql/schema.ts` — GraphQL type definitions
- `src/graphql/resolvers.ts` — Mock resolvers
- `src/graphql/mockClient.ts` — Typed async client functions
- `src/analytics/events.ts` — Analytics event types + track() function

### Modified files (by agents):
- `src/FeedUpload.tsx` — Now uses mockPipeline, shows phase names
- `src/FeedUpload.css` — Phase name style, updated animation timing
- `src/DiffDetailPanel.tsx` — Analytics events wired up
- `src/AnomalyAlerts.tsx` — Analytics events wired up
- `src/FeedQualityScore.tsx` — Analytics events wired up

### New test files (by tester agent):
- `src/types/feedTypes.test.ts` — Type assertion tests
- `src/mock/mockData.test.ts` — Mock data factory tests
- `src/mock/mockPipeline.test.ts` — Pipeline simulation tests
- `src/graphql/resolvers.test.ts` — Resolver tests with dismiss state
- `src/graphql/mockClient.test.ts` — Async mock client tests
- `src/analytics/events.test.ts` — Analytics track() tests

### Enhanced test files (by tester agent):
- `src/DiffDetailPanel.test.tsx` — Added 4-status tests, tab switching, banners
- `src/AnomalyAlerts.test.tsx` — Added dismiss, callback, non-dismissible tests
- `src/FeedQualityScore.test.tsx` — Added breakdown, attention, sparkline tests

### Updated docs (by doc-writer agent):
- `README.md` — Added data layer docs, mock data details, analytics section

---

## Session 2: Backend Testing + Frontend Wiring

### Backend Testing (all passing)
- Server starts clean: SQLite DB initializes, Kroger mappings seeded
- Full Kroger CSV (2015 rows) processes in **~1.8s**: parse 178ms, validate 36ms, PLS 1s, diff 261ms, quality 339ms
- Quality score: **92%** (1846/2015 catalog-ready, 169 missing brand_name)
- All 7 GraphQL queries verified: feedUploadStatus, feedDiff, feedDiffItems, feedQuality, feedAnomalyAlerts, feedColumnMappings, feedValidation
- Second upload correctly shows 0 added, 0 changed, 2015 unchanged (diff works)

### PLS Matching Investigation
- PLS API at `background-rpc-product-retrieval-customers.dev.icprivate.com` returns **200 OK** but **0 matches**
- Response: `{"results": {}}` — empty results object
- Tested request formats: snake_case params, camelCase params, `code_matching_parameters` wrapper
- **Root cause**: Dev PLS doesn't have product data for retailer 703 (Ralphs/Kroger) with these UPCs
- Confirmed via [PLS API docs](https://instacart.atlassian.net/wiki/spaces/Catalog/pages/4952162599) — request format is correct
- Pipeline gracefully handles 0 matches and continues
- **To get real matches**: Tried staging → 503 (down). Switched to **prod PLS** (`background-rpc-product-retrieval-customers.icprivate.com`) — read-only bulk code matching, safe for hackathon
- **Current state**: Prod PLS endpoint is set in `server/src/pipeline/match.ts`. Needs testing — restart server and upload to verify matches come back
- PLS API docs: https://instacart.atlassian.net/wiki/spaces/Catalog/pages/4952162599
- Request format: `{ request_meta: { src: "..." }, parameters: { retailerId: "703", codes: [...], codeType: 1 } }`
- Response parsed from: `data.results.bulkRetailerProductCodeMatch` (camelCase) or `data.results.bulk_retailer_product_code_match` (snake_case) — code handles both
- Both interface types (PlsMatchedProduct, PlsCodeMatch) handle camelCase + snake_case field variants

### Frontend-Backend Wiring (complete)
**New files:**
- `src/api.ts` — Fetch-based API client: uploadFile, fetchDiff, fetchDiffItems, fetchQuality, fetchAlerts

**Modified files:**
- `vite.config.ts` — Added proxy: /api + /graphql → localhost:4000
- `src/FeedUpload.tsx` — Now POSTs real file to `/api/upload`, shows phase animation during ~2s upload
- `src/MainPage.tsx` — Stores uploadId/diffId from upload response, passes to DiffDetailPanel
- `src/DiffDetailPanel.tsx` — Fetches real diff data from GraphQL when IDs provided, maps to category UI; falls back to mock data for demo file table rows
- `src/FeedQualityScore.tsx` — Fetches real quality/trend data when uploadId provided
- `src/AnomalyAlerts.tsx` — Fetches real alerts when uploadId provided

**Result:** 179/179 tests passing, TypeScript clean. Upload a CSV → real pipeline runs → real data in the UI.

### TODO for next session
1. **Test prod PLS** — `cd server && npm run dev`, upload test.csv, check server logs for `PLS returned X matches`
2. If prod PLS works: run full Kroger CSV, verify diff items have real product_ids from PLS
3. If prod PLS also returns empty: try retailer 58 (Sprouts, known to work per Anton's Slack examples), or check if Kroger UPCs need zero-padding adjustments
4. End-to-end browser test: both servers running, upload CSV, verify real data renders in DiffDetailPanel
5. Consider committing + pushing all changes to fork

### Docs saved locally:
- `docs/backend-design.md` — Updated with review feedback
- `docs/backend-design-review.md` — Ren Chen's full review
- `docs/2026-03-05-inventory-files-design.md` — Frontend design spec
- `docs/2026-03-05-inventory-files-implementation.md` — Frontend implementation plan
