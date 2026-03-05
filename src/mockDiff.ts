export type ChangeType = 'added' | 'removed' | 'changed'

// ── Anomaly Alert types & data ────────────────────────────────────────────

export interface AnomalyAlert {
  id: string
  type: 'bulk_name_change' | 'bulk_removal' | 'bulk_price_change' | 'alcohol_flag_change' | 'cost_unit_flip'
  category: string
  affectedCount: number
  affectedPct: number
  description: string
  viewItemsTabId: string
  isDismissible: boolean
}

export const ANOMALY_ALERTS: AnomalyAlert[] = [
  {
    id: 'alert-1',
    type: 'bulk_name_change',
    category: 'Produce',
    affectedCount: 8,
    affectedPct: 40,
    description: '40% of items in your Produce category had their name change — did you mean to do this?',
    viewItemsTabId: 'sellability',
    isDismissible: true,
  },
  {
    id: 'alert-2',
    type: 'cost_unit_flip',
    category: 'General',
    affectedCount: 2,
    affectedPct: 0,
    description: '2 items changed their sell-by unit (EA↔LB) — this affects pricing calculation.',
    viewItemsTabId: 'uom',
    isDismissible: true,
  },
]

// ── Feed Quality Score types & data ───────────────────────────────────────

export interface QualityScore {
  score: number
  catalogReadyCount: number
  totalCount: number
  notReadyCount: number
}

export interface QualityBreakdownEntry {
  field: string
  count: number
}

export const QUALITY_SCORE: QualityScore = {
  score: 82,
  catalogReadyCount: 410,
  totalCount: 500,
  notReadyCount: 90,
}

export const QUALITY_SCORE_BREAKDOWN: QualityBreakdownEntry[] = [
  { field: 'scan code', count: 25 },
  { field: 'brand name', count: 18 },
  { field: 'category', count: 15 },
  { field: 'price', count: 12 },
  { field: 'size / weight', count: 11 },
  { field: 'cost unit', count: 9 },
]

export const QUALITY_SCORE_TREND: number[] = [68, 71, 75, 78, 82]

export interface FieldChange {
  field: string
  previous: string
  current: string
  highSeverity?: boolean
}

export interface DiffRow {
  id: string
  scanCode: string
  productName: string
  brand: string
  changeType: ChangeType
  highSeverity?: boolean
  changes?: FieldChange[]
  suggestedFields?: { field: string; reason: string }[]
}

export interface DiffCategory {
  id: string
  label: string
  description: string
  changeType: ChangeType | 'mixed'
  count: number
  highSeverity?: boolean
  severity?: 'critical' | 'warning' | 'info'
  items: DiffRow[]
}

export const DIFF_SUMMARY = {
  qualityIssues: 4,
  pricePromoUpdates: 5,
  uomSizeChanges: 5,
  newItems: 2,
}

// ── Seed items ────────────────────────────────────────────────────────────

const sellabilityItems: DiffRow[] = [
  {
    id: 's1',
    scanCode: '111183067',
    productName: 'Insta Carrot Kit',
    brand: 'Carrot',
    changeType: 'changed',
    highSeverity: true,
    changes: [
      { field: 'remote_image_url', previous: 'https://images.example.com/111183067.jpg', current: '(empty)', highSeverity: true },
      { field: 'brand_name',       previous: 'Carrot Fresh', current: '(empty)' },
    ],
  },
  {
    id: 's2',
    scanCode: '000910002804',
    productName: 'Garden Smoke Test Item A',
    brand: 'The Garden',
    changeType: 'changed',
    highSeverity: true,
    changes: [
      { field: 'remote_image_url', previous: 'https://images.example.com/000910002804.jpg', current: '(empty)', highSeverity: true },
    ],
  },
  {
    id: 's3',
    scanCode: '871980400506',
    productName: 'Garden Smoke Test Item B',
    brand: 'The Garden',
    changeType: 'changed',
    changes: [
      { field: 'item_details',  previous: '{"calories":"120","fat":"5g","sodium":"200mg"}', current: '(empty)' },
      { field: 'ingredients',   previous: 'Water, Salt, Citric Acid', current: '(empty)' },
    ],
  },
  {
    id: 's4',
    scanCode: '007535307771',
    productName: 'Garden Smoke Test Item I',
    brand: 'The Garden',
    changeType: 'changed',
    changes: [
      { field: 'brand_name', previous: 'The Garden Co.', current: '(empty)' },
      { field: 'aisle',      previous: 'Produce > Fresh Vegetables', current: '(empty)' },
    ],
  },
]

