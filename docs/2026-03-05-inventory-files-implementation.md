# Inventory Files Feed Diff Viewer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the legacy Inventory Files page in IPP with a feed diff viewer showing upload, status badges, diff detail panel, quality score, and anomaly alerts — all with mock data.

**Architecture:** Replace the body of `InventoryFiles.tsx` (legacy page component) with new React components ported from the standalone prototype. New components go in a `components/` subdirectory alongside the existing `Filters/` directory. Mock data lives in `data/mockDiff.ts`. The existing route, access control, and navigation remain unchanged.

**Tech Stack:** React 19, TypeScript, plain CSS (BEM), TDS components (Button, Alert) from `@retailer-platform/shared-components/src/tds`, existing IPP legacy infrastructure (HeaderPortal, AppHeader, withTrackEventOnMount).

**Base path:** `retailer-tools/retailer-platform-web-workspace/packages/dashboard/src/legacy/routes/reports/files/`

**Prototype source:** `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/`

---

## Task 1: Add mock data module

**Files:**
- Create: `{base}/data/mockDiff.ts`

**Step 1: Create the mock data file**

Copy `mockDiff.ts` from the prototype verbatim. This contains all TypeScript types (`ChangeType`, `AnomalyAlert`, `QualityScore`, `QualityBreakdownEntry`, `FieldChange`, `DiffRow`, `DiffCategory`) and all seeded data (`ANOMALY_ALERTS`, `QUALITY_SCORE`, `QUALITY_SCORE_BREAKDOWN`, `QUALITY_SCORE_TREND`, `DIFF_SUMMARY`, `MOCK_DIFF`, `DIFF_CATEGORIES`, `FAILED_CATEGORIES`, `MISSING_FIELDS_SUMMARY`, `MISMATCH_SUMMARY`).

Source: `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/mockDiff.ts`

**Step 2: Verify TypeScript compiles**

Run: `cd retailer-tools/retailer-platform-web-workspace && npx tsc --noEmit packages/dashboard/src/legacy/routes/reports/files/data/mockDiff.ts 2>&1 | head -20`

Expected: No errors (standalone types, no external imports).

**Step 3: Commit**

```bash
git add retailer-tools/retailer-platform-web-workspace/packages/dashboard/src/legacy/routes/reports/files/data/
git commit -m "feat: add mock data for inventory files feed diff viewer"
```

---

## Task 2: Add FeedUpload component

**Files:**
- Create: `{base}/components/FeedUpload.tsx`
- Create: `{base}/components/FeedUpload.css`

**Step 1: Create FeedUpload.tsx**

Port from prototype's `FeedUpload.tsx`. Keep the same logic: `useImperativeHandle` for external trigger, `useState` for upload/dragging state, `setTimeout` for fake processing, `onComplete` callback with filename. Update CSS import path to `./FeedUpload.css`.

Source: `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/FeedUpload.tsx`

**Step 2: Create FeedUpload.css**

Copy from prototype verbatim.

Source: `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/FeedUpload.css`

**Step 3: Commit**

```bash
git add retailer-tools/retailer-platform-web-workspace/packages/dashboard/src/legacy/routes/reports/files/components/FeedUpload.*
git commit -m "feat: add FeedUpload drag-and-drop component"
```

---

## Task 3: Add FeedQualityScore component

**Files:**
- Create: `{base}/components/FeedQualityScore.tsx`
- Create: `{base}/components/FeedQualityScore.css`

**Step 1: Create FeedQualityScore.tsx**

Port from prototype. Update import path for mock data to `../data/mockDiff`. Update CSS import to `./FeedQualityScore.css`. Contains the `Sparkline` SVG sub-component and the main `FeedQualityScore` component.

Source: `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/FeedQualityScore.tsx`

Changes from prototype:
- `import { QUALITY_SCORE, QUALITY_SCORE_BREAKDOWN, QUALITY_SCORE_TREND } from '../data/mockDiff'`
- `import './FeedQualityScore.css'`

**Step 2: Create FeedQualityScore.css**

Copy from prototype verbatim.

Source: `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/FeedQualityScore.css`

**Step 3: Commit**

```bash
git add retailer-tools/retailer-platform-web-workspace/packages/dashboard/src/legacy/routes/reports/files/components/FeedQualityScore.*
git commit -m "feat: add FeedQualityScore component with sparkline"
```

---

## Task 4: Add AnomalyAlerts component

**Files:**
- Create: `{base}/components/AnomalyAlerts.tsx`
- Create: `{base}/components/AnomalyAlerts.css`

**Step 1: Create AnomalyAlerts.tsx**

