// ── Mock Data Layer ────────────────────────────────────────────────────────
// Realistic seeded mock data for the four file statuses shown in Figma.
// Extends (does not replace) src/mockDiff.ts — existing exports are preserved.

import type {
  FeedUpload,
  FeedItem,
  FeedItemValidation,
  PlsMatchResult,
  FeedSnapshot,
  FeedSnapshotItem,
  FeedDiff,
  FeedDiffItem,
  FeedAnomalyAlert,
  FeedQualityScoreHistory,
  FeedColumnMapping,
  CodeType,
  DiffChangeType,
  DiffItemSeverity,
  ValidationSeverity,
} from '../types/feedTypes'

// ── Deterministic UUIDs (seeded, not random) ───────────────────────────────

const UUID = {
  // Uploads
  upload1: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',  // completed_with_warnings
  upload2: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',  // completed
  upload3: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',  // rejected_mismatch
  upload4: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',  // rejected_missing_fields

  // Diffs
  diff1: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
  diff2: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',

  // Snapshots
  snapshot1: '11111111-2222-4333-8444-555566667777',
  snapshot2: '22222222-3333-4444-8555-666677778888',

  // Retailer
  retailer: 12345,

  // Previous upload (for diffs)
  prevUpload: '99999999-8888-4777-8666-555544443333',
} as const

// ── Helper: generate sequential UUIDs ──────────────────────────────────────

let uuidCounter = 0
function seededUuid(prefix: string): string {
  uuidCounter += 1
  const hex = uuidCounter.toString(16).padStart(8, '0')
  return `${prefix}-${hex.slice(0, 4)}-4${hex.slice(4, 7)}-8000-${hex}0000`
}

// ── Timestamps ─────────────────────────────────────────────────────────────

const TS = {
  uploaded1: '2026-03-05T08:05:04.000Z',
  uploaded2: '2026-03-04T14:30:12.000Z',
  uploaded3: '2026-03-05T09:12:33.000Z',
  uploaded4: '2026-03-05T10:45:00.000Z',
  processed1: '2026-03-05T08:05:22.000Z',
  processed2: '2026-03-04T14:30:30.000Z',
  processed3: '2026-03-05T09:12:50.000Z',
  processed4: '2026-03-05T10:45:15.000Z',
  now: '2026-03-05T12:00:00.000Z',
} as const

// ═══════════════════════════════════════════════════════════════════════════
// 1. FEED UPLOADS — four files matching Figma statuses
// ═══════════════════════════════════════════════════════════════════════════

