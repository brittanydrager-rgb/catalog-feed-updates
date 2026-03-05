import { v4 as uuid } from 'uuid'
import { db, updateUploadStatus, getLatestSnapshot, getSnapshotItems } from '../db.js'

interface FeedItem {
  item_id: string
  scan_code: string | null
  item_name: string | null
  brand_name: string | null
  price: number | null
  sale_price: number | null
  cost_unit: string | null
  size: string | null
  weight: string | null
  unit_of_measure: string | null
  category: string | null
  department: string | null
  available: number | null
  alcohol: number | null
  remote_image_url: string | null
  item_details: string | null
}

interface SnapshotItem {
  scan_code: string | null
  product_id: number | null
  item_name: string | null
  brand_name: string | null
  price: number | null
  sale_price: number | null
  cost_unit: string | null
  size: string | null
  category: string | null
  available: number | null
  alcohol: number | null
  remote_image_url: string | null
  item_details: string | null
  all_fields: string | null
}

interface FieldChange {
  field: string
  previous: unknown
  current: unknown
  isHighSeverity: boolean
}

// Fields to compare for diffs
const COMPARABLE_FIELDS = [
  'item_name', 'brand_name', 'price', 'sale_price', 'cost_unit',
  'size', 'category', 'available', 'alcohol', 'remote_image_url', 'item_details',
] as const

// Severity assignment for field changes
function getChangeSeverity(field: string, previous: unknown, current: unknown): 'critical' | 'warning' | 'info' {
  if (field === 'cost_unit') return 'critical'
  if (field === 'alcohol') return 'critical'
  if (field === 'remote_image_url' && !current) return 'critical'
  if (field === 'brand_name' && !current) return 'critical'
  if (field === 'size') return 'warning'
  if (field === 'available') return 'warning'
  if (field === 'price') return 'info'
  if (field === 'sale_price') return 'info'
  return 'info'
}

function getOverallSeverity(changes: FieldChange[]): 'critical' | 'warning' | 'info' {
  if (changes.some(c => getChangeSeverity(c.field, c.previous, c.current) === 'critical')) return 'critical'
  if (changes.some(c => getChangeSeverity(c.field, c.previous, c.current) === 'warning')) return 'warning'
  return 'info'
}

function buildChangeSummary(changes: FieldChange[]): string {
  return changes.map(c => `${c.field}: ${c.previous ?? '(empty)'} -> ${c.current ?? '(empty)'}`).join('; ')
}