const pricePromoItems: DiffRow[] = [
  {
    id: 'p1',
    scanCode: '111183067',
    productName: 'Insta Carrot Kit',
    brand: 'Carrot',
    changeType: 'changed',
    changes: [
      { field: 'price',          previous: '$2.49', current: '$3.19' },
      { field: 'sale_price',     previous: '(none)', current: '$2.89' },
      { field: 'promotion_type', previous: '(none)', current: 'percent_off' },
      { field: 'promotion_start_date', previous: '(none)', current: '2026-03-10' },
      { field: 'promotion_end_date',   previous: '(none)', current: '2026-03-17' },
    ],
  },
  {
    id: 'p2',
    scanCode: '027426428546',
    productName: 'Garden Smoke Test Item F',
    brand: 'The Garden',
    changeType: 'changed',
    changes: [
      { field: 'price',          previous: '$4.99', current: '$5.49' },
      { field: 'loyalty_price',  previous: '$4.49', current: '$4.99' },
    ],
  },
  {
    id: 'p3',
    scanCode: '724504081999',
    productName: 'Garden Smoke Test Item G',
    brand: 'The Garden',
    changeType: 'changed',
    changes: [
      { field: 'price',      previous: '$6.99', current: '$7.49' },
      { field: 'sale_price', previous: '$5.99', current: '(removed)' },
      { field: 'promotion_type', previous: 'flat_dollars_off', current: '(removed)' },
    ],
  },
  {
    id: 'p4',
    scanCode: '070798001770',
    productName: 'Garden Smoke Test Item H',
    brand: 'The Garden',
    changeType: 'changed',
    changes: [
      { field: 'price', previous: '$3.29', current: '$3.79' },
    ],
  },
  {
    id: 'p5',
    scanCode: '075919005743',
    productName: 'Garden Smoke Test Item E',
    brand: 'The Garden',
    changeType: 'changed',
    changes: [
      { field: 'price',          previous: '$8.99', current: '$8.99' },
      { field: 'promotion_type', previous: '(none)', current: 'buy_m_get_n' },
      { field: 'promotion_metadata', previous: '(none)', current: '{"buy":2,"get":1}' },
      { field: 'promotion_start_date', previous: '(none)', current: '2026-03-05' },
      { field: 'promotion_end_date',   previous: '(none)', current: '2026-03-19' },
    ],
  },
]

const uomItems: DiffRow[] = [
  {
    id: 'u1',
    scanCode: '027426701069',
    productName: 'Garden Smoke Test Item D',
    brand: 'The Garden',
    changeType: 'changed',
    highSeverity: true,
    changes: [
      { field: 'cost_unit', previous: 'lb', current: 'each', highSeverity: true },
    ],
  },
  {
    id: 'u2',
    scanCode: '048661114995',
    productName: 'Garden Smoke Test Item J',
    brand: 'The Garden',
    changeType: 'changed',
    highSeverity: true,
    changes: [
      { field: 'cost_unit', previous: 'each', current: 'lb', highSeverity: true },
    ],
  },
]

const sizeItems: DiffRow[] = [
  {
    id: 'sz1',
    scanCode: '715195952040',
    productName: 'Garden Smoke Test Item C',
    brand: 'The Garden',
    changeType: 'changed',
    changes: [
      { field: 'size', previous: '12 oz', current: '16 oz' },
    ],
  },
  {
    id: 'sz2',
    scanCode: '007535307771',
    productName: 'Garden Smoke Test Item I',
    brand: 'The Garden',
    changeType: 'changed',
    changes: [
      { field: 'size', previous: '1 lb', current: '1.5 lb' },
    ],
  },
  {
    id: 'sz3',
    scanCode: '000910002804',
    productName: 'Garden Smoke Test Item A',
    brand: 'The Garden',
    changeType: 'changed',
    changes: [
      { field: 'size', previous: '6 ct', current: '8 ct' },
    ],
  },
]