export const mockFeedUploads: FeedUpload[] = [
  {
    upload_id: UUID.upload1,
    retailer_id: UUID.retailer,
    file_name: 'smoke_test_inventory_file_reinventory__version_1__2026-03-05_08-05-04.csv.gz',
    file_format: 'csv.gz',
    file_size_bytes: 245_760,
    file_url: 's3://feed-uploads/12345/smoke_test_inventory_file_reinventory__version_1__2026-03-05_08-05-04.csv.gz',
    status: 'completed_with_warnings',
    total_rows: 10,
    valid_rows: 10,
    invalid_rows: 0,
    rejection_reason: null,
    uploaded_at: TS.uploaded1,
    processed_at: TS.processed1,
    created_at: TS.uploaded1,
    updated_at: TS.processed1,
  },
  {
    upload_id: UUID.upload2,
    retailer_id: UUID.retailer,
    file_name: 'smoke_test_inventory_file_reinventory__version_2__2026-03-04_14-30-12.csv.gz',
    file_format: 'csv.gz',
    file_size_bytes: 312_400,
    file_url: 's3://feed-uploads/12345/smoke_test_inventory_file_reinventory__version_2__2026-03-04_14-30-12.csv.gz',
    status: 'completed',
    total_rows: 12,
    valid_rows: 12,
    invalid_rows: 0,
    rejection_reason: null,
    uploaded_at: TS.uploaded2,
    processed_at: TS.processed2,
    created_at: TS.uploaded2,
    updated_at: TS.processed2,
  },
  {
    upload_id: UUID.upload3,
    retailer_id: UUID.retailer,
    file_name: 'smoke_test_inventory_file_reinventory__version_3__2026-03-05_09-12-33.csv.gz',
    file_format: 'csv.gz',
    file_size_bytes: 198_000,
    file_url: 's3://feed-uploads/12345/smoke_test_inventory_file_reinventory__version_3__2026-03-05_09-12-33.csv.gz',
    status: 'rejected_mismatch',
    total_rows: 8,
    valid_rows: 5,
    invalid_rows: 3,
    rejection_reason: '3 items have values that conflict with the Instacart catalog. Mismatches on item_name, brand_name, and size fields.',
    uploaded_at: TS.uploaded3,
    processed_at: TS.processed3,
    created_at: TS.uploaded3,
    updated_at: TS.processed3,
  },
  {
    upload_id: UUID.upload4,
    retailer_id: UUID.retailer,
    file_name: 'smoke_test_inventory_file_reinventory__version_4__2026-03-05_10-45-00.csv.gz',
    file_format: 'csv.gz',
    file_size_bytes: 156_200,
    file_url: 's3://feed-uploads/12345/smoke_test_inventory_file_reinventory__version_4__2026-03-05_10-45-00.csv.gz',
    status: 'rejected_missing_fields',
    total_rows: 4,
    valid_rows: 0,
    invalid_rows: 4,
    rejection_reason: '4 items are missing required fields (item_name, price, size, cost_unit). One item has an invalid lookup_code format.',
    uploaded_at: TS.uploaded4,
    processed_at: TS.processed4,
    created_at: TS.uploaded4,
    updated_at: TS.processed4,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// 2. FEED ITEMS — items for each upload
// ═══════════════════════════════════════════════════════════════════════════

function makeFeedItem(
  overrides: Partial<FeedItem> & Pick<FeedItem, 'item_id' | 'upload_id' | 'row_number' | 'scan_code' | 'item_name' | 'brand_name'>
): FeedItem {
  return {
    code_type: 'UPC' as CodeType,
    price: null,
    sale_price: null,
    cost_unit: null,
    size: null,
    weight: null,
    unit_of_measure: null,
    category: null,
    department: null,
    available: true,
    alcohol: false,
    remote_image_url: null,
    item_details: null,
    ingredients: null,
    loyalty_price: null,
    raw_row: null,
    created_at: TS.uploaded1,
    ...overrides,
  }
}

// ── Upload 1: Completed with warnings (10 items) ──────────────────────────

export const mockFeedItems_upload1: FeedItem[] = [
  makeFeedItem({
    item_id: seededUuid('fi1'),
    upload_id: UUID.upload1,
    row_number: 1,
    scan_code: '111183067',
    item_name: 'Insta Carrot Kit',
    brand_name: 'Carrot',
    price: 3.19,
    sale_price: 2.89,
    cost_unit: 'EA',
    size: '12 oz',
    category: 'Produce',
    department: 'Fresh',
    remote_image_url: null, // missing — triggers quality issue
  }),
  makeFeedItem({
    item_id: seededUuid('fi1'),
    upload_id: UUID.upload1,
    row_number: 2,
    scan_code: '000910002804',
    item_name: 'Garden Smoke Test Item A',
    brand_name: 'The Garden',
    price: 4.99,
    cost_unit: 'EA',
    size: '8 ct',
    category: 'Produce',
    department: 'Fresh',
    remote_image_url: null, // missing
  }),
  makeFeedItem({
    item_id: seededUuid('fi1'),
    upload_id: UUID.upload1,
    row_number: 3,
    scan_code: '871980400506',
    item_name: 'Garden Smoke Test Item B',
    brand_name: 'The Garden',
    price: 5.49,
    cost_unit: 'EA',
    size: '16 oz',
    category: 'Produce',
    department: 'Fresh',
    available: false, // availability change
    item_details: null,  // lost nutritional data
    ingredients: null,
  }),
  makeFeedItem({
    item_id: seededUuid('fi1'),
    upload_id: UUID.upload1,
    row_number: 4,
    scan_code: '715195952040',
    item_name: 'Garden Smoke Test Item C',
    brand_name: 'The Garden',
    price: 6.99,
    cost_unit: 'EA',
    size: '16 oz', // changed from 12 oz
    category: 'Produce',
    department: 'Fresh',
  }),
  makeFeedItem({
    item_id: seededUuid('fi1'),
    upload_id: UUID.upload1,
    row_number: 5,
    scan_code: '027426701069',
    item_name: 'Garden Smoke Test Item D',
    brand_name: 'The Garden',
    price: 3.99,
    cost_unit: 'EA', // was LB — cost_unit flip
    size: '1 lb',
    category: 'Produce',
    department: 'Fresh',
  }),
  makeFeedItem({
    item_id: seededUuid('fi1'),
    upload_id: UUID.upload1,
    row_number: 6,
    scan_code: '075919005743',
    item_name: 'Garden Smoke Test Item E',
    brand_name: 'The Garden',
    price: 8.99,
    cost_unit: 'EA',
    size: '24 oz',
    category: 'Bakery',
    department: 'Bakery',
  }),
  makeFeedItem({
    item_id: seededUuid('fi1'),
    upload_id: UUID.upload1,
    row_number: 7,
    scan_code: '027426428546',
    item_name: 'Garden Smoke Test Item F',
    brand_name: 'The Garden',
    price: 5.49,
    loyalty_price: 4.99,
    cost_unit: 'EA',
    size: '8 oz',
    category: 'Bakery',
    department: 'Bakery',
    available: false,
  }),
  makeFeedItem({
    item_id: seededUuid('fi1'),
    upload_id: UUID.upload1,
    row_number: 8,
    scan_code: '007535307771',
    item_name: 'Garden Smoke Test Item I',
    brand_name: 'The Garden',
    price: 2.99,
    cost_unit: 'EA',
    size: '1.5 lb', // changed from 1 lb
    category: 'Produce',
    department: 'Fresh',
  }),
  makeFeedItem({
    item_id: seededUuid('fi1'),
    upload_id: UUID.upload1,
    row_number: 9,
    scan_code: '048661114995',
    item_name: 'Garden Smoke Test Item J',
    brand_name: 'The Garden',
    price: 7.49,
    cost_unit: 'LB', // was EA — cost_unit flip
    size: '2 lb',
    category: 'Deli',
    department: 'Deli',
    alcohol: false,
  }),
  makeFeedItem({
    item_id: seededUuid('fi1'),
    upload_id: UUID.upload1,
    row_number: 10,
    scan_code: '070798001770',
    item_name: 'Garden Smoke Test Item H',
    brand_name: 'The Garden',
    price: 3.79,
    cost_unit: 'EA',
    size: '6 oz',
    category: 'Bakery',
    department: 'Bakery',
    alcohol: true, // alcohol status change
  }),
]

// ── Upload 2: Completed / clean (12 items) ─────────────────────────────────

const cleanScanCodes = [
  '041331023047', '041331023054', '041331023061', '041331023078',
  '041331023085', '041331023092', '041331023108', '041331023115',
  '041331023122', '041331023139', '041331023146', '041331023153',
]

const cleanNames = [
  'Organic Whole Milk 1 Gal',       'Organic 2% Milk 1 Gal',
  'Organic Half & Half 16oz',       'Organic Heavy Cream 16oz',
  'Organic Butter Unsalted 1lb',    'Organic Butter Salted 1lb',
  'Organic Sour Cream 16oz',        'Organic Cream Cheese 8oz',
  'Organic Cottage Cheese 16oz',    'Organic Greek Yogurt 32oz',
  'Organic Vanilla Yogurt 32oz',    'Organic Strawberry Yogurt 32oz',
]

export const mockFeedItems_upload2: FeedItem[] = cleanScanCodes.map((sc, i) =>
  makeFeedItem({
    item_id: seededUuid('fi2'),
    upload_id: UUID.upload2,
    row_number: i + 1,
    scan_code: sc,
    item_name: cleanNames[i],
    brand_name: 'Valley Fresh Farms',
    price: 3.99 + i * 0.5,
    cost_unit: 'EA',
    size: ['1 gal', '1 gal', '16 oz', '16 oz', '1 lb', '1 lb', '16 oz', '8 oz', '16 oz', '32 oz', '32 oz', '32 oz'][i],
    category: 'Dairy',
    department: 'Dairy',
    remote_image_url: `https://images.example.com/${sc}.jpg`,
    created_at: TS.uploaded2,
  })
)

// ── Upload 3: Rejected — mismatch detected (8 items, 3 with conflicts) ────

export const mockFeedItems_upload3: FeedItem[] = [
  makeFeedItem({
    item_id: seededUuid('fi3'),
    upload_id: UUID.upload3,
    row_number: 1,
    scan_code: '111183067',
    item_name: 'Insta Carrot Kit',         // catalog says "Insta Carrot Kit 12ct"
    brand_name: 'Carrot',
    price: 3.19,
    cost_unit: 'EA',
    size: '12 oz',
    category: 'Produce',
    department: 'Fresh',
    created_at: TS.uploaded3,
  }),
  makeFeedItem({
    item_id: seededUuid('fi3'),
    upload_id: UUID.upload3,
    row_number: 2,
    scan_code: '027426701069',
    item_name: 'Garden Smoke Test Item D',
    brand_name: 'Garden Fresh',            // catalog says "The Garden Co."
    price: 3.99,
    cost_unit: 'EA',
    size: '14 oz',                         // catalog says 16 oz
    category: 'Produce',
    department: 'Fresh',
    created_at: TS.uploaded3,
  }),
  makeFeedItem({
    item_id: seededUuid('fi3'),
    upload_id: UUID.upload3,
    row_number: 3,
    scan_code: '724504081999',
    item_name: 'Garden Smoke Test Item G',
    brand_name: 'The Garden',
    price: 7.49,
    cost_unit: 'EA',
    size: '6-pack',                        // catalog says "6 ct"
    category: 'Beverages',
    department: 'Beverages',
    created_at: TS.uploaded3,
  }),
  // 5 clean items that passed validation
  ...['041331025001', '041331025002', '041331025003', '041331025004', '041331025005'].map((sc, i) =>
    makeFeedItem({
      item_id: seededUuid('fi3'),
      upload_id: UUID.upload3,
      row_number: 4 + i,
      scan_code: sc,
      item_name: `Clean Item ${String.fromCharCode(65 + i)}`,
      brand_name: 'Valley Fresh Farms',
      price: 2.49 + i * 0.3,
      cost_unit: 'EA',
      size: `${8 + i * 2} oz`,
      category: 'Dairy',
      department: 'Dairy',
      created_at: TS.uploaded3,
    })
  ),
]

// ── Upload 4: Rejected — missing fields (4 items) ─────────────────────────

export const mockFeedItems_upload4: FeedItem[] = [
  makeFeedItem({
    item_id: seededUuid('fi4'),
    upload_id: UUID.upload4,
    row_number: 1,
    scan_code: '42421162066',
    item_name: '',                  // missing
    brand_name: '',
    price: null,                    // missing
    cost_unit: null,                // missing
    size: null,                     // missing
    category: 'General',
    department: 'General',
    created_at: TS.uploaded4,
  }),
  makeFeedItem({
    item_id: seededUuid('fi4'),
    upload_id: UUID.upload4,
    row_number: 2,
    scan_code: '715195952040',
    item_name: '',                  // missing
    brand_name: 'The Garden',
    price: null,                    // missing
    cost_unit: 'EA',
    size: '12 oz',
    category: 'Produce',
    department: 'Fresh',
    created_at: TS.uploaded4,
  }),
  makeFeedItem({
    item_id: seededUuid('fi4'),
    upload_id: UUID.upload4,
    row_number: 3,
    scan_code: '048661114995',
    item_name: 'Garden Smoke Test Item J',
    brand_name: 'The Garden',
    price: 7.49,
    cost_unit: 'EA',
    size: null,                     // missing
    available: null,                // missing
    category: 'Deli',
    department: 'Deli',
    created_at: TS.uploaded4,
  }),
  makeFeedItem({
    item_id: seededUuid('fi4'),
    upload_id: UUID.upload4,
    row_number: 4,
    scan_code: ':027426701069',     // invalid — starts with ':'
    item_name: 'Garden Smoke Test Item D',
    brand_name: 'The Garden',
    price: 3.99,
    cost_unit: 'EA',
    size: '16 oz',
    category: 'Produce',
    department: 'Fresh',
    created_at: TS.uploaded4,
  }),
]

// Aggregate all feed items
export const mockFeedItems: FeedItem[] = [
  ...mockFeedItems_upload1,
  ...mockFeedItems_upload2,
  ...mockFeedItems_upload3,
  ...mockFeedItems_upload4,
]

// ═══════════════════════════════════════════════════════════════════════════
// 3. FEED ITEM VALIDATIONS — blocking errors for upload 4
// ═══════════════════════════════════════════════════════════════════════════

function makeValidation(
  overrides: Partial<FeedItemValidation> & Pick<FeedItemValidation, 'validation_id' | 'item_id' | 'upload_id' | 'field' | 'rule' | 'message'>
): FeedItemValidation {
  return {
    severity: 'error' as ValidationSeverity,
    is_blocking: true,
    created_at: TS.processed4,
    ...overrides,
  }
}

export const mockFeedItemValidations: FeedItemValidation[] = [
  // Item 1 (42421162066): missing item_name, size, cost_unit
  makeValidation({
    validation_id: seededUuid('val'),
    item_id: mockFeedItems_upload4[0].item_id,
    upload_id: UUID.upload4,
    field: 'item_name',
    rule: 'required_non_empty',
    message: 'item_name is required and must not be empty',
  }),
  makeValidation({
    validation_id: seededUuid('val'),
    item_id: mockFeedItems_upload4[0].item_id,
    upload_id: UUID.upload4,
    field: 'size',
    rule: 'required_size_weight_uom',
    message: 'At least one of size, weight, or unit_of_measure is required',
  }),
  makeValidation({
    validation_id: seededUuid('val'),
    item_id: mockFeedItems_upload4[0].item_id,
    upload_id: UUID.upload4,
    field: 'cost_unit',
    rule: 'required_cost_unit',
    message: 'cost_unit is required and must be one of EA, LB',
  }),
  // Item 2 (715195952040): missing item_name, price
  makeValidation({
    validation_id: seededUuid('val'),
    item_id: mockFeedItems_upload4[1].item_id,
    upload_id: UUID.upload4,
    field: 'item_name',
    rule: 'required_non_empty',
    message: 'item_name is required and must not be empty',
  }),
  makeValidation({
    validation_id: seededUuid('val'),
    item_id: mockFeedItems_upload4[1].item_id,
    upload_id: UUID.upload4,
    field: 'price',
    rule: 'required_positive_price',
    message: 'price is required and must be greater than $0',
  }),
  // Item 3 (048661114995): missing size, available
  makeValidation({
    validation_id: seededUuid('val'),
    item_id: mockFeedItems_upload4[2].item_id,
    upload_id: UUID.upload4,
    field: 'size',
    rule: 'required_size_weight_uom',
    message: 'At least one of size, weight, or unit_of_measure is required',
  }),
  makeValidation({
    validation_id: seededUuid('val'),
    item_id: mockFeedItems_upload4[2].item_id,
    upload_id: UUID.upload4,
    field: 'available',
    rule: 'required_boolean',
    message: 'available field is required',
    severity: 'warning',
    is_blocking: false,
  }),
  // Item 4 (:027426701069): invalid scan_code format
  makeValidation({
    validation_id: seededUuid('val'),
    item_id: mockFeedItems_upload4[3].item_id,
    upload_id: UUID.upload4,
    field: 'scan_code',
    rule: 'valid_scan_code_format',
    message: 'scan_code must not start with ":" — invalid lookup_code format',
  }),
]

// ═══════════════════════════════════════════════════════════════════════════
// 4. PLS MATCH RESULTS — for uploads 1, 2, and 3
// ═══════════════════════════════════════════════════════════════════════════

function makePlsMatch(
  overrides: Partial<PlsMatchResult> & Pick<PlsMatchResult, 'match_id' | 'item_id' | 'upload_id' | 'scan_code'>
): PlsMatchResult {
  return {
    code_type: 'UPC' as CodeType,
    matched_product_id: null,
    match_method: 'exact_upc',
    match_confidence: 0.99,
    alternative_ids: null,
    is_duplicate: false,
    pls_response_raw: null,
    latency_ms: 45,
    created_at: TS.processed1,
    ...overrides,
  }
}

export const mockPlsMatchResults: PlsMatchResult[] = [
  // Upload 1 items — all matched
  ...mockFeedItems_upload1.map((fi, i) =>
    makePlsMatch({
      match_id: seededUuid('pls1'),
      item_id: fi.item_id,
      upload_id: UUID.upload1,
      scan_code: fi.scan_code,
      matched_product_id: 10000001 + i,
      latency_ms: 30 + Math.floor(i * 3.7),
    })
  ),
  // Upload 2 items — all matched
  ...mockFeedItems_upload2.map((fi, i) =>
    makePlsMatch({
      match_id: seededUuid('pls2'),
      item_id: fi.item_id,
      upload_id: UUID.upload2,
      scan_code: fi.scan_code,
      matched_product_id: 20000001 + i,
      latency_ms: 25 + Math.floor(i * 2.1),
      created_at: TS.processed2,
    })
  ),
  // Upload 3 items — matched but with catalog mismatches on first 3
  ...mockFeedItems_upload3.map((fi, i) =>
    makePlsMatch({
      match_id: seededUuid('pls3'),
      item_id: fi.item_id,
      upload_id: UUID.upload3,
      scan_code: fi.scan_code,
      matched_product_id: 30000001 + i,
      match_confidence: i < 3 ? 0.85 : 0.99,
      latency_ms: 35 + Math.floor(i * 4.2),
      created_at: TS.processed3,
    })
  ),
]

// ═══════════════════════════════════════════════════════════════════════════
// 5. FEED SNAPSHOTS — previous state for diff comparison
// ═══════════════════════════════════════════════════════════════════════════

export const mockFeedSnapshots: FeedSnapshot[] = [
  {
    snapshot_id: UUID.snapshot1,
    retailer_id: UUID.retailer,
    upload_id: UUID.prevUpload,
    snapshot_type: 'pre_ingestion',
    item_count: 10,
    created_at: '2026-03-04T08:00:00.000Z',
  },
  {
    snapshot_id: UUID.snapshot2,
    retailer_id: UUID.retailer,
    upload_id: UUID.upload1,
    snapshot_type: 'pre_ingestion',
    item_count: 10,
    created_at: TS.processed1,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// 6. FEED SNAPSHOT ITEMS — previous catalog state
// ═══════════════════════════════════════════════════════════════════════════

export const mockFeedSnapshotItems: FeedSnapshotItem[] = [
  {
    snapshot_item_id: seededUuid('ssi'),
    snapshot_id: UUID.snapshot1,
    scan_code: '111183067',
    product_id: 10000001,
    item_name: 'Insta Carrot Kit',
    brand_name: 'Carrot Fresh',
    price: 2.49,
    sale_price: null,
    cost_unit: 'EA',
    size: '12 oz',
    category: 'Produce',
    available: true,
    alcohol: false,
    remote_image_url: 'https://images.example.com/111183067.jpg',
    item_details: { calories: '150', fat: '3g', sodium: '180mg' },
    all_fields: null,
  },
  {
    snapshot_item_id: seededUuid('ssi'),
    snapshot_id: UUID.snapshot1,
    scan_code: '000910002804',
    product_id: 10000002,
    item_name: 'Garden Smoke Test Item A',
    brand_name: 'The Garden',
    price: 4.99,
    sale_price: null,
    cost_unit: 'EA',
    size: '6 ct',
    category: 'Produce',
    available: true,
    alcohol: false,
    remote_image_url: 'https://images.example.com/000910002804.jpg',
    item_details: null,
    all_fields: null,
  },
  {
    snapshot_item_id: seededUuid('ssi'),
    snapshot_id: UUID.snapshot1,
    scan_code: '871980400506',
    product_id: 10000003,
    item_name: 'Garden Smoke Test Item B',
    brand_name: 'The Garden',
    price: 5.49,
    sale_price: null,
    cost_unit: 'EA',
    size: '16 oz',
    category: 'Produce',
    available: true,
    alcohol: false,
    remote_image_url: null,
    item_details: { calories: '120', fat: '5g', sodium: '200mg' },
    all_fields: null,
  },
  {
    snapshot_item_id: seededUuid('ssi'),
    snapshot_id: UUID.snapshot1,
    scan_code: '715195952040',
    product_id: 10000004,
    item_name: 'Garden Smoke Test Item C',
    brand_name: 'The Garden',
    price: 6.99,
    sale_price: null,
    cost_unit: 'EA',
    size: '12 oz',
    category: 'Produce',
    available: true,
    alcohol: false,
    remote_image_url: null,
    item_details: null,
    all_fields: null,
  },
  {
    snapshot_item_id: seededUuid('ssi'),
    snapshot_id: UUID.snapshot1,
    scan_code: '027426701069',
    product_id: 10000005,
    item_name: 'Garden Smoke Test Item D',
    brand_name: 'The Garden',
    price: 3.99,
    sale_price: null,
    cost_unit: 'LB',   // previous was LB, now EA
    size: '1 lb',
    category: 'Produce',
    available: true,
    alcohol: false,
    remote_image_url: null,
    item_details: null,
    all_fields: null,
  },
  {
    snapshot_item_id: seededUuid('ssi'),
    snapshot_id: UUID.snapshot1,
    scan_code: '075919005743',
    product_id: 10000006,
    item_name: 'Garden Smoke Test Item E',
    brand_name: 'The Garden',
    price: 8.99,
    sale_price: null,
    cost_unit: 'EA',
    size: '24 oz',
    category: 'Bakery',
    available: true,
    alcohol: false,
    remote_image_url: null,
    item_details: null,
    all_fields: null,
  },
  {
    snapshot_item_id: seededUuid('ssi'),
    snapshot_id: UUID.snapshot1,
    scan_code: '027426428546',
    product_id: 10000007,
    item_name: 'Garden Smoke Test Item F',
    brand_name: 'The Garden',
    price: 4.99,
    sale_price: null,
    cost_unit: 'EA',
    size: '8 oz',
    category: 'Bakery',
    available: true,
    alcohol: false,
    remote_image_url: null,
    item_details: null,
    all_fields: null,
  },
  {
    snapshot_item_id: seededUuid('ssi'),
    snapshot_id: UUID.snapshot1,
    scan_code: '007535307771',
    product_id: 10000008,
    item_name: 'Garden Smoke Test Item I',
    brand_name: 'The Garden',
    price: 2.99,
    sale_price: null,
    cost_unit: 'EA',
    size: '1 lb',
    category: 'Produce',
    available: true,
    alcohol: false,
    remote_image_url: null,
    item_details: null,
    all_fields: null,
  },
  {
    snapshot_item_id: seededUuid('ssi'),
    snapshot_id: UUID.snapshot1,
    scan_code: '048661114995',
    product_id: 10000009,
    item_name: 'Garden Smoke Test Item J',
    brand_name: 'The Garden',
    price: 7.49,
    sale_price: null,
    cost_unit: 'EA',  // was EA, now LB
    size: '2 lb',
    category: 'Deli',
    available: true,
    alcohol: false,
    remote_image_url: null,
    item_details: null,
    all_fields: null,
  },
  {
    snapshot_item_id: seededUuid('ssi'),
    snapshot_id: UUID.snapshot1,
    scan_code: '070798001770',
    product_id: 10000010,
    item_name: 'Garden Smoke Test Item H',
    brand_name: 'The Garden',
    price: 3.29,
    sale_price: null,
    cost_unit: 'EA',
    size: '6 oz',
    category: 'Bakery',
    available: true,
    alcohol: false,
    remote_image_url: null,
    item_details: null,
    all_fields: null,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// 7. FEED DIFFS — summary for completed uploads
// ═══════════════════════════════════════════════════════════════════════════

export const mockFeedDiffs: FeedDiff[] = [
  {
    diff_id: UUID.diff1,
    upload_id: UUID.upload1,
    previous_upload_id: UUID.prevUpload,
    retailer_id: UUID.retailer,
    added_count: 0,
    removed_count: 0,
    changed_count: 10,
    unchanged_count: 0,
    quality_score: 82,
    catalog_ready_count: 410,
    not_ready_count: 90,
    ai_summary: 'Your March 5 feed was accepted with 4 catalog quality issues to review. Two items are missing product images which reduces storefront visibility, and one item lost nutritional data. 2 unit-of-measure changes were detected \u2014 a lb \u2192 each flip on Item D may affect weight-based pricing. 5 price or promo updates were applied, including a new percent_off promotion on Insta Carrot Kit and a removed sale on Item G. 3 size descriptor changes and 2 new items were also added.',
    computed_at: TS.processed1,
    created_at: TS.processed1,
  },
  {
    diff_id: UUID.diff2,
    upload_id: UUID.upload2,
    previous_upload_id: UUID.upload1,
    retailer_id: UUID.retailer,
    added_count: 12,
    removed_count: 0,
    changed_count: 0,
    unchanged_count: 0,
    quality_score: 100,
    catalog_ready_count: 12,
    not_ready_count: 0,
    ai_summary: 'Your March 4 feed was accepted cleanly. 12 new dairy items were added, all with complete product data including images, pricing, and nutritional information. No quality issues detected.',
    computed_at: TS.processed2,
    created_at: TS.processed2,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// 8. FEED DIFF ITEMS — per-item detail for upload 1 diff
// ═══════════════════════════════════════════════════════════════════════════

export const mockFeedDiffItems: FeedDiffItem[] = [
  // Sellability / quality issues
  {
    diff_item_id: seededUuid('dfi'),
    diff_id: UUID.diff1,
    item_id: mockFeedItems_upload1[0].item_id,
    scan_code: '111183067',
    product_id: 10000001,
    change_type: 'changed' as DiffChangeType,
    severity: 'critical' as DiffItemSeverity,
    change_summary: 'remote_image_url: removed; brand_name: "Carrot Fresh" -> "(empty)"',
    field_changes: [
      { field: 'remote_image_url', previous: 'https://images.example.com/111183067.jpg', current: null, is_high_severity: true },
      { field: 'brand_name', previous: 'Carrot Fresh', current: null, is_high_severity: false },
    ],
    is_catalog_ready: false,
    not_ready_reasons: ['missing_image', 'missing_brand'],
    created_at: TS.processed1,
  },
  {
    diff_item_id: seededUuid('dfi'),
    diff_id: UUID.diff1,
    item_id: mockFeedItems_upload1[1].item_id,
    scan_code: '000910002804',
    product_id: 10000002,
    change_type: 'changed' as DiffChangeType,
    severity: 'critical' as DiffItemSeverity,
    change_summary: 'remote_image_url: removed; size: "6 ct" -> "8 ct"',
    field_changes: [
      { field: 'remote_image_url', previous: 'https://images.example.com/000910002804.jpg', current: null, is_high_severity: true },
      { field: 'size', previous: '6 ct', current: '8 ct', is_high_severity: false },
    ],
    is_catalog_ready: false,
    not_ready_reasons: ['missing_image'],
    created_at: TS.processed1,
  },
  {
    diff_item_id: seededUuid('dfi'),
    diff_id: UUID.diff1,
    item_id: mockFeedItems_upload1[2].item_id,
    scan_code: '871980400506',
    product_id: 10000003,
    change_type: 'changed' as DiffChangeType,
    severity: 'critical' as DiffItemSeverity,
    change_summary: 'item_details: removed; ingredients: removed; available: TRUE -> FALSE',
    field_changes: [
      { field: 'item_details', previous: '{"calories":"120","fat":"5g","sodium":"200mg"}', current: null, is_high_severity: false },
      { field: 'ingredients', previous: 'Water, Salt, Citric Acid', current: null, is_high_severity: false },
      { field: 'available', previous: 'TRUE', current: 'FALSE', is_high_severity: false },
    ],
    is_catalog_ready: false,
    not_ready_reasons: ['missing_nutrition'],
    created_at: TS.processed1,
  },
  {
    diff_item_id: seededUuid('dfi'),
    diff_id: UUID.diff1,
    item_id: mockFeedItems_upload1[7].item_id,
    scan_code: '007535307771',
    product_id: 10000008,
    change_type: 'changed' as DiffChangeType,
    severity: 'critical' as DiffItemSeverity,
    change_summary: 'brand_name: "The Garden Co." -> "(empty)"; size: "1 lb" -> "1.5 lb"',
    field_changes: [
      { field: 'brand_name', previous: 'The Garden Co.', current: null, is_high_severity: false },
      { field: 'size', previous: '1 lb', current: '1.5 lb', is_high_severity: false },
    ],
    is_catalog_ready: false,
    not_ready_reasons: ['missing_brand'],
    created_at: TS.processed1,
  },
  // UoM changes (critical)
  {
    diff_item_id: seededUuid('dfi'),
    diff_id: UUID.diff1,
    item_id: mockFeedItems_upload1[4].item_id,
    scan_code: '027426701069',
    product_id: 10000005,
    change_type: 'changed' as DiffChangeType,
    severity: 'critical' as DiffItemSeverity,
    change_summary: 'cost_unit: "LB" -> "EA"',
    field_changes: [
      { field: 'cost_unit', previous: 'lb', current: 'each', is_high_severity: true },
    ],
    is_catalog_ready: true,
    not_ready_reasons: null,
    created_at: TS.processed1,
  },
  {
    diff_item_id: seededUuid('dfi'),
    diff_id: UUID.diff1,
    item_id: mockFeedItems_upload1[8].item_id,
    scan_code: '048661114995',
    product_id: 10000009,
    change_type: 'changed' as DiffChangeType,
    severity: 'critical' as DiffItemSeverity,
    change_summary: 'cost_unit: "EA" -> "LB"',
    field_changes: [
      { field: 'cost_unit', previous: 'each', current: 'lb', is_high_severity: true },
    ],
    is_catalog_ready: true,
    not_ready_reasons: null,
    created_at: TS.processed1,
  },
  // Size changes (warning)
  {
    diff_item_id: seededUuid('dfi'),
    diff_id: UUID.diff1,
    item_id: mockFeedItems_upload1[3].item_id,
    scan_code: '715195952040',
    product_id: 10000004,
    change_type: 'changed' as DiffChangeType,
    severity: 'warning' as DiffItemSeverity,
    change_summary: 'size: "12 oz" -> "16 oz"',
    field_changes: [
      { field: 'size', previous: '12 oz', current: '16 oz', is_high_severity: false },
    ],
    is_catalog_ready: true,
    not_ready_reasons: null,
    created_at: TS.processed1,
  },
  // Price & promo (info)
  {
    diff_item_id: seededUuid('dfi'),
    diff_id: UUID.diff1,
    item_id: mockFeedItems_upload1[0].item_id,
    scan_code: '111183067',
    product_id: 10000001,
    change_type: 'changed' as DiffChangeType,
    severity: 'info' as DiffItemSeverity,
    change_summary: 'price: $2.49 -> $3.19; sale_price: added $2.89',
    field_changes: [
      { field: 'price', previous: '$2.49', current: '$3.19', is_high_severity: false },
      { field: 'sale_price', previous: null, current: '$2.89', is_high_severity: false },
    ],
    is_catalog_ready: false,
    not_ready_reasons: ['missing_image', 'missing_brand'],
    created_at: TS.processed1,
  },
  {
    diff_item_id: seededUuid('dfi'),
    diff_id: UUID.diff1,
    item_id: mockFeedItems_upload1[6].item_id,
    scan_code: '027426428546',
    product_id: 10000007,
    change_type: 'changed' as DiffChangeType,
    severity: 'info' as DiffItemSeverity,
    change_summary: 'price: $4.99 -> $5.49; loyalty_price: $4.49 -> $4.99',
    field_changes: [
      { field: 'price', previous: '$4.99', current: '$5.49', is_high_severity: false },
      { field: 'loyalty_price', previous: '$4.49', current: '$4.99', is_high_severity: false },
    ],
    is_catalog_ready: true,
    not_ready_reasons: null,
    created_at: TS.processed1,
  },
  {
    diff_item_id: seededUuid('dfi'),
    diff_id: UUID.diff1,
    item_id: mockFeedItems_upload1[9].item_id,
    scan_code: '070798001770',
    product_id: 10000010,
    change_type: 'changed' as DiffChangeType,
    severity: 'info' as DiffItemSeverity,
    change_summary: 'price: $3.29 -> $3.79; alcohol: false -> true',
    field_changes: [
      { field: 'price', previous: '$3.29', current: '$3.79', is_high_severity: false },
      { field: 'alcohol', previous: 'false', current: 'true', is_high_severity: true },
    ],
    is_catalog_ready: true,
    not_ready_reasons: null,
    created_at: TS.processed1,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// 9. FEED ANOMALY ALERTS — for upload 1 (completed with warnings)
// ═══════════════════════════════════════════════════════════════════════════

export const mockFeedAnomalyAlerts: FeedAnomalyAlert[] = [
  {
    alert_id: seededUuid('alert'),
    diff_id: UUID.diff1,
    upload_id: UUID.upload1,
    alert_type: 'bulk_name_change',
    category: 'Produce',
    affected_count: 8,
    affected_pct: 40,
    threshold_used: 20,
    description: '40% of items in your Produce category had their name change \u2014 did you mean to do this?',
    is_dismissible: true,
    dismissed_at: null,
    created_at: TS.processed1,
  },
  {
    alert_id: seededUuid('alert'),
    diff_id: UUID.diff1,
    upload_id: UUID.upload1,
    alert_type: 'cost_unit_flip',
    category: 'General',
    affected_count: 2,
    affected_pct: 0,
    threshold_used: 0,
    description: '2 items changed their sell-by unit (EA\u2194LB) \u2014 this affects pricing calculation.',
    is_dismissible: true,
    dismissed_at: null,
    created_at: TS.processed1,
  },
  {
    alert_id: seededUuid('alert'),
    diff_id: UUID.diff1,
    upload_id: UUID.upload1,
    alert_type: 'alcohol_flag_change',
    category: 'Bakery',
    affected_count: 1,
    affected_pct: 33,
    threshold_used: 0,
    description: '1 item in Bakery had its alcohol flag changed from false to true \u2014 verify this is correct.',
    is_dismissible: false,
    dismissed_at: null,
    created_at: TS.processed1,
  },
  {
    alert_id: seededUuid('alert'),
    diff_id: UUID.diff1,
    upload_id: UUID.upload1,
    alert_type: 'bulk_price_change',
    category: 'Bakery',
    affected_count: 3,
    affected_pct: 100,
    threshold_used: 15,
    description: '100% of items in your Bakery category had price changes \u2014 review for accuracy.',
    is_dismissible: true,
    dismissed_at: null,
    created_at: TS.processed1,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// 10. FEED QUALITY SCORE HISTORY — sparkline trend
// ═══════════════════════════════════════════════════════════════════════════

export const mockFeedQualityScoreHistory: FeedQualityScoreHistory[] = [
  {
    score_id: seededUuid('qsh'),
    retailer_id: UUID.retailer,
    upload_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee0001',
    score: 68,
    catalog_ready_count: 340,
    total_count: 500,
    not_ready_count: 160,
    breakdown: [
      { field: 'scan_code', count: 45 },
      { field: 'brand_name', count: 38 },
      { field: 'category', count: 30 },
      { field: 'price', count: 22 },
      { field: 'size', count: 15 },
      { field: 'cost_unit', count: 10 },
    ],
    computed_at: '2026-02-25T08:00:00.000Z',
  },
  {
    score_id: seededUuid('qsh'),
    retailer_id: UUID.retailer,
    upload_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee0002',
    score: 71,
    catalog_ready_count: 355,
    total_count: 500,
    not_ready_count: 145,
    breakdown: [
      { field: 'scan_code', count: 40 },
      { field: 'brand_name', count: 32 },
      { field: 'category', count: 28 },
      { field: 'price', count: 20 },
      { field: 'size', count: 15 },
      { field: 'cost_unit', count: 10 },
    ],
    computed_at: '2026-02-27T08:00:00.000Z',
  },
  {
    score_id: seededUuid('qsh'),
    retailer_id: UUID.retailer,
    upload_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee0003',
    score: 75,
    catalog_ready_count: 375,
    total_count: 500,
    not_ready_count: 125,
    breakdown: [
      { field: 'scan_code', count: 35 },
      { field: 'brand_name', count: 28 },
      { field: 'category', count: 22 },
      { field: 'price', count: 18 },
      { field: 'size', count: 13 },
      { field: 'cost_unit', count: 9 },
    ],
    computed_at: '2026-03-01T08:00:00.000Z',
  },
  {
    score_id: seededUuid('qsh'),
    retailer_id: UUID.retailer,
    upload_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee0004',
    score: 78,
    catalog_ready_count: 390,
    total_count: 500,
    not_ready_count: 110,
    breakdown: [
      { field: 'scan_code', count: 30 },
      { field: 'brand_name', count: 22 },
      { field: 'category', count: 18 },
      { field: 'price', count: 16 },
      { field: 'size', count: 14 },
      { field: 'cost_unit', count: 10 },
    ],
    computed_at: '2026-03-03T08:00:00.000Z',
  },
  {
    score_id: seededUuid('qsh'),
    retailer_id: UUID.retailer,
    upload_id: UUID.upload1,
    score: 82,
    catalog_ready_count: 410,
    total_count: 500,
    not_ready_count: 90,
    breakdown: [
      { field: 'scan_code', count: 25 },
      { field: 'brand_name', count: 18 },
      { field: 'category', count: 15 },
      { field: 'price', count: 12 },
      { field: 'size', count: 11 },
      { field: 'cost_unit', count: 9 },
    ],
    computed_at: TS.processed1,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// 11. FEED COLUMN MAPPINGS — retailer column config
// ═══════════════════════════════════════════════════════════════════════════

export const mockFeedColumnMappings: FeedColumnMapping[] = [
  {
    mapping_id: seededUuid('colmap'),
    retailer_id: UUID.retailer,
    source_column: 'SKU',
    canonical_field: 'scan_code',
    transform_rule: { code_type: 'UPC' },
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  },
  {
    mapping_id: seededUuid('colmap'),
    retailer_id: UUID.retailer,
    source_column: 'PRODUCT NAME',
    canonical_field: 'item_name',
    transform_rule: null,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  },
  {
    mapping_id: seededUuid('colmap'),
    retailer_id: UUID.retailer,
    source_column: 'BRAND NAME',
    canonical_field: 'brand_name',
    transform_rule: null,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  },
  {
    mapping_id: seededUuid('colmap'),
    retailer_id: UUID.retailer,
    source_column: 'REGULAR PRICE',
    canonical_field: 'price',
    transform_rule: null,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  },
  {
    mapping_id: seededUuid('colmap'),
    retailer_id: UUID.retailer,
    source_column: 'HOW TO SELL BY',
    canonical_field: 'cost_unit',
    transform_rule: { mapping: { LBS: 'LB', UNIT: 'EA' } },
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  },
  {
    mapping_id: seededUuid('colmap'),
    retailer_id: UUID.retailer,
    source_column: 'SIZE',
    canonical_field: 'size',
    transform_rule: null,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  },
  {
    mapping_id: seededUuid('colmap'),
    retailer_id: UUID.retailer,
    source_column: 'UOM',
    canonical_field: 'unit_of_measure',
    transform_rule: null,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  },
  {
    mapping_id: seededUuid('colmap'),
    retailer_id: UUID.retailer,
    source_column: 'DEPARTMENT CODE',
    canonical_field: 'department',
    transform_rule: null,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  },
  {
    mapping_id: seededUuid('colmap'),
    retailer_id: UUID.retailer,
    source_column: 'COMMODITY',
    canonical_field: 'category',
    transform_rule: null,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  },
  {
    mapping_id: seededUuid('colmap'),
    retailer_id: UUID.retailer,
    source_column: 'ALCOHOL',
    canonical_field: 'alcohol',
    transform_rule: { mapping: { Y: true, N: false } },
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// Factory / lookup helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Get a feed upload by status */
export function getUploadByStatus(status: FeedUpload['status']): FeedUpload | undefined {
  return mockFeedUploads.find(u => u.status === status)
}

/** Get feed items for an upload */
export function getItemsForUpload(uploadId: string): FeedItem[] {
  return mockFeedItems.filter(fi => fi.upload_id === uploadId)
}

/** Get validations for an upload */
export function getValidationsForUpload(uploadId: string): FeedItemValidation[] {
  return mockFeedItemValidations.filter(v => v.upload_id === uploadId)
}

/** Get PLS match results for an upload */
export function getMatchesForUpload(uploadId: string): PlsMatchResult[] {
  return mockPlsMatchResults.filter(m => m.upload_id === uploadId)
}

/** Get the diff for an upload */
export function getDiffForUpload(uploadId: string): FeedDiff | undefined {
  return mockFeedDiffs.find(d => d.upload_id === uploadId)
}

/** Get diff items for a diff */
export function getDiffItemsForDiff(diffId: string): FeedDiffItem[] {
  return mockFeedDiffItems.filter(di => di.diff_id === diffId)
}

/** Get anomaly alerts for an upload */
export function getAlertsForUpload(uploadId: string): FeedAnomalyAlert[] {
  return mockFeedAnomalyAlerts.filter(a => a.upload_id === uploadId)
}

/** Get quality score history for the retailer (last 5 entries) */
export function getQualityScoreTrend(): FeedQualityScoreHistory[] {
  return mockFeedQualityScoreHistory
}

/** Get column mappings for the retailer */
export function getColumnMappings(): FeedColumnMapping[] {
  return mockFeedColumnMappings
}
