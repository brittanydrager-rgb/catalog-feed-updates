import { describe, it, expect } from 'vitest'
import {
  mockFeedUploads,
  mockFeedItems,
  mockFeedItems_upload1,
  mockFeedItems_upload2,
  mockFeedItems_upload3,
  mockFeedItems_upload4,
  mockFeedItemValidations,
  mockPlsMatchResults,
  mockFeedSnapshots,
  mockFeedSnapshotItems,
  mockFeedDiffs,
  mockFeedDiffItems,
  mockFeedAnomalyAlerts,
  mockFeedQualityScoreHistory,
  mockFeedColumnMappings,
  getUploadByStatus,
  getItemsForUpload,
  getValidationsForUpload,
  getMatchesForUpload,
  getDiffForUpload,
  getDiffItemsForDiff,
  getAlertsForUpload,
  getQualityScoreTrend,
  getColumnMappings,
} from './mockData'

// ── Feed Uploads ───────────────────────────────────────────────────────────

describe('mockFeedUploads', () => {
  it('contains exactly 4 uploads', () => {
    expect(mockFeedUploads).toHaveLength(4)
  })

  it('has all 4 statuses: completed, completed_with_warnings, rejected_mismatch, rejected_missing_fields', () => {
    const statuses = mockFeedUploads.map(u => u.status)
    expect(statuses).toContain('completed')
    expect(statuses).toContain('completed_with_warnings')
    expect(statuses).toContain('rejected_mismatch')
    expect(statuses).toContain('rejected_missing_fields')
  })

  it('uses deterministic UUIDs (not random)', () => {
    // The upload IDs should be stable across runs
    expect(mockFeedUploads[0].upload_id).toBe('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
    expect(mockFeedUploads[1].upload_id).toBe('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e')
    expect(mockFeedUploads[2].upload_id).toBe('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f')
    expect(mockFeedUploads[3].upload_id).toBe('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a')
  })

  it('total_rows = valid_rows + invalid_rows for every upload', () => {
    mockFeedUploads.forEach(u => {
      expect(u.total_rows).toBe(u.valid_rows + u.invalid_rows)
    })
  })

  it('file names contain "smoke_test_inventory_file"', () => {
    mockFeedUploads.forEach(u => {
      expect(u.file_name).toContain('smoke_test_inventory_file')
    })
  })

  it('rejected uploads have a non-null rejection_reason', () => {
    const rejected = mockFeedUploads.filter(u => u.status.startsWith('rejected'))
    expect(rejected).toHaveLength(2)
    rejected.forEach(u => {
      expect(u.rejection_reason).not.toBeNull()
      expect(u.rejection_reason!.length).toBeGreaterThan(0)
    })
  })

  it('completed uploads have null rejection_reason', () => {
    const completed = mockFeedUploads.filter(u => u.status.startsWith('completed'))
    expect(completed).toHaveLength(2)
    completed.forEach(u => {
      expect(u.rejection_reason).toBeNull()
    })
  })

  it('all uploads have a retailer_id of 12345', () => {
    mockFeedUploads.forEach(u => {
      expect(u.retailer_id).toBe(12345)
    })
  })

  it('all uploads have valid ISO 8601 timestamps', () => {
    mockFeedUploads.forEach(u => {
      expect(new Date(u.uploaded_at).toISOString()).toBe(u.uploaded_at)
      expect(new Date(u.created_at).toISOString()).toBe(u.created_at)
    })
  })
})

// ── Feed Items ─────────────────────────────────────────────────────────────

describe('mockFeedItems', () => {
  it('upload 1 (completed_with_warnings) has 10 items', () => {
    expect(mockFeedItems_upload1).toHaveLength(10)
  })

  it('upload 2 (completed) has 12 items', () => {
    expect(mockFeedItems_upload2).toHaveLength(12)
  })

  it('upload 3 (rejected_mismatch) has 8 items', () => {
    expect(mockFeedItems_upload3).toHaveLength(8)
  })

  it('upload 4 (rejected_missing_fields) has 4 items', () => {
    expect(mockFeedItems_upload4).toHaveLength(4)
  })

  it('aggregate mockFeedItems contains all items from all uploads', () => {
    const totalExpected =
      mockFeedItems_upload1.length +
      mockFeedItems_upload2.length +
      mockFeedItems_upload3.length +
      mockFeedItems_upload4.length
    expect(mockFeedItems).toHaveLength(totalExpected)
  })

  it('every item has a deterministic item_id', () => {
    const ids = mockFeedItems.map(fi => fi.item_id)
    // They should contain the pattern from seededUuid
    ids.forEach(id => {
      expect(id).toMatch(/^[a-z0-9]+-[a-f0-9]{4}-4[a-f0-9]{3}-8000-[a-f0-9]+$/)
    })
  })

  it('row_numbers are sequential within each upload', () => {
    for (const items of [mockFeedItems_upload1, mockFeedItems_upload2, mockFeedItems_upload3, mockFeedItems_upload4]) {
      items.forEach((item, i) => {
        expect(item.row_number).toBe(i + 1)
      })
    }
  })
})

// ── Feed Item Validations ──────────────────────────────────────────────────

describe('mockFeedItemValidations', () => {
  it('has validations only for upload 4 (rejected_missing_fields)', () => {
    const uploadIds = new Set(mockFeedItemValidations.map(v => v.upload_id))
    expect(uploadIds.size).toBe(1)
    expect(uploadIds.has(mockFeedUploads[3].upload_id)).toBe(true)
  })

  it('contains at least one blocking error', () => {
    const blocking = mockFeedItemValidations.filter(v => v.is_blocking)
    expect(blocking.length).toBeGreaterThan(0)
  })

  it('each validation references an item_id that exists in upload 4', () => {
    const upload4ItemIds = new Set(mockFeedItems_upload4.map(fi => fi.item_id))
    mockFeedItemValidations.forEach(v => {
      expect(upload4ItemIds.has(v.item_id)).toBe(true)
    })
  })
})

// ── PLS Match Results ──────────────────────────────────────────────────────

describe('mockPlsMatchResults', () => {
  it('has matches for uploads 1, 2, and 3 (not upload 4)', () => {
    const uploadIds = new Set(mockPlsMatchResults.map(m => m.upload_id))
    expect(uploadIds.has(mockFeedUploads[0].upload_id)).toBe(true)
    expect(uploadIds.has(mockFeedUploads[1].upload_id)).toBe(true)
    expect(uploadIds.has(mockFeedUploads[2].upload_id)).toBe(true)
    expect(uploadIds.has(mockFeedUploads[3].upload_id)).toBe(false)
  })

  it('total match count = items in upload 1 + 2 + 3', () => {
    const expected = mockFeedItems_upload1.length + mockFeedItems_upload2.length + mockFeedItems_upload3.length
    expect(mockPlsMatchResults).toHaveLength(expected)
  })

  it('all matches have a non-null matched_product_id', () => {
    mockPlsMatchResults.forEach(m => {
      expect(m.matched_product_id).not.toBeNull()
    })
  })
})

// ── Feed Snapshots ─────────────────────────────────────────────────────────

describe('mockFeedSnapshots', () => {
  it('contains 2 snapshots', () => {
    expect(mockFeedSnapshots).toHaveLength(2)
  })

  it('snapshots use deterministic UUIDs', () => {
    expect(mockFeedSnapshots[0].snapshot_id).toBe('11111111-2222-4333-8444-555566667777')
    expect(mockFeedSnapshots[1].snapshot_id).toBe('22222222-3333-4444-8555-666677778888')
  })

  it('both have snapshot_type pre_ingestion', () => {
    mockFeedSnapshots.forEach(s => {
      expect(s.snapshot_type).toBe('pre_ingestion')
    })
  })
})

// ── Feed Snapshot Items ────────────────────────────────────────────────────

describe('mockFeedSnapshotItems', () => {
  it('contains 10 items (matching the pre-upload catalog)', () => {
    expect(mockFeedSnapshotItems).toHaveLength(10)
  })

  it('all reference snapshot 1', () => {
    mockFeedSnapshotItems.forEach(si => {
      expect(si.snapshot_id).toBe('11111111-2222-4333-8444-555566667777')
    })
  })
})

// ── Feed Diffs ─────────────────────────────────────────────────────────────

describe('mockFeedDiffs', () => {
  it('contains 2 diffs', () => {
    expect(mockFeedDiffs).toHaveLength(2)
  })

  it('uses deterministic diff UUIDs', () => {
    expect(mockFeedDiffs[0].diff_id).toBe('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b')
    expect(mockFeedDiffs[1].diff_id).toBe('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c')
  })

  it('diff 1 has quality_score 82', () => {
    expect(mockFeedDiffs[0].quality_score).toBe(82)
  })

  it('diff 2 has quality_score 100', () => {
    expect(mockFeedDiffs[1].quality_score).toBe(100)
  })

  it('each diff has an ai_summary string', () => {
    mockFeedDiffs.forEach(d => {
      expect(d.ai_summary).not.toBeNull()
      expect(typeof d.ai_summary).toBe('string')
      expect(d.ai_summary!.length).toBeGreaterThan(0)
    })
  })
})

// ── Feed Diff Items ────────────────────────────────────────────────────────

describe('mockFeedDiffItems', () => {
  it('all reference diff 1', () => {
    mockFeedDiffItems.forEach(di => {
      expect(di.diff_id).toBe('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b')
    })
  })

  it('contains items with critical, warning, and info severities', () => {
    const sevs = new Set(mockFeedDiffItems.map(di => di.severity))
    expect(sevs.has('critical')).toBe(true)
    expect(sevs.has('warning')).toBe(true)
    expect(sevs.has('info')).toBe(true)
  })

  it('each item has a non-empty change_summary', () => {
    mockFeedDiffItems.forEach(di => {
      expect(di.change_summary).not.toBeNull()
      expect(di.change_summary!.length).toBeGreaterThan(0)
    })
  })
})

// ── Feed Anomaly Alerts ────────────────────────────────────────────────────

describe('mockFeedAnomalyAlerts', () => {
  it('contains exactly 4 alerts', () => {
    expect(mockFeedAnomalyAlerts).toHaveLength(4)
  })

  it('has correct alert types', () => {
    const types = mockFeedAnomalyAlerts.map(a => a.alert_type)
    expect(types).toContain('bulk_name_change')
    expect(types).toContain('cost_unit_flip')
    expect(types).toContain('alcohol_flag_change')
    expect(types).toContain('bulk_price_change')
  })

  it('all alerts reference upload 1 and diff 1', () => {
    mockFeedAnomalyAlerts.forEach(a => {
      expect(a.upload_id).toBe(mockFeedUploads[0].upload_id)
      expect(a.diff_id).toBe(mockFeedDiffs[0].diff_id)
    })
  })

  it('alcohol_flag_change alert is not dismissible', () => {
    const alcoholAlert = mockFeedAnomalyAlerts.find(a => a.alert_type === 'alcohol_flag_change')
    expect(alcoholAlert).toBeDefined()
    expect(alcoholAlert!.is_dismissible).toBe(false)
  })

  it('none of the alerts are initially dismissed', () => {
    mockFeedAnomalyAlerts.forEach(a => {
      expect(a.dismissed_at).toBeNull()
    })
  })
})

// ── Quality Score History ──────────────────────────────────────────────────

describe('mockFeedQualityScoreHistory', () => {
  it('contains 5 entries for the sparkline trend', () => {
    expect(mockFeedQualityScoreHistory).toHaveLength(5)
  })

  it('scores follow the trend [68, 71, 75, 78, 82]', () => {
    const scores = mockFeedQualityScoreHistory.map(h => h.score)
    expect(scores).toEqual([68, 71, 75, 78, 82])
  })

  it('each entry has catalog_ready_count + not_ready_count = total_count', () => {
    mockFeedQualityScoreHistory.forEach(h => {
      expect(h.catalog_ready_count + h.not_ready_count).toBe(h.total_count)
    })
  })

  it('each entry has a non-empty breakdown array', () => {
    mockFeedQualityScoreHistory.forEach(h => {
      expect(h.breakdown.length).toBeGreaterThan(0)
    })
  })

  it('latest entry has score 82 and matches upload 1', () => {
    const latest = mockFeedQualityScoreHistory[mockFeedQualityScoreHistory.length - 1]
    expect(latest.score).toBe(82)
    expect(latest.upload_id).toBe(mockFeedUploads[0].upload_id)
  })
})

// ── Column Mappings ────────────────────────────────────────────────────────

describe('mockFeedColumnMappings', () => {
  it('contains 10 mappings', () => {
    expect(mockFeedColumnMappings).toHaveLength(10)
  })

  it('maps common columns like SKU -> scan_code', () => {
    const skuMapping = mockFeedColumnMappings.find(m => m.source_column === 'SKU')
    expect(skuMapping).toBeDefined()
    expect(skuMapping!.canonical_field).toBe('scan_code')
  })

  it('maps HOW TO SELL BY -> cost_unit with a transform rule', () => {
    const costMapping = mockFeedColumnMappings.find(m => m.source_column === 'HOW TO SELL BY')
    expect(costMapping).toBeDefined()
    expect(costMapping!.canonical_field).toBe('cost_unit')
    expect(costMapping!.transform_rule).not.toBeNull()
  })

  it('all mappings reference retailer 12345', () => {
    mockFeedColumnMappings.forEach(m => {
      expect(m.retailer_id).toBe(12345)
    })
  })
})

// ── Lookup helpers ─────────────────────────────────────────────────────────

describe('lookup helpers', () => {
  it('getUploadByStatus returns the correct upload', () => {
    const completed = getUploadByStatus('completed')
    expect(completed).toBeDefined()
    expect(completed!.status).toBe('completed')
  })

  it('getUploadByStatus returns undefined for non-existent status', () => {
    const pending = getUploadByStatus('pending')
    expect(pending).toBeUndefined()
  })

  it('getItemsForUpload returns the right items for upload 1', () => {
    const items = getItemsForUpload(mockFeedUploads[0].upload_id)
    expect(items).toHaveLength(10)
  })

  it('getValidationsForUpload returns validations for upload 4', () => {
    const vals = getValidationsForUpload(mockFeedUploads[3].upload_id)
    expect(vals.length).toBeGreaterThan(0)
  })

  it('getMatchesForUpload returns matches for upload 1', () => {
    const matches = getMatchesForUpload(mockFeedUploads[0].upload_id)
    expect(matches).toHaveLength(10)
  })

  it('getDiffForUpload returns diff for upload 1', () => {
    const diff = getDiffForUpload(mockFeedUploads[0].upload_id)
    expect(diff).toBeDefined()
    expect(diff!.quality_score).toBe(82)
  })

  it('getDiffItemsForDiff returns items for diff 1', () => {
    const items = getDiffItemsForDiff(mockFeedDiffs[0].diff_id)
    expect(items.length).toBeGreaterThan(0)
  })

  it('getAlertsForUpload returns 4 alerts for upload 1', () => {
    const alerts = getAlertsForUpload(mockFeedUploads[0].upload_id)
    expect(alerts).toHaveLength(4)
  })

  it('getQualityScoreTrend returns 5 entries', () => {
    expect(getQualityScoreTrend()).toHaveLength(5)
  })

  it('getColumnMappings returns 10 mappings', () => {
    expect(getColumnMappings()).toHaveLength(10)
  })
})
