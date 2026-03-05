import { describe, it, expect, beforeEach } from 'vitest'
import {
  resolveFeedUploadStatus,
  resolveFeedValidation,
  resolveFeedMatches,
  resolveFeedDiff,
  resolveFeedDiffItems,
  resolveFeedQuality,
  resolveFeedAnomalyAlerts,
  resolveUploadFeed,
  resolveDismissAnomalyAlert,
  resolveCancelFeedUpload,
  resolveUpdateFeedColumnMappings,
  _resetDismissedAlerts,
} from './resolvers'

beforeEach(() => {
  _resetDismissedAlerts()
})

// ── Query resolvers ────────────────────────────────────────────────────────

describe('resolveFeedUploadStatus', () => {
  it('returns the expected shape', () => {
    const result = resolveFeedUploadStatus('r1', 'u1')
    expect(result).toHaveProperty('uploadId')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('totalRows')
    expect(result).toHaveProperty('validRows')
    expect(result).toHaveProperty('invalidRows')
    expect(result).toHaveProperty('rejectionReason')
    expect(result).toHaveProperty('processedAt')
  })

  it('returns status completed_with_warnings', () => {
    const result = resolveFeedUploadStatus('r1', 'u1')
    expect(result.status).toBe('completed_with_warnings')
  })

  it('totalRows = validRows + invalidRows', () => {
    const result = resolveFeedUploadStatus('r1', 'u1')
    expect(result.totalRows).toBe(result.validRows + result.invalidRows)
  })
})

describe('resolveFeedValidation', () => {
  it('returns the expected shape with summary and violations', () => {
    const result = resolveFeedValidation('r1', 'u1')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('violations')
    expect(result.summary).toHaveProperty('totalItems')
    expect(result.summary).toHaveProperty('valid')
    expect(result.summary).toHaveProperty('invalid')
    expect(result.summary).toHaveProperty('blockingErrors')
  })

  it('has violations with correct fields', () => {
    const result = resolveFeedValidation('r1', 'u1')
    expect(result.violations.length).toBeGreaterThan(0)
    result.violations.forEach(v => {
      expect(v).toHaveProperty('itemId')
      expect(v).toHaveProperty('field')
      expect(v).toHaveProperty('rule')
      expect(v).toHaveProperty('message')
      expect(v).toHaveProperty('severity')
    })
  })

  it('has 4 violations', () => {
    const result = resolveFeedValidation('r1', 'u1')
    expect(result.violations).toHaveLength(4)
  })
})

describe('resolveFeedMatches', () => {
  it('returns matchedCount and items array', () => {
    const result = resolveFeedMatches('r1', 'u1')
    expect(result).toHaveProperty('matchedCount')
    expect(result).toHaveProperty('unmatchedCount')
    expect(result).toHaveProperty('items')
    expect(result.matchedCount).toBe(result.items.length)
  })

  it('each match item has required fields', () => {
    const result = resolveFeedMatches('r1', 'u1')
    result.items.forEach(item => {
      expect(item).toHaveProperty('scanCode')
      expect(item).toHaveProperty('codeType')
      expect(item).toHaveProperty('productId')
      expect(item).toHaveProperty('matchMethod')
      expect(item).toHaveProperty('confidence')
    })
  })
})

describe('resolveFeedDiff', () => {
  it('returns the expected shape with counts and categories', () => {
    const result = resolveFeedDiff('r1', 'd1')
    expect(result).toHaveProperty('diffId')
    expect(result).toHaveProperty('uploadId')
    expect(result).toHaveProperty('previousUploadId')
    expect(result).toHaveProperty('addedCount')
    expect(result).toHaveProperty('removedCount')
    expect(result).toHaveProperty('changedCount')
    expect(result).toHaveProperty('unchangedCount')
    expect(result).toHaveProperty('qualityScore')
    expect(result).toHaveProperty('aiSummary')
    expect(result).toHaveProperty('categories')
  })

  it('has a quality score of 82', () => {
    const result = resolveFeedDiff('r1', 'd1')
    expect(result.qualityScore).toBe(82)
  })

  it('categories have id, label, severity, and count', () => {
    const result = resolveFeedDiff('r1', 'd1')
    expect(result.categories.length).toBeGreaterThan(0)
    result.categories.forEach(cat => {
      expect(cat).toHaveProperty('id')
      expect(cat).toHaveProperty('label')
      expect(cat).toHaveProperty('severity')
      expect(cat).toHaveProperty('count')
    })
  })
})

