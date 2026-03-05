import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'feed.db')
export const db = new Database(dbPath)

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// --- Schema Creation ---

db.exec(`
  CREATE TABLE IF NOT EXISTS feed_uploads (
    upload_id TEXT PRIMARY KEY,
    retailer_id TEXT NOT NULL,
    file_name TEXT,
    file_format TEXT DEFAULT 'csv',
    file_size_bytes INTEGER,
    file_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    total_rows INTEGER DEFAULT 0,
    valid_rows INTEGER DEFAULT 0,
    invalid_rows INTEGER DEFAULT 0,
    rejection_reason TEXT,
    uploaded_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS feed_items (
    item_id TEXT PRIMARY KEY,
    upload_id TEXT NOT NULL,
    row_number INTEGER,
    scan_code TEXT,
    code_type TEXT DEFAULT 'UPC',
    item_name TEXT,
    brand_name TEXT,
    price REAL,
    sale_price REAL,
    cost_unit TEXT,
    size TEXT,
    weight TEXT,
    unit_of_measure TEXT,
    category TEXT,
    department TEXT,
    available INTEGER,
    alcohol INTEGER DEFAULT 0,
    remote_image_url TEXT,
    item_details TEXT,
    ingredients TEXT,
    loyalty_price REAL,
    raw_row TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (upload_id) REFERENCES feed_uploads(upload_id)
  );

  CREATE TABLE IF NOT EXISTS feed_item_validations (
    validation_id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    upload_id TEXT NOT NULL,
    field TEXT NOT NULL,
    rule TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    is_blocking INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (item_id) REFERENCES feed_items(item_id),
    FOREIGN KEY (upload_id) REFERENCES feed_uploads(upload_id)
  );

  CREATE TABLE IF NOT EXISTS pls_match_results (
    match_id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    upload_id TEXT NOT NULL,
    scan_code TEXT,
    code_type TEXT,
    matched_product_id INTEGER,
    match_method TEXT,
    match_confidence REAL,
    alternative_ids TEXT,
    is_duplicate INTEGER DEFAULT 0,
    pls_response_raw TEXT,
    latency_ms INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (item_id) REFERENCES feed_items(item_id),
    FOREIGN KEY (upload_id) REFERENCES feed_uploads(upload_id)
  );

  CREATE TABLE IF NOT EXISTS feed_snapshots (
    snapshot_id TEXT PRIMARY KEY,
    retailer_id TEXT NOT NULL,
    upload_id TEXT NOT NULL,
    snapshot_type TEXT DEFAULT 'pre_ingestion',
    item_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (upload_id) REFERENCES feed_uploads(upload_id)
  );

  CREATE TABLE IF NOT EXISTS feed_snapshot_items (
    snapshot_item_id TEXT PRIMARY KEY,
    snapshot_id TEXT NOT NULL,
    scan_code TEXT,
    product_id INTEGER,
    item_name TEXT,
    brand_name TEXT,
    price REAL,
    sale_price REAL,
    cost_unit TEXT,
    size TEXT,
    category TEXT,
    available INTEGER,
    alcohol INTEGER DEFAULT 0,
    remote_image_url TEXT,
    item_details TEXT,
    all_fields TEXT,
    FOREIGN KEY (snapshot_id) REFERENCES feed_snapshots(snapshot_id)
  );

  CREATE TABLE IF NOT EXISTS feed_diffs (
    diff_id TEXT PRIMARY KEY,
    upload_id TEXT NOT NULL,
    previous_upload_id TEXT,
    retailer_id TEXT NOT NULL,
    added_count INTEGER DEFAULT 0,
    removed_count INTEGER DEFAULT 0,
    changed_count INTEGER DEFAULT 0,
    unchanged_count INTEGER DEFAULT 0,
    quality_score INTEGER DEFAULT 0,
    catalog_ready_count INTEGER DEFAULT 0,
    not_ready_count INTEGER DEFAULT 0,
    ai_summary TEXT,
    computed_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (upload_id) REFERENCES feed_uploads(upload_id)
  );

  CREATE TABLE IF NOT EXISTS feed_diff_items (
    diff_item_id TEXT PRIMARY KEY,
    diff_id TEXT NOT NULL,
    item_id TEXT,
    scan_code TEXT,
    product_id INTEGER,
    change_type TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    change_summary TEXT,
    field_changes TEXT,
    is_catalog_ready INTEGER DEFAULT 0,
    not_ready_reasons TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (diff_id) REFERENCES feed_diffs(diff_id)
  );

  CREATE TABLE IF NOT EXISTS feed_anomaly_alerts (
    alert_id TEXT PRIMARY KEY,
    diff_id TEXT,
    upload_id TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    category TEXT,
    affected_count INTEGER DEFAULT 0,
    affected_pct REAL DEFAULT 0,
    threshold_used REAL DEFAULT 0,
    description TEXT,
    is_dismissible INTEGER DEFAULT 1,
    dismissed_at TEXT,
    dismissed_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (diff_id) REFERENCES feed_diffs(diff_id),
    FOREIGN KEY (upload_id) REFERENCES feed_uploads(upload_id)
  );

  CREATE TABLE IF NOT EXISTS feed_quality_score_history (
    score_id TEXT PRIMARY KEY,
    retailer_id TEXT NOT NULL,
    upload_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    catalog_ready_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    not_ready_count INTEGER DEFAULT 0,
    breakdown TEXT,
    computed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (upload_id) REFERENCES feed_uploads(upload_id)
  );

  CREATE TABLE IF NOT EXISTS feed_column_mappings (
    mapping_id TEXT PRIMARY KEY,
    retailer_id TEXT NOT NULL,
    source_column TEXT NOT NULL,
    canonical_field TEXT NOT NULL,
    transform_rule TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`)