Port from prototype. Update mock data import to `../data/mockDiff`. Update CSS import.

Source: `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/AnomalyAlerts.tsx`

Changes from prototype:
- `import { ANOMALY_ALERTS, type AnomalyAlert } from '../data/mockDiff'`
- `import './AnomalyAlerts.css'`

**Step 2: Create AnomalyAlerts.css**

Copy from prototype verbatim.

Source: `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/AnomalyAlerts.css`

**Step 3: Commit**

```bash
git add retailer-tools/retailer-platform-web-workspace/packages/dashboard/src/legacy/routes/reports/files/components/AnomalyAlerts.*
git commit -m "feat: add AnomalyAlerts dismissible alert cards"
```

---

## Task 5: Add DiffDetailPanel component

**Files:**
- Create: `{base}/components/DiffDetailPanel.tsx`
- Create: `{base}/components/DiffDetailPanel.css`

**Step 1: Create DiffDetailPanel.tsx**

Port from prototype. This is the largest component — the full-screen slide-over panel. Update imports:
- Mock data: `from '../data/mockDiff'`
- Sub-components: `from './FeedQualityScore'` and `from './AnomalyAlerts'`
- CSS: `import './DiffDetailPanel.css'`

Source: `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/DiffDetailPanel.tsx`

Changes from prototype:
- `import { DIFF_CATEGORIES, DIFF_SUMMARY, FAILED_CATEGORIES, MISSING_FIELDS_SUMMARY, MISMATCH_SUMMARY, type DiffCategory } from '../data/mockDiff'`
- `import FeedQualityScore from './FeedQualityScore'`
- `import AnomalyAlerts from './AnomalyAlerts'`
- `import './DiffDetailPanel.css'`

**Step 2: Create DiffDetailPanel.css**

Copy from prototype verbatim.

Source: `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/DiffDetailPanel.css`

**Step 3: Commit**

```bash
git add retailer-tools/retailer-platform-web-workspace/packages/dashboard/src/legacy/routes/reports/files/components/DiffDetailPanel.*
git commit -m "feat: add DiffDetailPanel slide-over with tabs and item tables"
```

---

## Task 6: Rewrite InventoryFiles page component

**Files:**
- Modify: `{base}/InventoryFiles.tsx`
- Create: `{base}/InventoryFiles.css`

This is the main integration task — replacing the legacy component body.

**Step 1: Create InventoryFiles.css**

Port the page-level styles from the prototype's `MainPage.css`. This includes:
- `.main-page` / `.main-page__content` layout
- `.inv-page-header` / `.inv-page-title` / `.inv-page-desc` / `.inv-page-actions`
- `.inv-btn` / `.inv-btn--primary` / `.inv-btn--outline` / `.inv-btn--sm`
- `.inv-filters` / `.inv-search` / `.inv-filter-btn`
- `.inv-table` and all table sub-classes
- `.inv-status` badges and tooltips

Source: `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/MainPage.css`

**Step 2: Rewrite InventoryFiles.tsx**

Replace the entire component body. The new component:

1. Keeps `withTrackEventOnMount` wrapper from the existing file
2. Keeps `HeaderPortal` + `AppHeader` for the IPP page header
3. Replaces `PromiseTable` + `fetchInventoryFiles` with a local `useState<FileRow[]>` initialized from mock data
4. Adds `FeedUpload` zone above the table
5. Adds `StatusBadge` inline component for the 4 status types
6. Adds "View summary" button per row that opens `DiffDetailPanel`
7. Removes the `Filters` import and replaces with new inline filter bar (search + dropdowns — non-functional for hackathon)

Key imports to add:
```typescript
import { useRef, useState } from 'react'
import FeedUpload from './components/FeedUpload'
import DiffDetailPanel from './components/DiffDetailPanel'
import './InventoryFiles.css'
```

Key imports to keep:
```typescript
import { HeaderPortal } from '../../../../gin-and-tonic/containers/retailer-scope-wrapper/HeaderPortal'
import AppHeader from '../../../components/AppHeader'
import { withTrackEventOnMount } from '../../../../utils/events/hocs'
import { useDashMessages } from '../../../../intl/intl.hooks'
```

Key imports to remove:
```typescript
// Remove: ContentContainer, PromiseTable, fetchInventoryFiles, Filters, Button, Alert, useHasAccess, CenteredContent
```

The component structure follows `MainPage.tsx` from the prototype almost exactly, but wrapped in IPP's `HeaderPortal` and `withTrackEventOnMount`.

Source: `/home/bento/work/hackerthon/inventory_files/inventory_files/catalog-feed-updates/src/MainPage.tsx` (adapt for IPP integration)

