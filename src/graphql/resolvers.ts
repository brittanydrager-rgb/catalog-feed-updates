/**
 * Mock GraphQL resolvers that return shaped data matching the schema types.
 *
 * These import from the existing mock data in src/mockDiff.ts and reshape it
 * to conform to the GraphQL response contracts.  The dismissAnomalyAlert
 * mutation updates in-memory state so subsequent queries reflect the dismissal.
 */

import {
  ANOMALY_ALERTS,
  DIFF_CATEGORIES,
  DIFF_SUMMARY,
  MOCK_DIFF,
  QUALITY_SCORE,
  QUALITY_SCORE_BREAKDOWN,
  QUALITY_SCORE_TREND,
  type AnomalyAlert as MockAnomalyAlert,
  type DiffCategory as MockDiffCategory,
  type DiffRow,
} from '../mockDiff.ts'

// ---------------------------------------------------------------------------
// In-memory state (survives for the lifetime of the browser session)
// ---------------------------------------------------------------------------

/** Set of alert IDs that have been dismissed via the mutation. */
const dismissedAlertIds = new Set<string>()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_UPLOAD_ID = 'upload-001'
const MOCK_DIFF_ID = 'diff-001'
const MOCK_PREVIOUS_UPLOAD_ID = 'upload-000'

function severityFromCategory(cat: MockDiffCategory): 'critical' | 'warning' | 'info' {
  return cat.severity ?? 'info'
}

function mapFieldChanges(row: DiffRow) {
  return (row.changes ?? []).map(c => ({
    field: c.field,
    previous: c.previous,
    current: c.current,
    isHighSeverity: c.highSeverity ?? false,
  }))
}

function mapDiffItem(row: DiffRow, severity: 'critical' | 'warning' | 'info') {
  const hasHighSev = row.changes?.some(c => c.highSeverity) ?? false
  return {
    scanCode: row.scanCode,
    productId: null,
    productName: row.productName,
    changeType: row.changeType,
    severity: hasHighSev ? 'critical' as const : severity,
    fieldChanges: mapFieldChanges(row),
    isCatalogReady: !row.highSeverity,
    notReadyReasons: row.highSeverity
      ? (row.changes ?? []).filter(c => c.highSeverity).map(c => `invalid_${c.field}`)
      : [],
  }
}

// ---------------------------------------------------------------------------
// Query resolvers
// ---------------------------------------------------------------------------

export function resolveFeedUploadStatus(
  _retailerId: string,
  _uploadId: string,
) {
  return {
    uploadId: MOCK_UPLOAD_ID,
    status: 'completed_with_warnings' as const,
    totalRows: MOCK_DIFF.length,
    validRows: MOCK_DIFF.length - 4,
    invalidRows: 4,
    rejectionReason: null,
    processedAt: '2026-03-05T08:02:35Z',
  }
}

export function resolveFeedValidation(
  _retailerId: string,
  _uploadId: string,
) {
  return {
    status: 'completed_with_warnings' as const,
    summary: {
      totalItems: MOCK_DIFF.length,
      valid: MOCK_DIFF.length - 4,
      invalid: 4,
      blockingErrors: 0,
    },
    violations: [
      {
        itemId: 's1',
        rowNumber: 1,
        field: 'remote_image_url',
        rule: 'required',
        message: 'Missing product image URL',
        severity: 'warning' as const,
      },
      {
        itemId: 's2',
        rowNumber: 2,
        field: 'remote_image_url',
        rule: 'required',
        message: 'Missing product image URL',
        severity: 'warning' as const,
      },
      {
        itemId: 's3',
        rowNumber: 3,
        field: 'item_details',
        rule: 'recommended',
        message: 'Missing nutritional details',
        severity: 'info' as const,
      },
      {
        itemId: 's4',
        rowNumber: 4,
        field: 'brand_name',
        rule: 'required',
        message: 'Missing brand name',
        severity: 'warning' as const,
      },
    ],
  }
}

export function resolveFeedMatches(
  _retailerId: string,
  _uploadId: string,
) {
  const items = MOCK_DIFF.map(row => ({
    scanCode: row.scanCode,
    codeType: 'UPC' as const,
    productId: Math.floor(Math.random() * 90000000) + 10000000,
    matchMethod: 'exact_upc',
    confidence: 0.99,
    alternatives: [] as Array<{ productId: number; score: number }>,
    isDuplicate: false,
  }))

  return {
    matchedCount: items.length,
    unmatchedCount: 0,
    items,
  }
}

