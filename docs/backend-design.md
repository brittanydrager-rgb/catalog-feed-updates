# Backend Engineering Design: Feed Validation & PLS Simulation

## Overview

When a retailer uploads a feed file through IPP, the backend performs two operations:

1. **Validation** — Parse the file, map columns to canonical schema, validate required fields
2. **PLS Simulation** — For each item, call Product Lookup Service to resolve the scan code (UPC/RRC/PLU) to a `product_id`, then compare against the existing catalog state to produce a diff

This document covers the data model, API surface, processing pipeline, and integration with PLS.

---

## Entity Relationship Diagram

```
┌──────────────────────────┐
│     retailer_partners    │  (existing IPP table)
│──────────────────────────│
│ PK  retailer_id          │
│     name                 │
│     type (MP/SFP/WL)     │
│     ...                  │
└──────────┬───────────────┘
           │ 1
           │
           │ N
┌──────────▼───────────────┐        ┌─────────────────────────────┐
│     feed_uploads         │        │   feed_column_mappings      │
│──────────────────────────│        │─────────────────────────────│
│ PK  upload_id      UUID  │        │ PK  mapping_id        UUID  │
│ FK  retailer_id          │───1:N──│ FK  retailer_id             │
│     file_name            │        │     source_column    TEXT   │
│     file_format          │        │     canonical_field  TEXT   │
│     file_size_bytes      │        │     transform_rule   JSONB  │
│     file_url       TEXT  │        │     created_at              │
│     status         ENUM  │        │     updated_at              │
│     total_rows     INT   │        └─────────────────────────────┘
│     valid_rows     INT   │
│     invalid_rows   INT   │        Status ENUM:
│     rejection_reason TEXT│          'pending'
│     uploaded_at    TSTZ  │          'parsing'
│     processed_at   TSTZ  │          'validating'
│     created_at     TSTZ  │          'matching'
│     updated_at     TSTZ  │          'computing_diff'
└──────────┬───────────────┘          'completed'
           │ 1                        'completed_with_warnings'
           │                          'rejected_missing_fields'
           │ N                        'rejected_mismatch'
┌──────────▼───────────────┐          'failed'
│     feed_items           │
│──────────────────────────│
│ PK  item_id        UUID  │
│ FK  upload_id            │
│     row_number     INT   │
│     scan_code      TEXT  │   ← raw value from file
│     code_type      ENUM  │   ← UPC / RRC / PLU / SKU / external_integration_id
│     item_name      TEXT  │
│     brand_name     TEXT  │
│     price          DEC   │
│     sale_price     DEC   │
│     cost_unit      TEXT  │   ← EA, LB, etc.
│     size           TEXT  │
│     weight         TEXT  │
│     unit_of_measure TEXT │
│     category       TEXT  │
│     department     TEXT  │
│     available      BOOL  │
│     alcohol        BOOL  │
│     remote_image_url TEXT│
│     item_details   JSONB │
│     ingredients    TEXT  │
│     loyalty_price  DEC   │
│     raw_row        JSONB │   ← original unparsed row for debugging
│     created_at     TSTZ  │
└──────┬──────┬────────────┘
       │      │
       │ 1    │ 1
       │      │
       │ N    │ N
┌──────▼──────────────┐    ┌──────▼──────────────────────┐
│ feed_item_validations│    │ pls_match_results           │
│─────────────────────│    │─────────────────────────────│
│ PK validation_id UUID│    │ PK match_id          UUID   │
│ FK item_id           │    │ FK item_id                  │
│ FK upload_id         │    │ FK upload_id                │
│    field       TEXT  │    │    scan_code         TEXT   │
│    rule        TEXT  │    │    code_type         ENUM   │
│    severity    ENUM  │    │    matched_product_id BIGINT│  ← from PLS
│    message     TEXT  │    │    match_method       TEXT  │  ← exact_upc, fuzzy, etc.
│    is_blocking BOOL  │    │    match_confidence   FLOAT │
│    created_at  TSTZ  │    │    alternative_ids    JSONB │  ← other candidates
│                      │    │    is_duplicate       BOOL  │  ← dup scan code in feed
│ severity ENUM:       │    │    pls_response_raw   JSONB │  ← full PLS response
│   'error'            │    │    latency_ms         INT   │
│   'warning'          │    │    created_at         TSTZ  │
│   'info'             │    └─────────────────────────────┘
└──────────────────────┘
       │
       │  Validation rules:
       │  - scan_code: present, no leading ':', valid length + check digit
       │  - item_name: present, non-empty
       │  - brand_name: present, non-empty
       │  - price: present, > $0
       │  - cost_unit: present, in {EA, LB}
       │  - size|weight|unit_of_measure: at least one present
       │  - category|department: at least one present
       │  - no duplicate scan_codes within same upload


┌──────────────────────────┐
│     feed_snapshots       │   ← previous feed state, for diff comparison
│──────────────────────────│
│ PK  snapshot_id    UUID  │
│ FK  retailer_id          │
│ FK  upload_id            │   ← which upload created this snapshot
│     snapshot_type  ENUM  │   ← 'pre_ingestion' | 'post_clustering'
│     item_count     INT   │
│     created_at     TSTZ  │
└──────────┬───────────────┘
           │ 1
           │
           │ N
┌──────────▼───────────────┐
│  feed_snapshot_items     │
│──────────────────────────│
│ PK  snapshot_item_id UUID│
│ FK  snapshot_id          │
│     scan_code      TEXT  │
│     product_id     BIGINT│
│     item_name      TEXT  │
│     brand_name     TEXT  │
│     price          DEC   │
│     sale_price     DEC   │
│     cost_unit      TEXT  │
│     size           TEXT  │
│     category       TEXT  │
│     available      BOOL  │
│     alcohol        BOOL  │
│     remote_image_url TEXT│
│     item_details   JSONB │
│     all_fields     JSONB │  ← full canonical record for field-level diff
└──────────────────────────┘


┌──────────────────────────┐
│     feed_diffs           │   ← one per completed upload
│──────────────────────────│
│ PK  diff_id        UUID  │
│ FK  upload_id            │   ← current feed
│ FK  previous_upload_id   │   ← what we compared against
│ FK  retailer_id          │
│     added_count    INT   │
│     removed_count  INT   │
│     changed_count  INT   │
│     unchanged_count INT  │
│     quality_score  INT   │   ← 0-100, catalog-readiness %
│     catalog_ready_count INT│
│     not_ready_count INT  │
│     ai_summary     TEXT  │   ← LLM-generated plain-language summary
│     computed_at    TSTZ  │
│     created_at     TSTZ  │
└──────────┬───────────────┘
           │ 1
           │
           │ N
┌──────────▼───────────────┐
│     feed_diff_items      │
│──────────────────────────│
│ PK  diff_item_id   UUID  │
│ FK  diff_id              │
│ FK  item_id              │   ← from feed_items
│     scan_code      TEXT  │
│     product_id     BIGINT│   ← resolved via PLS
│     change_type    ENUM  │   ← 'added' | 'removed' | 'changed' | 'unchanged'
│     severity       ENUM  │   ← 'critical' | 'warning' | 'info'
│     change_summary TEXT  │   ← human-readable, e.g. "price: $2.49 -> $3.19"
│     field_changes  JSONB │   ← array of {field, previous, current, is_high_severity}
│     is_catalog_ready BOOL│
│     not_ready_reasons JSONB│ ← ["missing_brand", "invalid_price"]
│     created_at     TSTZ  │
└──────────────────────────┘


┌──────────────────────────┐
│  feed_anomaly_alerts     │
│──────────────────────────│
│ PK  alert_id       UUID  │
│ FK  diff_id              │
│ FK  upload_id            │
│     alert_type     ENUM  │   ← bulk_name_change | bulk_removal | bulk_price_change
│     category       TEXT  │      | alcohol_flag_change | cost_unit_flip
│     affected_count INT   │
│     affected_pct   FLOAT │
│     threshold_used FLOAT │   ← what threshold triggered this
│     description    TEXT  │
│     is_dismissible BOOL  │
│     dismissed_at   TSTZ  │   ← null if not dismissed
│     dismissed_by   TEXT  │   ← who dismissed (for traceability)
│     created_at     TSTZ  │
└──────────────────────────┘


┌──────────────────────────────┐
│  feed_quality_score_history  │   ← for sparkline trend
│──────────────────────────────│
│ PK  score_id         UUID    │
│ FK  retailer_id              │
│ FK  upload_id                │
│     score            INT     │   ← 0-100
│     catalog_ready_count INT  │
│     total_count      INT     │
│     not_ready_count  INT     │
│     breakdown        JSONB   │   ← [{field: "scan_code", count: 45}, ...]
│     computed_at      TSTZ    │
└──────────────────────────────┘
```