**Step 3: Verify the page loads**

Start the IPP dev server and navigate to `/partners/289/warehouses/0/reports/files`. Confirm:
- Page header shows "View inventory files"
- Upload zone is visible
- File table renders 7 mock rows with status badges
- Clicking "View summary" opens the DiffDetailPanel
- DiffDetailPanel shows stats, AI summary, quality score, anomaly alerts, tabs

Run: `cd retailer-tools/retailer-platform-web-workspace/apps/ipp && ./script/start`

**Step 4: Commit**

```bash
git add retailer-tools/retailer-platform-web-workspace/packages/dashboard/src/legacy/routes/reports/files/InventoryFiles.tsx
git add retailer-tools/retailer-platform-web-workspace/packages/dashboard/src/legacy/routes/reports/files/InventoryFiles.css
git commit -m "feat: rewrite InventoryFiles with feed diff viewer UI"
```

---

## Task 7: Update existing test

**Files:**
- Modify: `{base}/__tests__/InventoryFiles.spec.tsx`

**Step 1: Update the test**

The existing test expects `PromiseTable` with API calls and specific column counts. Since we're replacing the table with mock data, update the test to:
1. Remove API mocking (`apiMock.get.mockResponse`)
2. Assert the page title renders ("View inventory files")
3. Assert the upload zone renders
4. Assert the file table renders with mock data rows

The test should still use `MockGlobalProvider`, `renderRoute`, and `GinAndTonicProvider` from the existing test infrastructure.

```typescript
it('should render the inventory files page', async () => {
  // ... render setup (keep existing route/provider pattern) ...

  await waitFor(() => {
    expect(screen.getByText('View inventory files')).toBeInTheDocument()
  })

  expect(screen.getByText('Upload your feed file to preview changes')).toBeInTheDocument()
  expect(screen.getAllByRole('row').length).toBeGreaterThan(1) // header + data rows
})
```

**Step 2: Run the test**

Run: `cd retailer-tools/retailer-platform-web-workspace && yarn jest packages/dashboard/src/legacy/routes/reports/files/__tests__/InventoryFiles.spec.tsx --no-coverage`

Expected: PASS

**Step 3: Commit**

```bash
git add retailer-tools/retailer-platform-web-workspace/packages/dashboard/src/legacy/routes/reports/files/__tests__/InventoryFiles.spec.tsx
git commit -m "test: update InventoryFiles test for new diff viewer UI"
```

---

## Task 8: Verify all status flows end-to-end

**Files:** None (manual verification)

**Step 1: Test "Completed" flow**

Navigate to the page. Click "View summary" on a row with "Completed" status. Verify the panel shows summary stats (no warning banner), AI summary, quality score, anomaly alerts, and all 6 category tabs.

**Step 2: Test "Completed with warnings" flow**

Click "View summary" on the top row (or upload a file to create one). Verify the panel shows the amber warning banner, quality issues count, and all features.

**Step 3: Test "Rejected: Missing fields" flow**

Click "View summary" on the "Rejected" row. Verify red stats, red error banner, AI summary about missing fields, single "Missing required fields" tab with 4 items.

**Step 4: Test "Rejected: Mismatch detected" flow**

Click "View summary" on the "Rejected - Mismatch" row. Verify red stats, red error banner, AI summary about mismatches, single "Mismatch detected" tab with 3 items showing "Your feed" vs "Instacart catalog" columns and "Also update" suggestions.

**Step 5: Test upload flow**

Drop any file on the upload zone. Verify processing animation (progress bar, filename pill), then new row appears at top of table with green highlight, and DiffDetailPanel auto-opens.

**Step 6: Test anomaly alert interactions**

In the "Completed with warnings" panel, click "View affected items" on an anomaly alert — verify it switches to the correct tab. Click the dismiss X on an alert — verify it disappears.

---

## Summary

| Task | Component | Estimated complexity |
|------|-----------|---------------------|
| 1 | Mock data module | Small — copy + adjust |
| 2 | FeedUpload | Small — port component |
| 3 | FeedQualityScore | Small — port component |
| 4 | AnomalyAlerts | Small — port component |
| 5 | DiffDetailPanel | Medium — largest component, multiple sub-components |
| 6 | InventoryFiles rewrite | Medium — main integration, IPP adaption |
| 7 | Test update | Small — update assertions |
| 8 | E2E verification | Manual — all 4 status flows + upload |

Tasks 1-5 are independent and can be parallelized. Task 6 depends on all of 1-5. Task 7 depends on 6. Task 8 depends on all.