export function resolveFeedDiff(
  _retailerId: string,
  _diffId: string,
) {
  const addedCount = DIFF_SUMMARY.newItems
  const removedCount = DIFF_CATEGORIES
    .filter(c => c.changeType === 'removed')
    .reduce((sum, c) => sum + c.count, 0)
  const changedCount = DIFF_CATEGORIES
    .filter(c => c.changeType === 'changed')
    .reduce((sum, c) => sum + c.count, 0)

  return {
    diffId: MOCK_DIFF_ID,
    uploadId: MOCK_UPLOAD_ID,
    previousUploadId: MOCK_PREVIOUS_UPLOAD_ID,
    addedCount,
    removedCount,
    changedCount,
    unchangedCount: 488, // filler to total ~500
    qualityScore: QUALITY_SCORE.score,
    aiSummary:
      'Your March 5 feed was accepted with 4 catalog quality issues to review. ' +
      'Two items are missing product images which reduces storefront visibility. ' +
      '2 unit-of-measure changes were detected. 5 price or promo updates were applied.',
    categories: DIFF_CATEGORIES.map(cat => ({
      id: cat.id,
      label: cat.label,
      severity: severityFromCategory(cat),
      count: cat.count,
    })),
  }
}

export function resolveFeedDiffItems(
  _retailerId: string,
  _diffId: string,
  changeType?: string | null,
  severity?: string | null,
  category?: string | null,
  page = 1,
  perPage = 50,
) {
  // Collect items across categories, applying filters
  let items: ReturnType<typeof mapDiffItem>[] = []

  for (const cat of DIFF_CATEGORIES) {
    if (category && cat.id !== category) continue

    const catSeverity = severityFromCategory(cat)
    for (const row of cat.items) {
      const mapped = mapDiffItem(row, catSeverity)
      if (changeType && mapped.changeType !== changeType) continue
      if (severity && mapped.severity !== severity) continue
      items.push(mapped)
    }
  }

  // Deduplicate by scanCode (items may appear in multiple categories)
  const seen = new Set<string>()
  items = items.filter(item => {
    if (seen.has(item.scanCode)) return false
    seen.add(item.scanCode)
    return true
  })

  const total = items.length
  const start = (page - 1) * perPage
  const paged = items.slice(start, start + perPage)

  return {
    items: paged,
    pagination: { page, perPage, total },
  }
}

export function resolveFeedQuality(_retailerId: string) {
  return {
    current: {
      score: QUALITY_SCORE.score,
      catalogReadyCount: QUALITY_SCORE.catalogReadyCount,
      totalCount: QUALITY_SCORE.totalCount,
      notReadyCount: QUALITY_SCORE.notReadyCount,
      breakdown: QUALITY_SCORE_BREAKDOWN.map(e => ({
        field: e.field,
        count: e.count,
      })),
    },
    trend: QUALITY_SCORE_TREND.map((score, i) => ({
      uploadId: `upload-${String(i).padStart(3, '0')}`,
      score,
      computedAt: new Date(2026, 2, 1 + i).toISOString(),
    })),
  }
}

export function resolveFeedAnomalyAlerts(
  _retailerId: string,
  _uploadId: string,
) {
  const alerts = ANOMALY_ALERTS
    .filter(a => !dismissedAlertIds.has(a.id))
    .map((a: MockAnomalyAlert) => ({
      alertId: a.id,
      type: a.type,
      category: a.category,
      affectedCount: a.affectedCount,
      affectedPct: a.affectedPct,
      description: a.description,
      isDismissible: a.isDismissible,
      dismissedAt: null,
    }))

  return { alerts }
}

// ---------------------------------------------------------------------------
// Mutation resolvers
// ---------------------------------------------------------------------------

export function resolveUploadFeed(
  _retailerId: string,
  _file: string,
) {
  return {
    uploadId: `upload-${Date.now()}`,
    status: 'pending' as const,
  }
}

export function resolveDismissAnomalyAlert(
  _retailerId: string,
  alertId: string,
) {
  dismissedAlertIds.add(alertId)
  const now = new Date().toISOString()
  return { dismissedAt: now }
}

export function resolveCancelFeedUpload(
  _retailerId: string,
  uploadId: string,
) {
  return {
    uploadId,
    status: 'failed' as const,
  }
}

export function resolveUpdateFeedColumnMappings(
  _retailerId: string,
  mappings: Array<{ sourceColumn: string; canonicalField: string; transformRule?: string }>,
) {
  return {
    mappings: mappings.map(m => ({
      sourceColumn: m.sourceColumn,
      canonicalField: m.canonicalField,
      transformRule: m.transformRule ?? null,
    })),
  }
}

// ---------------------------------------------------------------------------
// Convenience: reset in-memory state (useful for tests)
// ---------------------------------------------------------------------------

export function _resetDismissedAlerts(): void {
  dismissedAlertIds.clear()
}