// --- Indexes ---

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_feed_snapshot_items_scan
    ON feed_snapshot_items(snapshot_id, scan_code);

  CREATE INDEX IF NOT EXISTS idx_feed_items_upload_scan
    ON feed_items(upload_id, scan_code);

  CREATE INDEX IF NOT EXISTS idx_pls_match_results_upload_item
    ON pls_match_results(upload_id, item_id);

  CREATE INDEX IF NOT EXISTS idx_feed_diff_items_filter
    ON feed_diff_items(diff_id, change_type, severity);

  CREATE INDEX IF NOT EXISTS idx_feed_diffs_retailer_created
    ON feed_diffs(retailer_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_feed_quality_score_history_trend
    ON feed_quality_score_history(retailer_id, computed_at DESC);

  CREATE INDEX IF NOT EXISTS idx_feed_anomaly_alerts_upload
    ON feed_anomaly_alerts(upload_id, alert_type);

  CREATE INDEX IF NOT EXISTS idx_feed_uploads_retailer
    ON feed_uploads(retailer_id, uploaded_at DESC);
`)

// --- Helper Functions ---

export function updateUploadStatus(uploadId: string, status: string, extra?: Record<string, unknown>): void {
  const sets = ['status = ?', "updated_at = datetime('now')"]
  const params: unknown[] = [status]

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      sets.push(`${key} = ?`)
      params.push(value)
    }
  }

  params.push(uploadId)
  db.prepare(`UPDATE feed_uploads SET ${sets.join(', ')} WHERE upload_id = ?`).run(...params)
}

export function getUpload(uploadId: string) {
  return db.prepare('SELECT * FROM feed_uploads WHERE upload_id = ?').get(uploadId) as Record<string, unknown> | undefined
}

export function getLatestSnapshot(retailerId: string) {
  return db.prepare(
    'SELECT * FROM feed_snapshots WHERE retailer_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(retailerId) as Record<string, unknown> | undefined
}

export function getSnapshotItems(snapshotId: string) {
  return db.prepare(
    'SELECT * FROM feed_snapshot_items WHERE snapshot_id = ?'
  ).all(snapshotId) as Record<string, unknown>[]
}

console.log('[db] SQLite database initialized at', dbPath)
