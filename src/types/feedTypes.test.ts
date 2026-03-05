import { describe, it, expect } from 'vitest'
import type {
  FeedUploadStatus,
  CodeType,
  ValidationSeverity,
  SnapshotType,
  DiffChangeType,
  DiffItemSeverity,
  AnomalyAlertType,
  FeedUpload,
  FeedItem,
  FeedItemValidation,
  PlsMatchResult,
  FeedSnapshot,
  FeedSnapshotItem,
  FeedDiff,
  FeedDiffItem,
  FieldChange,
  FeedAnomalyAlert,
  FeedQualityScoreHistory,
  QualityBreakdown,
  FeedColumnMapping,
} from './feedTypes'

describe('feedTypes — union types accept valid values', () => {
  it('FeedUploadStatus accepts all 10 valid statuses', () => {
    const statuses: FeedUploadStatus[] = [
      'pending',
      'parsing',
      'validating',
      'matching',
      'computing_diff',
      'completed',
      'completed_with_warnings',
      'rejected_missing_fields',
      'rejected_mismatch',
      'failed',
    ]
    expect(statuses).toHaveLength(10)
    statuses.forEach(s => expect(typeof s).toBe('string'))
  })

  it('CodeType accepts all 5 valid values', () => {
    const codes: CodeType[] = ['UPC', 'RRC', 'PLU', 'SKU', 'external_integration_id']
    expect(codes).toHaveLength(5)
  })

  it('ValidationSeverity accepts error, warning, info', () => {
    const sevs: ValidationSeverity[] = ['error', 'warning', 'info']
    expect(sevs).toHaveLength(3)
  })

  it('SnapshotType accepts pre_ingestion, post_clustering', () => {
    const types: SnapshotType[] = ['pre_ingestion', 'post_clustering']
    expect(types).toHaveLength(2)
  })

  it('DiffChangeType accepts added, removed, changed, unchanged', () => {
    const types: DiffChangeType[] = ['added', 'removed', 'changed', 'unchanged']
    expect(types).toHaveLength(4)
  })

  it('DiffItemSeverity accepts critical, warning, info', () => {
    const sevs: DiffItemSeverity[] = ['critical', 'warning', 'info']
    expect(sevs).toHaveLength(3)
  })

  it('AnomalyAlertType accepts all 5 valid values', () => {
    const types: AnomalyAlertType[] = [
      'bulk_name_change',
      'bulk_removal',
      'bulk_price_change',
      'alcohol_flag_change',
      'cost_unit_flip',
    ]
    expect(types).toHaveLength(5)
  })
})