const mismatchItems: DiffRow[] = [
  {
    id: 'm1',
    scanCode: '111183067',
    productName: 'Insta Carrot Kit',
    brand: 'Carrot',
    changeType: 'changed',
    highSeverity: true,
    changes: [
      { field: 'item_name', previous: 'Insta Carrot Kit 12ct', current: 'Insta Carrot Kit', highSeverity: true },
    ],
    suggestedFields: [
      { field: 'size',             reason: 'Name implies a count (12ct) — verify size matches' },
      { field: 'remote_image_url', reason: 'Image may show old packaging with count in label' },
      { field: 'item_details',     reason: 'Nutritional info may differ between pack sizes' },
    ],
  },
  {
    id: 'm2',
    scanCode: '027426701069',
    productName: 'Garden Smoke Test Item D',
    brand: 'The Garden',
    changeType: 'changed',
    highSeverity: true,
    changes: [
      { field: 'brand_name', previous: 'The Garden Co.', current: 'Garden Fresh', highSeverity: true },
      { field: 'size',       previous: '16 oz', current: '14 oz' },
    ],
    suggestedFields: [
      { field: 'item_name',        reason: 'Item name may still reference old brand' },
      { field: 'remote_image_url', reason: 'Packaging likely changed with brand and size update' },
      { field: 'price',            reason: 'Price may need adjustment for the new 14 oz size' },
    ],
  },
  {
    id: 'm3',
    scanCode: '724504081999',
    productName: 'Garden Smoke Test Item G',
    brand: 'The Garden',
    changeType: 'changed',
    changes: [
      { field: 'size',      previous: '6 ct', current: '6-pack' },
      { field: 'cost_unit', previous: 'each', current: 'each' },
    ],
    suggestedFields: [
      { field: 'item_name',    reason: 'Standardize name to match size format ("6-pack" vs "6 ct")' },
      { field: 'item_details', reason: 'Per-unit details may differ with updated size descriptor' },
    ],
  },
]

const availabilityItems: DiffRow[] = [
  {
    id: 'a1',
    scanCode: '871980400506',
    productName: 'Garden Smoke Test Item B',
    brand: 'The Garden',
    changeType: 'removed',
    changes: [
      { field: 'available', previous: 'TRUE', current: 'FALSE' },
    ],
  },
  {
    id: 'a2',
    scanCode: '027426428546',
    productName: 'Garden Smoke Test Item F',
    brand: 'The Garden',
    changeType: 'removed',
    changes: [
      { field: 'available', previous: 'TRUE', current: 'FALSE' },
    ],
  },
]

const addedItems: DiffRow[] = [
  {
    id: 'n1',
    scanCode: '111183067',
    productName: 'Insta Carrot Kit',
    brand: 'Carrot',
    changeType: 'added',
  },
  {
    id: 'n2',
    scanCode: '724504081999',
    productName: 'Garden Smoke Test Item G',
    brand: 'The Garden',
    changeType: 'added',
  },
]

// ── Failed file mock data ─────────────────────────────────────────────────

