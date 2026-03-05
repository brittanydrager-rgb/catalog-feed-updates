# Inventory Files Feed Diff Viewer — Hackathon Design

**Date:** 2026-03-05
**Team:** Sonali Parthasarathy, Brittany Drager, Ren Chen
**PRD:** [Interactive Data Harmonization Portal](../../home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/Catalog%20Hackathon_%20Interactive%20Data%20Harmonization%20Portal.md)

---

## Strategic Context

This is a hackathon MVP for Phase 3 of the H1'26 Catalog Retailer Tooling roadmap (Catalog Dashboard). It replaces the existing legacy "Inventory Files" page in IPP with a feed diff viewer that helps retailers catch data quality issues before they affect their storefront.

## Approach

**Replace the legacy InventoryFiles component in-place.** The existing page at `/partners/:id/warehouses/:id/reports/files` already has routing, access control (`Permission.PackagesDashboardReports`), navigation, and lazy loading wired up. We replace the component body — swap the simple download-table for the full diff viewer experience.

### Location

```
packages/dashboard/src/legacy/routes/reports/files/
├── InventoryFiles.tsx              ← rewrite (page shell)
├── InventoryFiles.configuration.ts ← keep as-is (access control)
├── Filters/                        ← keep as-is
├── components/                     ← NEW directory
│   ├── FeedUpload.tsx
│   ├── FeedUpload.css
│   ├── DiffDetailPanel.tsx
│   ├── DiffDetailPanel.css
│   ├── FeedQualityScore.tsx
│   ├── FeedQualityScore.css
│   ├── AnomalyAlerts.tsx
│   ├── AnomalyAlerts.css
│   ├── StatusBadge.tsx
│   └── FileTable.tsx
├── data/
│   └── mockDiff.ts                 ← seeded mock data
├── InventoryFiles.css              ← NEW page-level styles
└── __tests__/
    └── InventoryFiles.spec.tsx     ← existing, update
```

### What stays the same

- Route path: `/partners/:id/warehouses/:id/reports/files`
- Parent component: `Reports.tsx` (lazy loads InventoryFiles)
- Access control: `Permission.PackagesDashboardReports`
- Navigation entry in IPP sidebar
- Existing `Filters/` subdirectory (search, date range, inventory area filters)

---

## Component Hierarchy

```
InventoryFiles (page)
├── HeaderPortal (existing IPP chrome)
├── FeedUpload (drag-and-drop zone)
├── Filters (existing, kept as-is)
├── FileTable (replaces PromiseTable — mock data for hackathon)
│   └── StatusBadge (Completed / Warnings / Rejected / Mismatch)
└── DiffDetailPanel (full-screen slide-over)
    ├── Stats section (status-specific: 2x2 grid)
    ├── AI summary (purple card)
    ├── Warning/Rejection banner
    ├── FeedQualityScore (score + sparkline)
    ├── AnomalyAlerts (dismissible cards)
    └── Tabbed item tables (severity-sorted)
```

---

## Screens & Flows

### Screen 1: Inventory Files List

**Page header:** "View inventory files" title + description + green "Upload file" primary button.

**Upload zone:** Dashed green border, centered upload icon. States:
- Idle: "Upload your feed file to preview changes" + "Drag and drop here, or browse files"
- Hover/Drag: border solid green, darker background
- Processing: document icon, "Analyzing your feed..." text, animated progress bar (2.2s), filename pill

**File table columns:** Chevron | Last update (date + time stacked) | Banner | Inventory area | File name | Status | # of items | "View summary" button

**4 status badge types:**
- Completed: green bg `#EAF6EE`, text `#277843`
- Completed with warnings: yellow bg `#FEF9EC`, amber text `#A06400`
- Rejected: Missing fields: red bg `#FEF0EE`, text `#C5280C`
- Rejected: Mismatch detected: red bg `#FEF0EE`, text `#C5280C`

Each badge has info-icon tooltip explaining the status.

**Actions:**
- Clicking "Upload file" or the upload zone triggers file picker
- Dropping a file starts processing animation, then adds new row to table
- Clicking "View summary" opens DiffDetailPanel

### Screen 2: Diff Detail Panel (slide-over)

Full-screen overlay, slides up from bottom. Backdrop 15% black. Max-width 1200px, centered, scrollable.