describe('feedTypes — interface shapes via satisfies-style assertions', () => {
  it('FeedUpload shape matches expected structure', () => {
    const upload: FeedUpload = {
      upload_id: 'test-uuid',
      retailer_id: 123,
      file_name: 'test.csv',
      file_format: 'csv',
      file_size_bytes: 1024,
      file_url: 's3://bucket/test.csv',
      status: 'completed',
      total_rows: 100,
      valid_rows: 95,
      invalid_rows: 5,
      rejection_reason: null,
      uploaded_at: '2026-01-01T00:00:00Z',
      processed_at: '2026-01-01T00:01:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:01:00Z',
    }
    expect(upload.upload_id).toBe('test-uuid')
    expect(upload.total_rows).toBe(upload.valid_rows + upload.invalid_rows)
    expect(upload.rejection_reason).toBeNull()
  })

  it('FeedItem shape matches expected structure', () => {
    const item: FeedItem = {
      item_id: 'item-1',
      upload_id: 'upload-1',
      row_number: 1,
      scan_code: '123456789',
      code_type: 'UPC',
      item_name: 'Test Item',
      brand_name: 'Test Brand',
      price: 9.99,
      sale_price: null,
      cost_unit: 'EA',
      size: '12 oz',
      weight: null,
      unit_of_measure: null,
      category: 'Produce',
      department: 'Fresh',
      available: true,
      alcohol: false,
      remote_image_url: null,
      item_details: null,
      ingredients: null,
      loyalty_price: null,
      raw_row: null,
      created_at: '2026-01-01T00:00:00Z',
    }
    expect(item.item_id).toBe('item-1')
    expect(item.price).toBe(9.99)
    expect(item.sale_price).toBeNull()
  })

  it('FeedItemValidation shape matches expected structure', () => {
    const val: FeedItemValidation = {
      validation_id: 'val-1',
      item_id: 'item-1',
      upload_id: 'upload-1',
      field: 'price',
      rule: 'required_positive_price',
      severity: 'error',
      message: 'price is required',
      is_blocking: true,
      created_at: '2026-01-01T00:00:00Z',
    }
    expect(val.is_blocking).toBe(true)
    expect(val.severity).toBe('error')
  })

  it('PlsMatchResult shape matches expected structure', () => {
    const match: PlsMatchResult = {
      match_id: 'match-1',
      item_id: 'item-1',
      upload_id: 'upload-1',
      scan_code: '123456789',
      code_type: 'UPC',
      matched_product_id: 12345678,
      match_method: 'exact_upc',
      match_confidence: 0.99,
      alternative_ids: [{ product_id: 11111111, score: 0.85 }],
      is_duplicate: false,
      pls_response_raw: null,
      latency_ms: 45,
      created_at: '2026-01-01T00:00:00Z',
    }
    expect(match.match_confidence).toBe(0.99)
    expect(match.alternative_ids).toHaveLength(1)
  })

  it('FeedSnapshot shape matches expected structure', () => {
    const snapshot: FeedSnapshot = {
      snapshot_id: 'snap-1',
      retailer_id: 123,
      upload_id: 'upload-1',
      snapshot_type: 'pre_ingestion',
      item_count: 10,
      created_at: '2026-01-01T00:00:00Z',
    }
    expect(snapshot.snapshot_type).toBe('pre_ingestion')
  })

  it('FeedSnapshotItem shape matches expected structure', () => {
    const item: FeedSnapshotItem = {
      snapshot_item_id: 'ssi-1',
      snapshot_id: 'snap-1',
      scan_code: '123456789',
      product_id: 10000001,
      item_name: 'Test',
      brand_name: 'Brand',
      price: 5.99,
      sale_price: null,
      cost_unit: 'EA',
      size: '12 oz',
      category: 'Produce',
      available: true,
      alcohol: false,
      remote_image_url: null,
      item_details: null,
      all_fields: null,
    }
    expect(item.product_id).toBe(10000001)
  })

  it('FeedDiff shape matches expected structure', () => {
    const diff: FeedDiff = {
      diff_id: 'diff-1',
      upload_id: 'upload-1',
      previous_upload_id: 'upload-0',
      retailer_id: 123,
      added_count: 2,
      removed_count: 1,
      changed_count: 5,
      unchanged_count: 92,
      quality_score: 82,
      catalog_ready_count: 410,
      not_ready_count: 90,
      ai_summary: 'Test summary',
      computed_at: '2026-01-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
    }
    expect(diff.quality_score).toBe(82)
    expect(diff.added_count + diff.removed_count + diff.changed_count + diff.unchanged_count).toBe(100)
  })

  it('FeedDiffItem and FieldChange shapes match expected structure', () => {
    const fc: FieldChange = {
      field: 'price',
      previous: '$2.49',
      current: '$3.19',
      is_high_severity: false,
    }
    const diffItem: FeedDiffItem = {
      diff_item_id: 'dfi-1',
      diff_id: 'diff-1',
      item_id: 'item-1',
      scan_code: '123456789',
      product_id: 10000001,
      change_type: 'changed',
      severity: 'info',
      change_summary: 'price: $2.49 -> $3.19',
      field_changes: [fc],
      is_catalog_ready: true,
      not_ready_reasons: null,
      created_at: '2026-01-01T00:00:00Z',
    }
    expect(diffItem.field_changes).toHaveLength(1)
    expect(diffItem.field_changes![0].field).toBe('price')
  })

  it('FeedAnomalyAlert shape matches expected structure', () => {
    const alert: FeedAnomalyAlert = {
      alert_id: 'alert-1',
      diff_id: 'diff-1',
      upload_id: 'upload-1',
      alert_type: 'bulk_name_change',
      category: 'Produce',
      affected_count: 8,
      affected_pct: 40,
      threshold_used: 20,
      description: 'Test alert description',
      is_dismissible: true,
      dismissed_at: null,
      created_at: '2026-01-01T00:00:00Z',
    }
    expect(alert.is_dismissible).toBe(true)
    expect(alert.dismissed_at).toBeNull()
  })

  it('FeedQualityScoreHistory and QualityBreakdown shapes match expected structure', () => {
    const breakdown: QualityBreakdown = { field: 'scan_code', count: 25 }
    const history: FeedQualityScoreHistory = {
      score_id: 'qsh-1',
      retailer_id: 123,
      upload_id: 'upload-1',
      score: 82,
      catalog_ready_count: 410,
      total_count: 500,
      not_ready_count: 90,
      breakdown: [breakdown],
      computed_at: '2026-01-01T00:00:00Z',
    }
    expect(history.score).toBe(82)
    expect(history.breakdown).toHaveLength(1)
    expect(history.catalog_ready_count + history.not_ready_count).toBe(history.total_count)
  })

  it('FeedColumnMapping shape matches expected structure', () => {
    const mapping: FeedColumnMapping = {
      mapping_id: 'colmap-1',
      retailer_id: 123,
      source_column: 'SKU',
      canonical_field: 'scan_code',
      transform_rule: { code_type: 'UPC' },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    expect(mapping.transform_rule).toEqual({ code_type: 'UPC' })
  })
})