const failedItems: DiffRow[] = [
  {
    id: 'f1',
    scanCode: '42421162066',
    productName: '(no description)',
    brand: '—',
    changeType: 'changed',
    highSeverity: true,
    changes: [
      { field: 'item_name',  previous: '(empty)', current: '(empty)', highSeverity: true },
      { field: 'size',       previous: '(empty)', current: '(empty)', highSeverity: true },
      { field: 'cost_unit',  previous: '(empty)', current: '(empty)', highSeverity: true },
    ],
  },
  {
    id: 'f2',
    scanCode: '715195952040',
    productName: 'Garden Smoke Test Item C',
    brand: 'The Garden',
    changeType: 'changed',
    highSeverity: true,
    changes: [
      { field: 'item_name', previous: '(empty)', current: '(empty)', highSeverity: true },
      { field: 'price',     previous: '(empty)', current: '(empty)', highSeverity: true },
    ],
  },
  {
    id: 'f3',
    scanCode: '048661114995',
    productName: 'Garden Smoke Test Item J',
    brand: 'The Garden',
    changeType: 'changed',
    highSeverity: true,
    changes: [
      { field: 'size',      previous: '(empty)', current: '(empty)', highSeverity: true },
      { field: 'available', previous: '(empty)', current: '(empty)', highSeverity: true },
    ],
  },
  {
    id: 'f4',
    scanCode: ':027426701069',
    productName: 'Garden Smoke Test Item D',
    brand: 'The Garden',
    changeType: 'changed',
    highSeverity: true,
    changes: [
      { field: 'lookup_code', previous: ':027426701069', current: '(invalid format)', highSeverity: true },
    ],
  },
]

export const MISSING_FIELDS_SUMMARY = {
  fieldsMissing: 7,
  itemsAffected: failedItems.length,
  validationErrors: failedItems.length,
}

export const MISMATCH_SUMMARY = {
  conflictsDetected: mismatchItems.reduce((n, i) => n + (i.changes?.length ?? 0), 0),
  itemsAffected: mismatchItems.length,
}

export const FAILED_CATEGORIES: DiffCategory[] = [
  {
    id: 'missing-data',
    label: 'Missing required fields',
    description: 'Items with empty required fields that caused the file to be rejected',
    changeType: 'changed',
    count: failedItems.length,
    highSeverity: true,
    items: failedItems,
  },
  {
    id: 'mismatch',
    label: 'Mismatch detected',
    description: 'Feed values conflict with known catalog data for this UPC',
    changeType: 'changed',
    count: mismatchItems.length,
    highSeverity: true,
    items: mismatchItems,
  },
]

// ── All items flat (for any code that needs it) ──────────────────────────

export const MOCK_DIFF: DiffRow[] = [
  ...sellabilityItems,
  ...pricePromoItems,
  ...uomItems,
  ...sizeItems,
  ...mismatchItems,
  ...availabilityItems,
  ...addedItems,
]

// ── Category-level view for completed files ───────────────────────────────

export const DIFF_CATEGORIES: DiffCategory[] = [
  // ── Critical ──
  {
    id: 'sellability',
    label: 'Catalog quality issues',
    description: 'Missing or removed data affecting storefront discoverability and sellability',
    changeType: 'changed',
    count: sellabilityItems.length,
    highSeverity: true,
    severity: 'critical',
    items: sellabilityItems,
  },
  {
    id: 'uom',
    label: 'Unit of measure changes',
    description: 'Items where cost_unit changed — may affect pricing and weight-based orders',
    changeType: 'changed',
    count: uomItems.length,
    highSeverity: true,
    severity: 'critical',
    items: uomItems,
  },
  // ── Warning ──
  {
    id: 'size',
    label: 'Size changes',
    description: 'Items where the size or weight descriptor changed',
    changeType: 'changed',
    count: sizeItems.length,
    severity: 'warning',
    items: sizeItems,
  },
  {
    id: 'availability',
    label: 'Availability changes',
    description: 'Items that became unavailable in this file',
    changeType: 'removed',
    count: availabilityItems.length,
    severity: 'warning',
    items: availabilityItems,
  },
  // ── Info ──
  {
    id: 'price-promo',
    label: 'Price & promo updates',
    description: 'Changes to price, sale price, loyalty price, or promotion rules',
    changeType: 'changed',
    count: pricePromoItems.length,
    severity: 'info',
    items: pricePromoItems,
  },
  {
    id: 'added',
    label: 'New items',
    description: 'Items newly added to your catalog in this file',
    changeType: 'added',
    count: addedItems.length,
    severity: 'info',
    items: addedItems,
  },
]
