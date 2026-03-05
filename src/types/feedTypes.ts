// ── Feed Types ─────────────────────────────────────────────────────────────
// TypeScript interfaces matching every table from docs/backend-design.md

// ── Enums (as union types) ─────────────────────────────────────────────────

export type FeedUploadStatus =
  | 'pending'
  | 'parsing'
  | 'validating'
  | 'matching'
  | 'computing_diff'
  | 'completed'
  | 'completed_with_warnings'
  | 'rejected_missing_fields'
  | 'rejected_mismatch'
  | 'failed'

export type CodeType = 'UPC' | 'RRC' | 'PLU' | 'SKU' | 'external_integration_id'

export type ValidationSeverity = 'error' | 'warning' | 'info'

export type SnapshotType = 'pre_ingestion' | 'post_clustering'

export type DiffChangeType = 'added' | 'removed' | 'changed' | 'unchanged'

export type DiffItemSeverity = 'critical' | 'warning' | 'info'

export type AnomalyAlertType =
  | 'bulk_name_change'
  | 'bulk_removal'
  | 'bulk_price_change'
  | 'alcohol_flag_change'
  | 'cost_unit_flip'

// ── Table interfaces ───────────────────────────────────────────────────────

/** feed_uploads — one row per uploaded feed file */
export interface FeedUpload {
  upload_id: string        // UUID
  retailer_id: number
  file_name: string
  file_format: string
  file_size_bytes: number
  file_url: string
  status: FeedUploadStatus
  total_rows: number
  valid_rows: number
  invalid_rows: number
  rejection_reason: string | null
  uploaded_at: string      // ISO 8601 timestamp
  processed_at: string | null
  created_at: string
  updated_at: string
}

/** feed_items — one row per parsed item from a feed file */
export interface FeedItem {
  item_id: string          // UUID
  upload_id: string        // FK → feed_uploads
  row_number: number
  scan_code: string
  code_type: CodeType
  item_name: string
  brand_name: string
  price: number | null
  sale_price: number | null
  cost_unit: string | null     // EA, LB, etc.
  size: string | null
  weight: string | null
  unit_of_measure: string | null
  category: string | null
  department: string | null
  available: boolean | null
  alcohol: boolean | null
  remote_image_url: string | null
  item_details: Record<string, unknown> | null  // JSONB
  ingredients: string | null
  loyalty_price: number | null
  raw_row: Record<string, unknown> | null       // JSONB — original unparsed row
  created_at: string
}

/** feed_item_validations — validation violations per item */
export interface FeedItemValidation {
  validation_id: string    // UUID
  item_id: string          // FK → feed_items
  upload_id: string        // FK → feed_uploads
  field: string
  rule: string
  severity: ValidationSeverity
  message: string
  is_blocking: boolean
  created_at: string
}

/** pls_match_results — PLS lookup result per item */
export interface PlsMatchResult {
  match_id: string         // UUID
  item_id: string          // FK → feed_items
  upload_id: string        // FK → feed_uploads
  scan_code: string
  code_type: CodeType
  matched_product_id: number | null  // from PLS, null if no match
  match_method: string | null        // exact_upc, fuzzy, etc.
  match_confidence: number | null    // 0.0 - 1.0
  alternative_ids: Array<{ product_id: number; score: number }> | null  // JSONB
  is_duplicate: boolean
  pls_response_raw: Record<string, unknown> | null  // JSONB
  latency_ms: number
  created_at: string
}

/** feed_snapshots — previous feed state for diff comparison */
export interface FeedSnapshot {
  snapshot_id: string      // UUID
  retailer_id: number
  upload_id: string        // FK → feed_uploads
  snapshot_type: SnapshotType
  item_count: number
  created_at: string
}

/** feed_snapshot_items — individual items within a snapshot */
export interface FeedSnapshotItem {
  snapshot_item_id: string  // UUID
  snapshot_id: string       // FK → feed_snapshots
  scan_code: string
  product_id: number | null
  item_name: string
  brand_name: string
  price: number | null
  sale_price: number | null
  cost_unit: string | null
  size: string | null
  category: string | null
  available: boolean | null
  alcohol: boolean | null
  remote_image_url: string | null
  item_details: Record<string, unknown> | null  // JSONB
  all_fields: Record<string, unknown> | null    // JSONB — full canonical record
}

/** feed_diffs — one per completed upload, summary-level diff */
export interface FeedDiff {
  diff_id: string          // UUID
  upload_id: string        // FK → current feed upload
  previous_upload_id: string | null  // FK → what we compared against
  retailer_id: number
  added_count: number
  removed_count: number
  changed_count: number
  unchanged_count: number
  quality_score: number    // 0-100
  catalog_ready_count: number
  not_ready_count: number
  ai_summary: string | null
  computed_at: string
  created_at: string
}

/** feed_diff_items — per-item diff detail */
export interface FeedDiffItem {
  diff_item_id: string     // UUID
  diff_id: string          // FK → feed_diffs
  item_id: string          // FK → feed_items
  scan_code: string
  product_id: number | null
  change_type: DiffChangeType
  severity: DiffItemSeverity
  change_summary: string | null  // human-readable, e.g. "price: $2.49 -> $3.19"
  field_changes: FieldChange[] | null  // JSONB
  is_catalog_ready: boolean
  not_ready_reasons: string[] | null   // JSONB, e.g. ["missing_brand", "invalid_price"]
  created_at: string
}

/** Field-level change detail within a feed_diff_item */
export interface FieldChange {
  field: string
  previous: string | null
  current: string | null
  is_high_severity: boolean
}

/** feed_anomaly_alerts — anomaly detection alerts per diff */
export interface FeedAnomalyAlert {
  alert_id: string         // UUID
  diff_id: string          // FK → feed_diffs
  upload_id: string        // FK → feed_uploads
  alert_type: AnomalyAlertType
  category: string
  affected_count: number
  affected_pct: number     // percentage
  threshold_used: number
  description: string
  is_dismissible: boolean
  dismissed_at: string | null
  created_at: string
}

/** feed_quality_score_history — for sparkline trend */
export interface FeedQualityScoreHistory {
  score_id: string         // UUID
  retailer_id: number
  upload_id: string        // FK → feed_uploads
  score: number            // 0-100
  catalog_ready_count: number
  total_count: number
  not_ready_count: number
  breakdown: QualityBreakdown[]  // JSONB
  computed_at: string
}

/** Breakdown entry within quality score history */
export interface QualityBreakdown {
  field: string
  count: number
}

/** feed_column_mappings — per-retailer column mapping config */
export interface FeedColumnMapping {
  mapping_id: string       // UUID
  retailer_id: number
  source_column: string
  canonical_field: string
  transform_rule: Record<string, unknown> | null  // JSONB
  created_at: string
  updated_at: string
}
