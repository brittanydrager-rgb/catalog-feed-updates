import { v4 as uuid } from 'uuid'
import { db, updateUploadStatus } from '../db.js'

interface FeedItem {
  item_id: string
  upload_id: string
  row_number: number
  scan_code: string | null
  item_name: string | null
  brand_name: string | null
  price: number | null
  cost_unit: string | null
  size: string | null
  weight: string | null
  unit_of_measure: string | null
  category: string | null
  department: string | null
}

interface ValidationRecord {
  validationId: string
  itemId: string
  uploadId: string
  field: string
  rule: string
  severity: string
  message: string
  isBlocking: boolean
}

export function phaseValidate(uploadId: string): 'continue' | 'rejected_missing_fields' {
  console.log(`[validate] Phase 2: Validating items for upload ${uploadId}`)
  updateUploadStatus(uploadId, 'validating')

  const items = db.prepare(
    'SELECT * FROM feed_items WHERE upload_id = ?'
  ).all(uploadId) as FeedItem[]

  const validations: ValidationRecord[] = []
  const itemsWithBlockingErrors = new Set<string>()

  for (const item of items) {
    // scan_code: present, non-empty, not starts with ':'
    if (!item.scan_code || item.scan_code.trim() === '') {
      validations.push({
        validationId: uuid(),
        itemId: item.item_id,
        uploadId,
        field: 'scan_code',
        rule: 'required',
        severity: 'error',
        message: `Row ${item.row_number}: scan_code is missing or empty`,
        isBlocking: true,
      })
      itemsWithBlockingErrors.add(item.item_id)
    } else if (item.scan_code.startsWith(':')) {
      validations.push({
        validationId: uuid(),
        itemId: item.item_id,
        uploadId,
        field: 'scan_code',
        rule: 'format',
        severity: 'error',
        message: `Row ${item.row_number}: scan_code starts with ':' — likely malformed`,
        isBlocking: true,
      })
      itemsWithBlockingErrors.add(item.item_id)
    }

    // item_name: present, non-empty
    if (!item.item_name || item.item_name.trim() === '') {
      validations.push({
        validationId: uuid(),
        itemId: item.item_id,
        uploadId,
        field: 'item_name',
        rule: 'required',
        severity: 'error',
        message: `Row ${item.row_number}: item_name is missing or empty`,
        isBlocking: true,
      })
      itemsWithBlockingErrors.add(item.item_id)
    }

    // brand_name: present, non-empty (warning, not blocking)
    if (!item.brand_name || item.brand_name.trim() === '') {
      validations.push({
        validationId: uuid(),
        itemId: item.item_id,
        uploadId,
        field: 'brand_name',
        rule: 'recommended',
        severity: 'warning',
        message: `Row ${item.row_number}: brand_name is missing — catalog readiness reduced`,
        isBlocking: false,
      })
    }

    // price: present, > 0 (warning since Kroger has no price column)
    if (!item.price || item.price <= 0) {
      validations.push({
        validationId: uuid(),
        itemId: item.item_id,
        uploadId,
        field: 'price',
        rule: 'recommended',
        severity: 'warning',
        message: `Row ${item.row_number}: price is missing or zero — not available in source feed`,
        isBlocking: false,
      })
    }

    // cost_unit: present, valid values
    const validCostUnits = ['EA', 'LB', 'UNIT', 'LBS']
    if (!item.cost_unit || !validCostUnits.includes(item.cost_unit.toUpperCase())) {
      validations.push({
        validationId: uuid(),
        itemId: item.item_id,
        uploadId,
        field: 'cost_unit',
        rule: 'recommended',
        severity: 'warning',
        message: `Row ${item.row_number}: cost_unit is missing — not available in source feed`,
        isBlocking: false,
      })
    }

    // size OR weight OR unit_of_measure: at least one present
    if (
      (!item.size || item.size.trim() === '') &&
      (!item.weight || item.weight.trim() === '') &&
      (!item.unit_of_measure || item.unit_of_measure.trim() === '')
    ) {
      validations.push({
        validationId: uuid(),
        itemId: item.item_id,
        uploadId,
        field: 'size/weight/unit_of_measure',
        rule: 'recommended',
        severity: 'warning',
        message: `Row ${item.row_number}: no size, weight, or unit_of_measure provided`,
        isBlocking: false,
      })
    }

    // category OR department: at least one present
    if (
      (!item.category || item.category.trim() === '') &&
      (!item.department || item.department.trim() === '')
    ) {
      validations.push({
        validationId: uuid(),
        itemId: item.item_id,
        uploadId,
        field: 'category/department',
        rule: 'recommended',
        severity: 'warning',
        message: `Row ${item.row_number}: no category or department provided`,
        isBlocking: false,
      })
    }
  }

  // Duplicate scan_code check
  const duplicates = db.prepare(`
    SELECT scan_code, GROUP_CONCAT(item_id) as item_ids, COUNT(*) as cnt
    FROM feed_items
    WHERE upload_id = ? AND scan_code IS NOT NULL AND scan_code != ''
    GROUP BY scan_code
    HAVING COUNT(*) > 1
  `).all(uploadId) as { scan_code: string; item_ids: string; cnt: number }[]

  for (const dup of duplicates) {
    const itemIds = dup.item_ids.split(',')
    for (const itemId of itemIds) {
      validations.push({
        validationId: uuid(),
        itemId,
        uploadId,
        field: 'scan_code',
        rule: 'unique',
        severity: 'error',
        message: `Duplicate scan_code "${dup.scan_code}" — found ${dup.cnt} times in feed`,
        isBlocking: true,
      })
      itemsWithBlockingErrors.add(itemId)
    }
  }

  // Batch insert validations
  const insertValidation = db.prepare(`
    INSERT INTO feed_item_validations (validation_id, item_id, upload_id, field, rule, severity, message, is_blocking)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const tx = db.transaction(() => {
    for (const v of validations) {
      insertValidation.run(
        v.validationId,
        v.itemId,
        v.uploadId,
        v.field,
        v.rule,
        v.severity,
        v.message,
        v.isBlocking ? 1 : 0
      )
    }
  })
  tx()

  // Update counts
  const validRows = items.length - itemsWithBlockingErrors.size
  const invalidRows = itemsWithBlockingErrors.size
  updateUploadStatus(uploadId, 'validating', {
    valid_rows: validRows,
    invalid_rows: invalidRows,
  })

  const hasBlockingErrors = itemsWithBlockingErrors.size > 0
  console.log(`[validate] Phase 2 complete: ${validations.length} validations, ${itemsWithBlockingErrors.size} items with blocking errors`)

  if (hasBlockingErrors) {
    updateUploadStatus(uploadId, 'rejected_missing_fields', {
      rejection_reason: `${itemsWithBlockingErrors.size} items have blocking validation errors (${duplicates.length} duplicate scan codes)`,
    })
    return 'rejected_missing_fields'
  }

  return 'continue'
}