### Required Indexes

| Table | Column(s) | Why |
|---|---|---|
| `feed_snapshot_items` | `(snapshot_id, scan_code)` | **Diff join hot path — most critical** |
| `feed_items` | `(upload_id, scan_code)` | Dedup check + diff join |
| `pls_match_results` | `(upload_id, item_id)` | Diff join |
| `feed_diff_items` | `(diff_id, change_type, severity)` | API filtering |
| `feed_diffs` | `(retailer_id, created_at DESC)` | History queries |
| `feed_quality_score_history` | `(retailer_id, computed_at DESC)` | Trend sparkline |
| `feed_anomaly_alerts` | `(upload_id, alert_type)` | Alert lookups |
| `feed_uploads` | `(retailer_id, uploaded_at DESC)` | Status polling |

### Data Model Notes

- **Denormalized `upload_id` on `feed_item_validations` and `pls_match_results`**: Intentional denormalization for query performance — avoids joining through `feed_items` for upload-scoped queries.
- **`feed_diff_items.item_id` FK lifecycle**: `feed_items` has a 30-day retention but diffs may outlive them. Use `ON DELETE SET NULL` or cascade-delete diffs alongside items.
- **`quality_score` source of truth**: `feed_quality_score_history` is the canonical source. `feed_diffs.quality_score` is a denormalized copy for convenience.
- **`feed_column_mappings` versioning**: Snapshot the mapping config used per upload (store in `feed_uploads.column_mapping_snapshot JSONB`) so old uploads can be re-processed with their original mapping.