describe('resolveFeedDiffItems', () => {
  it('returns items with pagination', () => {
    const result = resolveFeedDiffItems('r1', 'd1')
    expect(result).toHaveProperty('items')
    expect(result).toHaveProperty('pagination')
    expect(result.pagination).toHaveProperty('page')
    expect(result.pagination).toHaveProperty('perPage')
    expect(result.pagination).toHaveProperty('total')
  })

  it('each item has expected fields', () => {
    const result = resolveFeedDiffItems('r1', 'd1')
    result.items.forEach(item => {
      expect(item).toHaveProperty('scanCode')
      expect(item).toHaveProperty('changeType')
      expect(item).toHaveProperty('severity')
      expect(item).toHaveProperty('fieldChanges')
      expect(item).toHaveProperty('isCatalogReady')
    })
  })

  it('pagination defaults to page 1, perPage 50', () => {
    const result = resolveFeedDiffItems('r1', 'd1')
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.perPage).toBe(50)
  })

  it('supports pagination with page and perPage', () => {
    const page1 = resolveFeedDiffItems('r1', 'd1', null, null, null, 1, 2)
    const page2 = resolveFeedDiffItems('r1', 'd1', null, null, null, 2, 2)
    expect(page1.items.length).toBeLessThanOrEqual(2)
    expect(page2.pagination.page).toBe(2)
    // Pages should not overlap
    if (page1.items.length > 0 && page2.items.length > 0) {
      expect(page1.items[0].scanCode).not.toBe(page2.items[0].scanCode)
    }
  })

  it('filters by category', () => {
    const result = resolveFeedDiffItems('r1', 'd1', null, null, 'sellability')
    result.items.forEach(item => {
      // Items from the sellability category should be 'changed' type
      expect(item.changeType).toBe('changed')
    })
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('filters by changeType', () => {
    const result = resolveFeedDiffItems('r1', 'd1', 'added')
    result.items.forEach(item => {
      expect(item.changeType).toBe('added')
    })
  })

  it('filters by severity', () => {
    const result = resolveFeedDiffItems('r1', 'd1', null, 'critical')
    result.items.forEach(item => {
      expect(item.severity).toBe('critical')
    })
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('combined filters reduce result set', () => {
    const allItems = resolveFeedDiffItems('r1', 'd1')
    const filtered = resolveFeedDiffItems('r1', 'd1', null, 'critical', 'sellability')
    expect(filtered.items.length).toBeLessThanOrEqual(allItems.items.length)
  })
})

describe('resolveFeedQuality', () => {
  it('returns current score and trend', () => {
    const result = resolveFeedQuality('r1')
    expect(result).toHaveProperty('current')
    expect(result).toHaveProperty('trend')
  })

  it('current score is 82 with correct breakdown', () => {
    const result = resolveFeedQuality('r1')
    expect(result.current.score).toBe(82)
    expect(result.current.catalogReadyCount).toBe(410)
    expect(result.current.totalCount).toBe(500)
    expect(result.current.notReadyCount).toBe(90)
    expect(result.current.breakdown.length).toBeGreaterThan(0)
  })

  it('trend contains the expected score values [68, 71, 75, 78, 82]', () => {
    const result = resolveFeedQuality('r1')
    const scores = result.trend.map(t => t.score)
    expect(scores).toEqual([68, 71, 75, 78, 82])
  })

  it('trend entries have uploadId and computedAt', () => {
    const result = resolveFeedQuality('r1')
    result.trend.forEach(t => {
      expect(t).toHaveProperty('uploadId')
      expect(t).toHaveProperty('score')
      expect(t).toHaveProperty('computedAt')
    })
  })
})

describe('resolveFeedAnomalyAlerts', () => {
  it('returns alerts array', () => {
    const result = resolveFeedAnomalyAlerts('r1', 'u1')
    expect(result).toHaveProperty('alerts')
    expect(result.alerts.length).toBeGreaterThan(0)
  })

  it('each alert has expected fields', () => {
    const result = resolveFeedAnomalyAlerts('r1', 'u1')
    result.alerts.forEach(alert => {
      expect(alert).toHaveProperty('alertId')
      expect(alert).toHaveProperty('type')
      expect(alert).toHaveProperty('category')
      expect(alert).toHaveProperty('affectedCount')
      expect(alert).toHaveProperty('affectedPct')
      expect(alert).toHaveProperty('description')
      expect(alert).toHaveProperty('isDismissible')
      expect(alert).toHaveProperty('dismissedAt')
    })
  })

  it('excludes dismissed alerts', () => {
    const before = resolveFeedAnomalyAlerts('r1', 'u1')
    const alertId = before.alerts[0].alertId
    resolveDismissAnomalyAlert('r1', alertId)
    const after = resolveFeedAnomalyAlerts('r1', 'u1')
    expect(after.alerts.length).toBe(before.alerts.length - 1)
    expect(after.alerts.find(a => a.alertId === alertId)).toBeUndefined()
  })
})

// ── Mutation resolvers ─────────────────────────────────────────────────────

describe('resolveUploadFeed', () => {
  it('returns uploadId and pending status', () => {
    const result = resolveUploadFeed('r1', 'file.csv')
    expect(result).toHaveProperty('uploadId')
    expect(result.status).toBe('pending')
    expect(result.uploadId).toMatch(/^upload-/)
  })
})

describe('resolveDismissAnomalyAlert', () => {
  it('returns a dismissedAt timestamp', () => {
    const result = resolveDismissAnomalyAlert('r1', 'alert-1')
    expect(result).toHaveProperty('dismissedAt')
    expect(typeof result.dismissedAt).toBe('string')
    // Should be a valid ISO date
    expect(new Date(result.dismissedAt).toISOString()).toBe(result.dismissedAt)
  })

  it('dismissed alert disappears from subsequent query', () => {
    const before = resolveFeedAnomalyAlerts('r1', 'u1')
    const alertId = before.alerts[0].alertId
    resolveDismissAnomalyAlert('r1', alertId)
    const after = resolveFeedAnomalyAlerts('r1', 'u1')
    const dismissed = after.alerts.find(a => a.alertId === alertId)
    expect(dismissed).toBeUndefined()
  })
})

describe('resolveCancelFeedUpload', () => {
  it('returns uploadId and failed status', () => {
    const result = resolveCancelFeedUpload('r1', 'upload-001')
    expect(result.uploadId).toBe('upload-001')
    expect(result.status).toBe('failed')
  })
})

describe('resolveUpdateFeedColumnMappings', () => {
  it('returns the mappings passed in', () => {
    const input = [
      { sourceColumn: 'SKU', canonicalField: 'scan_code' },
      { sourceColumn: 'PRICE', canonicalField: 'price', transformRule: 'parseFloat' },
    ]
    const result = resolveUpdateFeedColumnMappings('r1', input)
    expect(result.mappings).toHaveLength(2)
    expect(result.mappings[0].sourceColumn).toBe('SKU')
    expect(result.mappings[0].canonicalField).toBe('scan_code')
    expect(result.mappings[0].transformRule).toBeNull()
    expect(result.mappings[1].transformRule).toBe('parseFloat')
  })
})

// ── _resetDismissedAlerts ──────────────────────────────────────────────────

describe('_resetDismissedAlerts', () => {
  it('clears all dismissed alerts so they reappear', () => {
    const initial = resolveFeedAnomalyAlerts('r1', 'u1')
    // Dismiss all alerts
    initial.alerts.forEach(a => resolveDismissAnomalyAlert('r1', a.alertId))
    const afterDismiss = resolveFeedAnomalyAlerts('r1', 'u1')
    expect(afterDismiss.alerts).toHaveLength(0)

    _resetDismissedAlerts()

    const afterReset = resolveFeedAnomalyAlerts('r1', 'u1')
    expect(afterReset.alerts.length).toBe(initial.alerts.length)
  })
})
