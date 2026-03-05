import { v4 as uuid } from 'uuid'
import { db, updateUploadStatus } from '../db.js'

interface FeedItem {
  item_id: string
  scan_code: string | null
  item_name: string | null
  brand_name: string | null
  price: number | null
  size: string | null
  weight: string | null
  unit_of_measure: string | null
  category: string | null
  department: string | null
  remote_image_url: string | null
}

interface DiffItem {
  diff_item_id: string
  scan_code: string | null
  change_type: string
  field_changes: string | null
}

export function phaseQuality(uploadId: string, diffId: string, retailerId: string): void {
  console.log(`[quality] Phase 5: Computing quality score and anomaly detection for upload ${uploadId}`)

  const items = db.prepare(
    'SELECT * FROM feed_items WHERE upload_id = ?'
  ).all(uploadId) as FeedItem[]

  const totalCount = items.length
  const breakdownMap: Record<string, number> = {}
  let catalogReadyCount = 0

  for (const item of items) {
    const reasons: string[] = []

    if (!item.scan_code || item.scan_code.trim() === '') {
      reasons.push('missing_scan_code')
    }
    if (!item.item_name || item.item_name.trim() === '') {
      reasons.push('missing_item_name')
    }
    if (!item.brand_name || item.brand_name.trim() === '') {
      reasons.push('missing_brand_name')
    }
    // Price: warning but doesn't block catalog readiness for Kroger (no price in CSV)
    // We still flag it in breakdown but don't count it against readiness
    if (!item.price || item.price <= 0) {
      reasons.push('missing_price')
    }
    if (
      (!item.size || item.size.trim() === '') &&
      (!item.weight || item.weight.trim() === '') &&
      (!item.unit_of_measure || item.unit_of_measure.trim() === '')
    ) {
      reasons.push('missing_size_weight_uom')
    }
    if (
      (!item.category || item.category.trim() === '') &&
      (!item.department || item.department.trim() === '')
    ) {
      reasons.push('missing_category_department')
    }
    if (!item.remote_image_url || item.remote_image_url.trim() === '') {
      reasons.push('missing_image')
    }

    // For catalog readiness: exclude price/cost_unit since Kroger CSV doesn't have them
    const readinessReasons = reasons.filter(r => r !== 'missing_price')
    const isReady = readinessReasons.length === 0

    if (isReady) {
      catalogReadyCount++
    }

    // Update diff_item with readiness
    if (item.scan_code) {
      db.prepare(`
        UPDATE feed_diff_items
        SET is_catalog_ready = ?, not_ready_reasons = ?
        WHERE diff_id = ? AND scan_code = ?
      `).run(isReady ? 1 : 0, JSON.stringify(readinessReasons), diffId, item.scan_code)
    }

    // Accumulate breakdown
    for (const reason of reasons) {
      breakdownMap[reason] = (breakdownMap[reason] || 0) + 1
    }
  }

  const notReadyCount = totalCount - catalogReadyCount
  const score = totalCount > 0 ? Math.round((catalogReadyCount / totalCount) * 100) : 0

  // Build breakdown array
  const breakdown = Object.entries(breakdownMap).map(([field, count]) => ({
    field,
    count,
  }))

  // Insert quality score history
  db.prepare(`
    INSERT INTO feed_quality_score_history (
      score_id, retailer_id, upload_id, score,
      catalog_ready_count, total_count, not_ready_count,
      breakdown, computed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    uuid(), retailerId, uploadId, score,
    catalogReadyCount, totalCount, notReadyCount,
    JSON.stringify(breakdown)
  )

  // Update feed_diffs with quality score
  db.prepare(`
    UPDATE feed_diffs
    SET quality_score = ?, catalog_ready_count = ?, not_ready_count = ?
    WHERE diff_id = ?
  `).run(score, catalogReadyCount, notReadyCount, diffId)

  console.log(`[quality] Quality score: ${score}% (${catalogReadyCount}/${totalCount} catalog-ready)`)

  // --- Anomaly Detection ---
  detectAnomalies(uploadId, diffId, retailerId)

  // --- AI Summary ---
  generateAiSummary(uploadId, diffId, retailerId, score, breakdown, totalCount)

  // --- Final status ---
  const warningCount = (db.prepare(
    'SELECT COUNT(*) as cnt FROM feed_item_validations WHERE upload_id = ? AND severity = ?'
  ).get(uploadId, 'warning') as { cnt: number }).cnt

  const finalStatus = warningCount > 0 ? 'completed_with_warnings' : 'completed'
  updateUploadStatus(uploadId, finalStatus, { processed_at: new Date().toISOString() })

  console.log(`[quality] Phase 5 complete: status = ${finalStatus}`)
}

function detectAnomalies(uploadId: string, diffId: string, retailerId: string): void {
  // Get diff items with changes
  const diffItems = db.prepare(
    'SELECT * FROM feed_diff_items WHERE diff_id = ?'
  ).all(diffId) as DiffItem[]

  const totalItems = diffItems.length
  if (totalItems === 0) return

  // Count by change type
  const removedCount = diffItems.filter(d => d.change_type === 'removed').length
  const changedItems = diffItems.filter(d => d.change_type === 'changed')

  // Analyze changed items for specific field changes
  let nameChangeCount = 0
  let priceChangeCount = 0
  let alcoholChangeCount = 0
  let costUnitChangeCount = 0

  for (const item of changedItems) {
    if (!item.field_changes) continue
    try {
      const changes = JSON.parse(item.field_changes) as { field: string; previous: unknown; current: unknown }[]
      for (const change of changes) {
        if (change.field === 'item_name') nameChangeCount++
        if (change.field === 'price') priceChangeCount++
        if (change.field === 'alcohol') alcoholChangeCount++
        if (change.field === 'cost_unit') costUnitChangeCount++
      }
    } catch {
      // Skip malformed field_changes
    }
  }

  const alerts: {
    alertType: string
    category: string
    affectedCount: number
    affectedPct: number
    thresholdUsed: number
    description: string
    isDismissible: boolean
  }[] = []

  // Bulk name change > 20%
  const nameChangePct = totalItems > 0 ? nameChangeCount / totalItems : 0
  if (nameChangePct > 0.20) {
    alerts.push({
      alertType: 'bulk_name_change',
      category: 'Product Names',
      affectedCount: nameChangeCount,
      affectedPct: Math.round(nameChangePct * 100),
      thresholdUsed: 20,
      description: `${nameChangeCount} product names changed (${Math.round(nameChangePct * 100)}% of catalog). This may indicate a bulk data update or formatting change.`,
      isDismissible: true,
    })
  }

  // Bulk removal > 10%
  const removalPct = totalItems > 0 ? removedCount / totalItems : 0
  if (removalPct > 0.10) {
    alerts.push({
      alertType: 'bulk_removal',
      category: 'Removals',
      affectedCount: removedCount,
      affectedPct: Math.round(removalPct * 100),
      thresholdUsed: 10,
      description: `${removedCount} items removed from feed (${Math.round(removalPct * 100)}% of catalog). Verify this is intentional.`,
      isDismissible: true,
    })
  }

  // Bulk price change > 15%
  const priceChangePct = totalItems > 0 ? priceChangeCount / totalItems : 0
  if (priceChangePct > 0.15) {
    alerts.push({
      alertType: 'bulk_price_change',
      category: 'Pricing',
      affectedCount: priceChangeCount,
      affectedPct: Math.round(priceChangePct * 100),
      thresholdUsed: 15,
      description: `${priceChangeCount} price changes detected (${Math.round(priceChangePct * 100)}% of catalog). Review for pricing errors.`,
      isDismissible: true,
    })
  }

  // Alcohol flag change (any)
  if (alcoholChangeCount > 0) {
    alerts.push({
      alertType: 'alcohol_flag_change',
      category: 'Compliance',
      affectedCount: alcoholChangeCount,
      affectedPct: totalItems > 0 ? Math.round((alcoholChangeCount / totalItems) * 100) : 0,
      thresholdUsed: 0,
      description: `${alcoholChangeCount} item(s) had alcohol flag changes. This requires immediate review for compliance.`,
      isDismissible: false,
    })
  }

  // Cost unit flip (any)
  if (costUnitChangeCount > 0) {
    alerts.push({
      alertType: 'cost_unit_flip',
      category: 'Pricing',
      affectedCount: costUnitChangeCount,
      affectedPct: totalItems > 0 ? Math.round((costUnitChangeCount / totalItems) * 100) : 0,
      thresholdUsed: 0,
      description: `${costUnitChangeCount} item(s) had cost unit changes (e.g., EA to LB). This affects pricing calculations.`,
      isDismissible: false,
    })
  }

  // Insert alerts
  if (alerts.length > 0) {
    const insertAlert = db.prepare(`
      INSERT INTO feed_anomaly_alerts (
        alert_id, diff_id, upload_id, alert_type, category,
        affected_count, affected_pct, threshold_used,
        description, is_dismissible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const tx = db.transaction(() => {
      for (const alert of alerts) {
        insertAlert.run(
          uuid(), diffId, uploadId, alert.alertType, alert.category,
          alert.affectedCount, alert.affectedPct, alert.thresholdUsed,
          alert.description, alert.isDismissible ? 1 : 0
        )
      }
    })
    tx()

    console.log(`[quality] Generated ${alerts.length} anomaly alert(s)`)
  } else {
    console.log(`[quality] No anomaly alerts triggered`)
  }
}

function generateAiSummary(
  uploadId: string,
  diffId: string,
  _retailerId: string,
  score: number,
  breakdown: { field: string; count: number }[],
  totalCount: number,
): void {
  // Get diff stats
  const diff = db.prepare('SELECT * FROM feed_diffs WHERE diff_id = ?').get(diffId) as Record<string, unknown>
  const warningCount = (db.prepare(
    'SELECT COUNT(*) as cnt FROM feed_item_validations WHERE upload_id = ? AND severity = ?'
  ).get(uploadId, 'warning') as { cnt: number }).cnt

  const alertCount = (db.prepare(
    'SELECT COUNT(*) as cnt FROM feed_anomaly_alerts WHERE upload_id = ?'
  ).get(uploadId) as { cnt: number }).cnt

  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Build quality details
  const qualityIssues = breakdown
    .filter(b => b.field !== 'missing_price') // Don't call out price since Kroger doesn't have it
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(b => `${b.count} items ${b.field.replace('missing_', 'missing ')}`)
    .join(', ')

  // Build summary
  let summary = `Your ${date} feed was accepted`
  if (warningCount > 0) {
    summary += ` with ${warningCount} catalog quality warnings`
  }
  summary += `. ${totalCount} items processed: ${diff.added_count} added, ${diff.removed_count} removed, ${diff.changed_count} changed.`
  summary += ` Catalog readiness score: ${score}%.`

  if (qualityIssues) {
    summary += ` Top issues: ${qualityIssues}.`
  }

  if (alertCount > 0) {
    summary += ` ${alertCount} anomaly alert(s) require your attention.`
  }

  db.prepare('UPDATE feed_diffs SET ai_summary = ? WHERE diff_id = ?').run(summary, diffId)
}