---

## Processing Pipeline

### Hackathon: Synchronous

For the hackathon, the validation pipeline is a **synchronous API call**. The client uploads a file, the server runs all 5 phases inline, and returns the result in the response. With mock data and small feeds this is fast enough, and avoids the complexity of async job infrastructure, status polling, and worker orchestration for a demo.

### Production: Temporal Workflows

For production rollout, switch to **Temporal workflows**. The pipeline has 5 sequential phases, and at real scale (100k+ SKUs, ~34s processing), we need:
- **Phase-level checkpointing** — if the worker crashes after PLS matching (the most expensive step), resume from Phase 4 instead of re-running everything
- **Built-in retry with backoff** per activity
- **Durable state and workflow-level dedup** — avoids double-insert if a job gets retried (e.g., `feed_items` and `pls_match_results` would get duplicate rows without idempotency guards)

The sync-to-async migration path is clean: extract each phase into a Temporal activity, wrap them in a workflow, and swap the API from sync response to "return upload_id + poll status." The phase logic itself doesn't change.

### Concurrent Upload Guard

If a retailer uploads two files before the first finishes processing, both workers will try to save a new snapshot (last write wins, loser's diff baseline is gone). Use a **per-retailer mutex** — Temporal's single-execution-per-workflow-ID for production, or a DB advisory lock for the hackathon — to serialize uploads per retailer.

```
                    ┌─────────────┐
                    │  IPP Client  │
                    │  (React UI)  │
                    └──────┬──────┘
                           │ POST /v1/retailers/:id/feed-uploads
                           │ multipart/form-data
                           ▼
              ┌────────────────────────────┐
              │  Feed Upload API           │
              │  (IPP Backend / BFF)       │
              │                            │
              │  1. Store file to S3/GCS   │
              │  2. Create feed_uploads    │
              │     row (status: pending)  │
              │  3. Enqueue processing job │
              │  4. Return upload_id +     │
              │     status: pending        │
              └────────────┬───────────────┘
                           │ async job (production)
                           │ sync inline (hackathon)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Feed Processing Worker                     │
│                                                              │
│  ┌─── PHASE 1: Parse ────────────────────────────────────┐  │
│  │                                                        │  │
│  │  1. Detect file format (CSV, pipe-delimited, JSON,     │  │
│  │     newline-delimited JSON)                            │  │
│  │  2. Load feed_column_mappings for this retailer        │  │
│  │  3. Parse each row, map columns to canonical fields    │  │
│  │  4. Insert into feed_items (batch, 1000/batch)         │  │
│  │  5. Update feed_uploads.status = 'parsing'             │  │
│  │  6. Update feed_uploads.total_rows                     │  │
│  │                                                        │  │
│  │  Column mapping example (ShopRite):                    │  │
│  │    SKU            → scan_code (code_type: UPC)         │  │
│  │    PRODUCT NAME   → item_name                          │  │
│  │    BRAND NAME     → brand_name                         │  │
│  │    REGULAR PRICE  → price                              │  │
│  │    HOW TO SELL BY → cost_unit (transform: LBS→LB)      │  │
│  │    SIZE           → size                               │  │
│  │    UOM            → unit_of_measure                    │  │
│  │    DEPARTMENT CODE→ department                         │  │
│  │    COMMODITY      → category                           │  │
│  │    ALCOHOL        → alcohol (transform: Y→true)        │  │
│  │                                                        │  │
│  │  Column mapping example (Kroger):                      │  │
│  │    upc            → scan_code (code_type: UPC)         │  │
│  │    name           → item_name                          │  │
│  │    locations[0].inventory[0].prices[0].regular.unit    │  │
│  │                   → price                              │  │
│  │    locations[0].inventory[0].prices[0].soldBy          │  │
│  │                   → cost_unit (transform: UNIT→EA)     │  │
│  │    locations[0].aisleLocations[0].departmentDescription│  │
│  │                   → department                         │  │
│  │    available      → available                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                          │                                    │
│                          ▼                                    │
│  ┌─── PHASE 2: Validate ─────────────────────────────────┐  │
│  │                                                        │  │
│  │  For each feed_item:                                   │  │
│  │                                                        │  │
│  │  Required field checks (→ blocking):                   │  │
│  │  ┌──────────────┬────────────────────────────────────┐ │  │
│  │  │ Field        │ Rule                               │ │  │
│  │  ├──────────────┼────────────────────────────────────┤ │  │
│  │  │ scan_code    │ present, non-empty, not starts     │ │  │
│  │  │              │ with ':', valid check digit         │ │  │
│  │  │ item_name    │ present, non-empty                 │ │  │
│  │  │ brand_name   │ present, non-empty                 │ │  │
│  │  │ price        │ present, numeric, > 0              │ │  │
│  │  │ cost_unit    │ present, in {EA, LB, UNIT, LBS}    │ │  │
│  │  │ size/weight/ │ at least one present               │ │  │
│  │  │   uom        │                                    │ │  │
│  │  │ category/    │ at least one present               │ │  │
│  │  │   department │                                    │ │  │
│  │  └──────────────┴────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │  Duplicate scan code check:                            │  │
│  │    GROUP BY scan_code HAVING COUNT(*) > 1              │  │
│  │    → both items flagged as blocking validation error   │  │
│  │                                                        │  │
│  │  Insert feed_item_validations for each violation       │  │
│  │  Update feed_uploads.valid_rows, invalid_rows          │  │
│  │                                                        │  │
│  │  Decision gate:                                        │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │ IF any blocking validation errors exist:        │   │  │
│  │  │   → status = 'rejected_missing_fields'          │   │  │
│  │  │   → STOP pipeline, return validation results    │   │  │
│  │  │ ELSE:                                           │   │  │
│  │  │   → continue to Phase 3                         │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
│                          │                                    │
│                          ▼                                    │
│  ┌─── PHASE 3: PLS Simulation (Bulk Matching) ───────────┐  │
│  │                                                        │  │
│  │  1. Collect all (scan_code, code_type) pairs           │  │
│  │  2. Call PLS background tier in batches of 10,000:     │  │
│  │                                                        │  │
│  │     Service: background.rpc.product-retrieval.customers│  │
│  │     RPC:     GetBulkRetailerProductCodeMatching         │  │
│  │     Params:  {                                         │  │
│  │       retailer_id: <retailer_id>,                      │  │
│  │       codes: [                                         │  │
│  │         { code: "0007754100515", code_type: "UPC" },   │  │
│  │         { code: "00123456", code_type: "RRC" },        │  │
│  │         ...                                            │  │
│  │       ]                                                │  │
│  │     }                                                  │  │
│  │     Response per code: {                               │  │
│  │       product_id: 12345678,                            │  │
│  │       matched_method: "exact_upc",                     │  │
│  │       confidence: 0.99,                                │  │
│  │       alternatives: [{ product_id: ..., score: ... }]  │  │
│  │     }                                                  │  │
│  │                                                        │  │
│  │  3. Insert into pls_match_results                      │  │
│  │                                                        │  │
│  │  4. Mismatch detection:                                │  │
│  │     PLS returns canonical data alongside the match —   │  │
│  │     no separate catalog lookups needed. Compare:       │  │
│  │     - item_name vs catalog name for that product_id    │  │
│  │     - brand_name vs catalog brand                      │  │
│  │     - size format vs catalog standard                  │  │
│  │                                                        │  │
│  │  Decision gate:                                        │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │ IF any catalog mismatches found:                │   │  │
│  │  │   → status = 'rejected_mismatch'                │   │  │
│  │  │   → store mismatch details + "Also update"      │   │  │
│  │  │     suggestions                                 │   │  │
│  │  │   → STOP pipeline, return mismatch results      │   │  │
│  │  │ ELSE:                                           │   │  │
│  │  │   → continue to Phase 4                         │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
│                          │                                    │
│                          ▼                                    │
│  ┌─── PHASE 4: Diff Computation ─────────────────────────┐  │
│  │                                                        │  │
│  │  1. Fetch most recent feed_snapshot for this retailer  │  │
│  │  2. Join current feed_items + pls_match_results        │  │
│  │     against feed_snapshot_items on scan_code           │  │
│  │                                                        │  │
│  │  3. Classify each item:                                │  │
│  │     ┌────────────────────────────────────────────────┐ │  │
│  │     │ In current, not in snapshot  → 'added'         │ │  │
│  │     │ In snapshot, not in current  → 'removed'       │ │  │
│  │     │ In both, fields differ       → 'changed'       │ │  │
│  │     │ In both, fields identical    → 'unchanged'     │ │  │
│  │     └────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │  4. For each 'changed' item, compute field-level diff: │  │
│  │     Compare ALL canonical fields:                      │  │
│  │     item_name, brand_name, price, sale_price,          │  │
│  │     cost_unit, size, weight, unit_of_measure,          │  │
│  │     category, department, available, alcohol,          │  │
│  │     remote_image_url, item_details, ingredients        │  │
│  │                                                        │  │
│  │  5. Assign severity per change:                        │  │
│  │     - critical: cost_unit flip (EA↔LB),                │  │
│  │                 alcohol flag change,                    │  │
│  │                 missing image/brand/nutrition           │  │
│  │     - warning:  size changes, availability changes     │  │
│  │     - info:     price updates, new promos, new items   │  │
│  │                                                        │  │
│  │  6. Insert feed_diffs + feed_diff_items                │  │
│  │  7. Save current state as new feed_snapshot            │  │
│  └────────────────────────────────────────────────────────┘  │
│                          │                                    │
│                          ▼                                    │
│  ┌─── PHASE 5: Quality Score & Anomaly Detection ────────┐  │
│  │                                                        │  │
│  │  Quality Score:                                        │  │
│  │    catalog_ready = items passing ALL 7 readiness checks│  │
│  │    score = (catalog_ready / total) * 100               │  │
│  │    breakdown = GROUP BY failing_criteria, COUNT(*)      │  │
│  │    → Insert feed_quality_score_history                  │  │
│  │    → Update feed_diffs.quality_score                    │  │
│  │                                                        │  │
│  │  Anomaly Detection:                                    │  │
│  │    Per category, compute:                              │  │
│  │    ┌────────────────────┬───────────┬──────────────┐   │  │
│  │    │ Condition          │ Threshold │ Alert type   │   │  │
│  │    ├────────────────────┼───────────┼──────────────┤   │  │
│  │    │ Name changes in cat│ >20%      │ bulk_name    │   │  │
│  │    │ Removals in cat    │ >10%      │ bulk_removal │   │  │
│  │    │ Price changes in   │ >15%      │ bulk_price   │   │  │
│  │    │  cat               │           │              │   │  │
│  │    │ Alcohol flag change│ any       │ alcohol_flag │   │  │
│  │    │ Cost unit flip     │ any       │ cost_unit    │   │  │
│  │    └────────────────────┴───────────┴──────────────┘   │  │
│  │    → Insert feed_anomaly_alerts                        │  │
│  │                                                        │  │
│  │  AI Summary (async — non-blocking):                     │  │
│  │    Finish job with ai_summary = null.                  │  │
│  │    Fire a separate async task to generate summary.     │  │
│  │    Update feed_diffs.ai_summary when ready.            │  │
│  │    UI shows "Generating summary..." placeholder.       │  │
│  │                                                        │  │
│  │  Final status:                                         │  │
│  │    IF any warnings → 'completed_with_warnings'         │  │
│  │    ELSE            → 'completed'                       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## API Surface

The IPP frontend (`retailer-platform-web-workspace`) uses **GraphQL via Apollo** for everything. The `data-ingestion` domain uses Protobuf-backed GraphQL mesh endpoints. Adding REST would mean bolting on a second HTTP client alongside Apollo or wrapping REST in GraphQL at the BFF layer. All endpoints are GraphQL-native.

### Upload & Status

```graphql
# File upload — use multipart request via Apollo Upload
mutation uploadFeed($retailerId: ID!, $file: Upload!) {
  uploadFeed(retailerId: $retailerId, file: $file) {
    uploadId
    status
  }
}

# Status polling (recommended interval: every 2s)
query feedUploadStatus($retailerId: ID!, $uploadId: ID!) {
  feedUploadStatus(retailerId: $retailerId, uploadId: $uploadId) {
    uploadId
    status
    totalRows
    validRows
    invalidRows
    rejectionReason
    processedAt
  }
}
```

### Results (once processing complete)

```graphql
query feedValidation($retailerId: ID!, $uploadId: ID!) {
  feedValidation(retailerId: $retailerId, uploadId: $uploadId) {
    status
    summary {
      totalItems
      valid
      invalid
      blockingErrors
    }
    violations {
      itemId
      rowNumber
      field
      rule
      message
      severity
    }
  }
}

query feedMatches($retailerId: ID!, $uploadId: ID!) {
  feedMatches(retailerId: $retailerId, uploadId: $uploadId) {
    matchedCount
    unmatchedCount
    items {
      scanCode
      codeType
      productId
      matchMethod
      confidence
      alternatives { productId, score }
      isDuplicate
    }
  }
}

query feedDiff($retailerId: ID!, $diffId: ID!) {
  feedDiff(retailerId: $retailerId, diffId: $diffId) {
    diffId
    uploadId
    previousUploadId
    addedCount
    removedCount
    changedCount
    qualityScore
    aiSummary
    categories { id, label, severity, count }
  }
}

query feedDiffItems(
  $retailerId: ID!
  $diffId: ID!
  $changeType: ChangeType
  $severity: Severity
  $category: String
  $page: Int
  $perPage: Int
) {
  feedDiffItems(
    retailerId: $retailerId
    diffId: $diffId
    changeType: $changeType
    severity: $severity
    category: $category
    page: $page
    perPage: $perPage
  ) {
    items {
      scanCode
      productId
      productName
      changeType
      severity
      fieldChanges { field, previous, current, isHighSeverity }
      isCatalogReady
      notReadyReasons
    }
    pagination { page, perPage, total }
  }
}

query feedQuality($retailerId: ID!) {
  feedQuality(retailerId: $retailerId) {
    current {
      score
      catalogReadyCount
      totalCount
      notReadyCount
      breakdown { field, count }
    }
    trend { uploadId, score, computedAt }
  }
}

query feedAnomalyAlerts($retailerId: ID!, $uploadId: ID!) {
  feedAnomalyAlerts(retailerId: $retailerId, uploadId: $uploadId) {
    alerts {
      alertId
      type
      category
      affectedCount
      affectedPct
      description
      isDismissible
    }
  }
}

mutation dismissAnomalyAlert($retailerId: ID!, $alertId: ID!) {
  dismissAnomalyAlert(retailerId: $retailerId, alertId: $alertId) {
    dismissedAt
  }
}
```

### Upload Cancellation

```graphql
mutation cancelFeedUpload($retailerId: ID!, $uploadId: ID!) {
  cancelFeedUpload(retailerId: $retailerId, uploadId: $uploadId) {
    uploadId
    status
  }
}
```

### Column Mapping (admin/onboarding)

```graphql
query feedColumnMappings($retailerId: ID!) {
  feedColumnMappings(retailerId: $retailerId) {
    mappingId
    sourceColumn
    canonicalField
    transformRule
  }
}

# Partial update — only send the mappings you want to change
mutation updateFeedColumnMappings(
  $retailerId: ID!
  $mappings: [ColumnMappingInput!]!
) {
  updateFeedColumnMappings(retailerId: $retailerId, mappings: $mappings) {
    mappingId
    sourceColumn
    canonicalField
    transformRule
  }
}
```

### Error Responses

All mutations return structured errors via GraphQL's standard `errors` array:

```graphql
{
  "errors": [{
    "message": "Upload exceeds maximum file size",
    "extensions": {
      "code": "VALIDATION_ERROR",
      "field": "file",
      "details": "Max file size is 100MB"
    }
  }]
}
```

---

## PLS Integration Detail

### Service Info

| Property | Value |
|---|---|
| Service | `background.rpc.product-retrieval.customers` |
| RPC | `GetBulkRetailerProductCodeMatching` |
| Max batch size | 10,000 codes per call |
| Latency | ~350ms per 10k codes |
| Contact | `#prj-product-code-matching`, Catalog Interfaces team |

### Request Schema

```protobuf
message GetBulkRetailerProductCodeMatchingRequest {
  int64 retailer_id = 1;
  repeated CodeLookup codes = 2;
}

message CodeLookup {
  string code = 1;          // "0007754100515"
  CodeType code_type = 2;   // UPC, RRC, PLU, SKU, EXTERNAL_INTEGRATION_ID
}
```

### Response Schema

```protobuf
message GetBulkRetailerProductCodeMatchingResponse {
  repeated CodeMatchResult results = 1;
}

message CodeMatchResult {
  string code = 1;
  int64 product_id = 2;          // 0 if no match
  string matched_method = 3;     // "exact_upc", "check_digit_strip", "fuzzy"
  float confidence = 4;          // 0.0 - 1.0
  repeated AlternativeMatch alternatives = 5;
}
```

### Batching Strategy

```
total_codes = len(feed_items)
batch_size = 10_000
batches = ceil(total_codes / batch_size)

For a 50,000 SKU retailer:
  5 batches x ~350ms = ~1.75 seconds total PLS time
  + network overhead ≈ ~3 seconds

For a 100,000 SKU retailer:
  10 batches x ~350ms = ~3.5 seconds total PLS time
  Can parallelize batches (3 concurrent) → ~1.2 seconds
```

---

## Mismatch Detection Logic

PLS returns canonical catalog data alongside the match result — no separate catalog lookups are needed. Compare the feed item fields against the PLS-returned canonical data:

```python
def detect_mismatches(feed_item, catalog_record):
    mismatches = []

    # Name mismatch
    if normalize(feed_item.item_name) != normalize(catalog_record.name):
        mismatches.append({
            "field": "item_name",
            "feed_value": feed_item.item_name,
            "catalog_value": catalog_record.name,
            "also_update": [
                {"field": "size", "reason": "Name implies count — verify size matches"},
                {"field": "remote_image_url", "reason": "Image may show old packaging"},
                {"field": "item_details", "reason": "Nutritional info may differ"},
            ]
        })

    # Brand mismatch
    if normalize(feed_item.brand_name) != normalize(catalog_record.brand):
        mismatches.append({
            "field": "brand_name",
            "feed_value": feed_item.brand_name,
            "catalog_value": catalog_record.brand,
            "also_update": [
                {"field": "item_name", "reason": "Item name may reference old brand"},
                {"field": "remote_image_url", "reason": "Packaging likely changed"},
            ]
        })

    # Size format mismatch
    if not size_formats_compatible(feed_item.size, catalog_record.size):
        mismatches.append({
            "field": "size",
            "feed_value": feed_item.size,
            "catalog_value": catalog_record.size,
            "also_update": [
                {"field": "item_name", "reason": "Standardize name to match size format"},
                {"field": "price", "reason": "Price may need adjustment for new size"},
            ]
        })

    return mismatches
```

---

## Data Lifecycle

```
Upload day 1:  No previous snapshot exists
               → skip diff (show "Initial load — no previous feed")
               → compute quality score
               → save snapshot

Upload day 2:  Previous snapshot from day 1 exists
               → compute full diff
               → compute quality score (trend: 2 points)
               → save new snapshot (keep day 1 snapshot as rollback)

Upload day N:  Previous snapshot from day N-1
               → full diff + quality trend (last 5 from history table)
               → save new snapshot, prune oldest if > 3 retained
```

### Snapshot Retention

Keep the **last 3 snapshots** per retailer (instead of overwriting). If a corrupted or bad feed gets processed and overwrites the baseline, the next upload's diff would compare against bad data with no way back. Retaining 2-3 snapshots gives a rollback path with minimal storage overhead.

Enforce with a `UNIQUE(retailer_id, snapshot_type)` constraint per slot, or a trigger that prunes the oldest snapshot when count exceeds 3.

### Retention Windows

| Data | Retention | Cleanup mechanism |
|---|---|---|
| `feed_uploads` + `feed_items` + `feed_item_validations` + `pls_match_results` | 30 days | Scheduled Temporal workflow / cron |
| `feed_diffs` + `feed_diff_items` | Last 30 per retailer | Scheduled cleanup |
| `feed_quality_score_history` | Last 30 entries per retailer | Scheduled cleanup |
| `feed_snapshots` + `feed_snapshot_items` | Last 3 per retailer | Pruned on new snapshot creation |

Auto-cleanup runs as a scheduled Temporal workflow (production) or cron job that sweeps stale data per the retention windows above.

---

## Sequence Diagram: Full Upload Flow

```
IPP Client          IPP API          Worker          S3          PLS          DB
    │                  │                │              │            │            │
    │─POST /uploads───▶│                │              │            │            │
    │                  │─store file────▶│              │            │            │
    │                  │─insert row───────────────────────────────────────────▶ │
    │                  │─enqueue job───▶│              │            │            │
    │◀─{upload_id}─────│                │              │            │            │
    │                  │                │              │            │            │
    │  (poll status)   │                │─fetch file──▶│            │            │
    │─GET /status─────▶│                │◀─file bytes──│            │            │
    │◀─"parsing"───────│                │              │            │            │
    │                  │                │─parse + map columns       │            │
    │                  │                │─insert feed_items───────────────────▶ │
    │─GET /status─────▶│                │              │            │            │
    │◀─"validating"────│                │─validate each item       │            │
    │                  │                │─insert validations──────────────────▶ │
    │                  │                │              │            │            │
    │                  │                │ [if blocking errors: status=rejected, STOP]
    │                  │                │              │            │            │
    │─GET /status─────▶│                │              │            │            │
    │◀─"matching"──────│                │─batch codes─────────────▶│            │
    │                  │                │◀─match results + canonical data──────│
    │                  │                │─insert pls_match_results─────────────▶ │
    │                  │                │              │            │            │
    │                  │                │─detect mismatches (using PLS canonical data)
    │                  │                │              │            │            │
    │                  │                │ [if mismatches: status=rejected_mismatch, STOP]
    │                  │                │              │            │            │
    │─GET /status─────▶│                │              │            │            │
    │◀─"computing_diff"│                │─fetch previous snapshot────────────▶ │
    │                  │                │◀─snapshot data──────────────────────  │
    │                  │                │─compute diff + quality + alerts       │
    │                  │                │─insert results──────────────────────▶ │
    │                  │                │─save new snapshot───────────────────▶ │
    │                  │                │              │            │            │
    │─GET /status─────▶│                │              │            │            │
    │◀─"completed"─────│                │              │            │            │
    │                  │                │              │            │            │
    │─GET /diff────────▶│               │              │            │            │
    │◀─{diff + items}──│                │              │            │            │
```

---

## Estimated Processing Times

| Retailer size | Parse | Validate | PLS Match | Diff | Total |
|---|---|---|---|---|---|
| 1,000 SKUs | ~0.5s | ~0.3s | ~0.4s | ~0.5s | **~2s** |
| 10,000 SKUs | ~2s | ~1s | ~0.5s | ~2s | **~6s** |
| 50,000 SKUs | ~8s | ~3s | ~2s (3 concurrent batches) | ~5s | **~18s** |
| 100,000 SKUs | ~15s | ~5s | ~4s (3 concurrent batches) | ~10s | **~34s** |

For hackathon: fake all of this with seeded mock data (~2s simulated delay).
For production: show "processing" banner, poll status, render when complete.

---

## Technology Choices

| Component | Recommended | Rationale |
|---|---|---|
| API layer | Existing IPP BFF (Go or Ruby), **GraphQL** | Matches existing Apollo/GraphQL frontend stack |
| Worker (hackathon) | Synchronous inline processing | No async infra needed for demo with mock data |
| Worker (production) | **Temporal workflows** | Phase-level checkpointing, retry, dedup |
| Storage | PostgreSQL (existing IPP DB) | Relational joins for diff computation |
| File storage | S3/GCS (existing) | Retailer files already land here via data-ingestion |
| PLS client | gRPC via `product-retrieval` service mesh | Existing internal RPC |
| AI summary | Claude API (or internal LLM gateway), **async** | Non-blocking; UI shows placeholder until ready |
| Cache | Redis — cache latest snapshot per retailer | Avoid DB read on every upload |

---

## Open Questions for Production

| # | Question | Owner | Impact | Notes (from review) |
|---|---|---|---|---|
| 1 | Does data-ingestion retain raw feed files, and for how long? | Data-ingestion team | Determines if we can use Option B (raw file comparison) as a faster bridge | If yes, reuse those S3 paths instead of storing files again |
| 2 | Is there an existing audit/history mechanism in the catalog store? | Alejandro Lujan | Could replace `feed_snapshots` table entirely | If this exists, it's a big simplification — worth investigating before building |
| 3 | What is the PLS rate limit for the background tier? | #prj-product-code-matching | Determines max concurrency for batch calls | Drives batch parallelism and whether we need a circuit breaker |
| 4 | How should mismatch thresholds be configured per retailer? | Kyle Lydon (PM) | Some retailers may want stricter or looser matching | Start with global defaults, add per-retailer overrides later if needed |
| 5 | Should the AI summary use Claude or an internal model? | Eng leadership | Cost, latency, and data residency implications | Internal model if available (avoids sending retailer data externally). Claude with PII stripping as fallback |
| 6 | Column mapping: self-service UI or TAM-configured? | Karin Comas (PM) | Determines if we need a mapping editor in IPP | TAM-only for v1 — self-service needs a validation UI which is a project in itself |

## Scalability Notes (post-hackathon)

The design targets up to 100k SKUs, which is fine for now. For larger retailers (500k+ SKUs), the main concerns are:
- **`feed_items` table growth** — need partitioning by `uploaded_at` or `retailer_id`
- **`feed_snapshot_items`** — 500k rows per retailer, 1000 retailers = 500M rows unpartitioned
- **Redis snapshot cache** — 500k rows won't fit in a single key, need a different serialization/sharding strategy
- **PLS response caching** — most scan codes don't change between uploads, so caching `scan_code → product_id` with a 24h TTL would cut PLS load significantly