**Header:** "Inventory file summary" + timestamp + filename (teal link) + close X.

**Content varies by file status:**

#### Completed with warnings
1. Summary stats (2x2): Catalog quality issues (amber) | Price & promo updates | UoM & size changes (amber) | New items
2. AI summary (purple card): plain-language paragraph with bold callouts and `code` field names
3. Warning banner (amber left-border): "Some products had missing information..."
4. Feed Quality Score: percentage (28px bold green) + "catalog-ready" label + count + breakdown + sparkline
5. Anomaly Alerts: yellow cards with warning/critical icons, "View affected items" links, dismiss buttons
6. Severity-sorted tabs:
   - Critical: Catalog quality issues (4), Unit of measure changes (2)
   - Warning: Size changes (3), Availability changes (2)
   - Info: Price & promo updates (5), New items (2)
7. Item table per tab with category-specific columns

#### Rejected: Missing fields
1. Stats (red): Items affected, Fields missing, Validation errors, Rejection reason
2. AI summary explaining rejection
3. Red error banner: "Fix the missing required fields below and re-upload"
4. Single tab: "Missing required fields" — items with issues

#### Rejected: Mismatch detected
1. Stats (red): Items affected, Conflicts detected, Rejection reason
2. AI summary explaining mismatches
3. Red error banner: "Correct the mismatched values below"
4. Single tab: "Mismatch detected" — Item name | Field | Your feed (red) | Instacart catalog (gray) | Also update (suggested fields)

---

## Data Strategy

### Phase 1 (Hackathon)

All data from `mockDiff.ts`. No API calls. Any file dropped triggers the same mock diff scenario.

Mock data scope:
- 7 files in file table (all "The Garden" retailer, UAT areas)
- 14 diff items across 6 categories for "completed with warnings"
- 4 failed items for "rejected missing fields"
- 3 mismatch items for "rejected mismatch"
- Quality score: 82% (410/500), trend 68 -> 71 -> 75 -> 78 -> 82
- 2 anomaly alerts (bulk name change 40% in Produce, cost unit flip for 2 items)

### Phase 2 (Post-hackathon)

Swap mock imports for GraphQL queries via Mesh gateway. Backend pipeline:
1. Parse (detect format, map columns via `feed_column_mappings`)
2. Validate (required fields, duplicates)
3. PLS Match (`GetBulkRetailerProductCodeMatching` in 10k batches)
4. Diff Computation (against previous `feed_snapshot`)
5. Quality Score & Anomaly Detection

See [backend-design.md](../../home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/docs/backend-design.md) for full data model and API surface.

---

## Styling

Port prototype's plain CSS (BEM naming) directly. Use existing TDS components (`Button`, `Alert` from `@retailer-platform/shared-components/src/tds`) for buttons and alerts. Custom CSS for diff-specific UI (status badges, sparkline, detail panel, item tables).

### Color system
| Token | Hex | Usage |
|-------|-----|-------|
| Primary green | `#0A5546` | Buttons, links, accents |
| Success green | `#277843` | Completed status, positive values |
| Warning amber | `#A06400` | Warnings, quality attention |
| Error red | `#C5280C` | Rejections, critical severity |
| AI purple | `#7C3AED` | AI summary card |
| Text primary | `#030213` | Headings, body |
| Text secondary | `#343538` | Secondary body |
| Text tertiary | `#717182` | Labels, captions |
| Border | `#E8E9EB` | Dividers, table borders |

---

## What We Skip for Hackathon

- TopNav and Sidebar (IPP provides these)
- Real file parsing / backend processing
- React Intl translations (hardcoded English strings)
- Real API integration / GraphQL queries
- Search and filter functionality (keep existing Filters UI but non-functional for new features)
- Pagination
- Responsive design
- Tests beyond existing spec updates

---

## Risks

| Risk | Mitigation |
|------|------------|
| Legacy code patterns (class components, PromiseTable) may clash | We replace the component body entirely, keeping only the integration points |
| CSS conflicts with IPP global styles | BEM naming with unique prefixes (`inv-`, `ddp-`, `feed-upload__`, etc.) |
| TDS component gaps | Custom CSS for diff-specific UI; only use TDS for standard elements |
| Access control may not match demo needs | Existing `PackagesDashboardReports` permission should work for demo |