export function phaseDiff(uploadId: string, retailerId: string): string {
  console.log(`[diff] Phase 4: Computing diff for upload ${uploadId}`)
  updateUploadStatus(uploadId, 'computing_diff')

  const diffId = uuid()

  // Get current feed items
  const currentItems = db.prepare(
    'SELECT fi.*, pm.matched_product_id FROM feed_items fi LEFT JOIN pls_match_results pm ON fi.item_id = pm.item_id WHERE fi.upload_id = ?'
  ).all(uploadId) as (FeedItem & { matched_product_id: number | null })[]

  // Build lookup by scan_code
  const currentByScan = new Map<string, (FeedItem & { matched_product_id: number | null })>()
  for (const item of currentItems) {
    if (item.scan_code) {
      currentByScan.set(item.scan_code, item)
    }
  }

  // Get previous snapshot
  const prevSnapshot = getLatestSnapshot(retailerId)
  let prevItemsByScan = new Map<string, SnapshotItem>()
  let previousUploadId: string | null = null

  if (prevSnapshot) {
    previousUploadId = prevSnapshot.upload_id as string
    const prevItems = getSnapshotItems(prevSnapshot.snapshot_id as string) as unknown as SnapshotItem[]
    for (const item of prevItems) {
      if (item.scan_code) {
        prevItemsByScan.set(item.scan_code, item)
      }
    }
    console.log(`[diff] Found previous snapshot with ${prevItemsByScan.size} items`)
  } else {
    console.log(`[diff] No previous snapshot — all items are 'added'`)
  }

  // Compute diff
  let addedCount = 0
  let removedCount = 0
  let changedCount = 0
  let unchangedCount = 0

  const diffItems: {
    itemId: string | null
    scanCode: string
    productId: number | null
    changeType: 'added' | 'removed' | 'changed' | 'unchanged'
    severity: string
    changeSummary: string
    fieldChanges: FieldChange[]
    isCatalogReady: boolean
    notReadyReasons: string[]
  }[] = []

  // Process current items
  for (const [scanCode, current] of currentByScan) {
    const prev = prevItemsByScan.get(scanCode)

    if (!prev) {
      // Added item
      addedCount++
      diffItems.push({
        itemId: current.item_id,
        scanCode,
        productId: current.matched_product_id,
        changeType: 'added',
        severity: 'info',
        changeSummary: 'New item added to feed',
        fieldChanges: [],
        isCatalogReady: false, // Will be computed in quality phase
        notReadyReasons: [],
      })
    } else {
      // Compare fields
      const changes: FieldChange[] = []

      for (const field of COMPARABLE_FIELDS) {
        const currentVal = (current as Record<string, unknown>)[field] ?? null
        const prevVal = (prev as Record<string, unknown>)[field] ?? null

        // Normalize for comparison
        const currentStr = currentVal !== null ? String(currentVal) : null
        const prevStr = prevVal !== null ? String(prevVal) : null

        if (currentStr !== prevStr) {
          const severity = getChangeSeverity(field, prevStr, currentStr)
          changes.push({
            field,
            previous: prevStr,
            current: currentStr,
            isHighSeverity: severity === 'critical',
          })
        }
      }

      if (changes.length > 0) {
        changedCount++
        diffItems.push({
          itemId: current.item_id,
          scanCode,
          productId: current.matched_product_id,
          changeType: 'changed',
          severity: getOverallSeverity(changes),
          changeSummary: buildChangeSummary(changes),
          fieldChanges: changes,
          isCatalogReady: false,
          notReadyReasons: [],
        })
      } else {
        unchangedCount++
        diffItems.push({
          itemId: current.item_id,
          scanCode,
          productId: current.matched_product_id,
          changeType: 'unchanged',
          severity: 'info',
          changeSummary: 'No changes',
          fieldChanges: [],
          isCatalogReady: false,
          notReadyReasons: [],
        })
      }
    }
  }

  // Find removed items (in prev snapshot but not in current)
  for (const [scanCode, prev] of prevItemsByScan) {
    if (!currentByScan.has(scanCode)) {
      removedCount++
      diffItems.push({
        itemId: null,
        scanCode,
        productId: prev.product_id,
        changeType: 'removed',
        severity: 'warning',
        changeSummary: `Item removed from feed: ${prev.item_name || scanCode}`,
        fieldChanges: [],
        isCatalogReady: false,
        notReadyReasons: [],
      })
    }
  }

  // Insert feed_diffs
  db.prepare(`
    INSERT INTO feed_diffs (
      diff_id, upload_id, previous_upload_id, retailer_id,
      added_count, removed_count, changed_count, unchanged_count,
      computed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(diffId, uploadId, previousUploadId, retailerId, addedCount, removedCount, changedCount, unchangedCount)

  // Batch insert diff items
  const insertDiffItem = db.prepare(`
    INSERT INTO feed_diff_items (
      diff_item_id, diff_id, item_id, scan_code, product_id,
      change_type, severity, change_summary, field_changes,
      is_catalog_ready, not_ready_reasons
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const BATCH_SIZE = 500
  for (let i = 0; i < diffItems.length; i += BATCH_SIZE) {
    const batch = diffItems.slice(i, i + BATCH_SIZE)
    const tx = db.transaction(() => {
      for (const item of batch) {
        insertDiffItem.run(
          uuid(),
          diffId,
          item.itemId,
          item.scanCode,
          item.productId,
          item.changeType,
          item.severity,
          item.changeSummary,
          JSON.stringify(item.fieldChanges),
          item.isCatalogReady ? 1 : 0,
          JSON.stringify(item.notReadyReasons)
        )
      }
    })
    tx()
  }

  // Save current state as new snapshot
  saveSnapshot(uploadId, retailerId, currentItems)

  console.log(`[diff] Phase 4 complete: +${addedCount} -${removedCount} ~${changedCount} =${unchangedCount}`)
  return diffId
}

function saveSnapshot(
  uploadId: string,
  retailerId: string,
  items: (FeedItem & { matched_product_id: number | null })[]
): void {
  const snapshotId = uuid()

  db.prepare(`
    INSERT INTO feed_snapshots (snapshot_id, retailer_id, upload_id, snapshot_type, item_count)
    VALUES (?, ?, ?, 'pre_ingestion', ?)
  `).run(snapshotId, retailerId, uploadId, items.length)

  const insertItem = db.prepare(`
    INSERT INTO feed_snapshot_items (
      snapshot_item_id, snapshot_id, scan_code, product_id,
      item_name, brand_name, price, sale_price, cost_unit,
      size, category, available, alcohol, remote_image_url, item_details, all_fields
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const BATCH_SIZE = 500
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const tx = db.transaction(() => {
      for (const item of batch) {
        const allFields: Record<string, unknown> = {
          item_name: item.item_name,
          brand_name: item.brand_name,
          price: item.price,
          sale_price: item.sale_price,
          cost_unit: item.cost_unit,
          size: item.size,
          category: item.category,
          department: item.department,
          available: item.available,
          alcohol: item.alcohol,
          remote_image_url: item.remote_image_url,
          item_details: item.item_details,
        }

        insertItem.run(
          uuid(),
          snapshotId,
          item.scan_code,
          item.matched_product_id || 0,
          item.item_name,
          item.brand_name,
          item.price,
          item.sale_price,
          item.cost_unit,
          item.size,
          item.category,
          item.available,
          item.alcohol,
          item.remote_image_url,
          item.item_details,
          JSON.stringify(allFields)
        )
      }
    })
    tx()
  }

  // Prune old snapshots (keep last 3)
  const oldSnapshots = db.prepare(`
    SELECT snapshot_id FROM feed_snapshots
    WHERE retailer_id = ?
    ORDER BY created_at DESC
    LIMIT -1 OFFSET 3
  `).all(retailerId) as { snapshot_id: string }[]

  if (oldSnapshots.length > 0) {
    const deleteItems = db.prepare('DELETE FROM feed_snapshot_items WHERE snapshot_id = ?')
    const deleteSnapshot = db.prepare('DELETE FROM feed_snapshots WHERE snapshot_id = ?')
    const pruneTx = db.transaction(() => {
      for (const old of oldSnapshots) {
        deleteItems.run(old.snapshot_id)
        deleteSnapshot.run(old.snapshot_id)
      }
    })
    pruneTx()
    console.log(`[diff] Pruned ${oldSnapshots.length} old snapshot(s)`)
  }

  console.log(`[diff] Saved new snapshot ${snapshotId} with ${items.length} items`)
}
