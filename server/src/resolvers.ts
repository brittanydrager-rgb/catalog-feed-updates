import { v4 as uuid } from 'uuid'
import { db } from './db.js'

// --- Helper types ---

interface DbRow {
  [key: string]: unknown
}

// --- Query Resolvers ---

export const resolvers = {
  Query: {
    feedUploadStatus(
      _: unknown,
      { retailerId, uploadId }: { retailerId: string; uploadId: string }
    ) {
      const upload = db.prepare(
        'SELECT * FROM feed_uploads WHERE upload_id = ? AND retailer_id = ?'
      ).get(uploadId, retailerId) as DbRow | undefined

      if (!upload) return null

      return {
        uploadId: upload.upload_id,
        status: upload.status,
        totalRows: upload.total_rows,
        validRows: upload.valid_rows,
        invalidRows: upload.invalid_rows,
        rejectionReason: upload.rejection_reason,
        processedAt: upload.processed_at,
        fileName: upload.file_name,
        fileFormat: upload.file_format,
        fileSizeBytes: upload.file_size_bytes,
        uploadedAt: upload.uploaded_at,
      }
    },

    feedValidation(
      _: unknown,
      { uploadId }: { retailerId: string; uploadId: string }
    ) {
      const upload = db.prepare(
        'SELECT * FROM feed_uploads WHERE upload_id = ?'
      ).get(uploadId) as DbRow | undefined

      if (!upload) return null

      const violations = db.prepare(`
        SELECT v.*, fi.row_number
        FROM feed_item_validations v
        JOIN feed_items fi ON v.item_id = fi.item_id
        WHERE v.upload_id = ?
        ORDER BY fi.row_number
      `).all(uploadId) as DbRow[]

      const blockingCount = (db.prepare(
        'SELECT COUNT(*) as cnt FROM feed_item_validations WHERE upload_id = ? AND is_blocking = 1'
      ).get(uploadId) as { cnt: number }).cnt

      return {
        status: upload.status,
        summary: {
          totalItems: upload.total_rows,
          valid: upload.valid_rows,
          invalid: upload.invalid_rows,
          blockingErrors: blockingCount,
        },
        violations: violations.map(v => ({
          itemId: v.item_id,
          rowNumber: v.row_number,
          field: v.field,
          rule: v.rule,
          message: v.message,
          severity: v.severity,
        })),
      }
    },

    feedMatches(
      _: unknown,
      { uploadId }: { retailerId: string; uploadId: string }
    ) {
      const matches = db.prepare(
        'SELECT * FROM pls_match_results WHERE upload_id = ?'
      ).all(uploadId) as DbRow[]

      const matched = matches.filter(m => (m.matched_product_id as number) > 0)
      const unmatched = matches.filter(m => !(m.matched_product_id as number) || (m.matched_product_id as number) === 0)

      return {
        matchedCount: matched.length,
        unmatchedCount: unmatched.length,
        items: matches.map(m => ({
          scanCode: m.scan_code,
          codeType: m.code_type,
          productId: m.matched_product_id,
          matchMethod: m.match_method,
          confidence: m.match_confidence,
          alternatives: m.alternative_ids ? JSON.parse(m.alternative_ids as string) : [],
          isDuplicate: Boolean(m.is_duplicate),
        })),
      }
    },

    feedDiff(
      _: unknown,
      { retailerId, diffId }: { retailerId: string; diffId: string }
    ) {
      const diff = db.prepare(
        'SELECT * FROM feed_diffs WHERE diff_id = ? AND retailer_id = ?'
      ).get(diffId, retailerId) as DbRow | undefined

      if (!diff) return null

      // Build categories from diff items
      const categoryCounts = db.prepare(`
        SELECT
          change_type,
          severity,
          COUNT(*) as cnt
        FROM feed_diff_items
        WHERE diff_id = ?
        GROUP BY change_type, severity
        ORDER BY
          CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
          cnt DESC
      `).all(diffId) as { change_type: string; severity: string; cnt: number }[]

      const categories = categoryCounts.map(c => ({
        id: `${c.change_type}_${c.severity}`,
        label: `${c.change_type} (${c.severity})`,
        severity: c.severity,
        count: c.cnt,
      }))

      return {
        diffId: diff.diff_id,
        uploadId: diff.upload_id,
        previousUploadId: diff.previous_upload_id,
        addedCount: diff.added_count,
        removedCount: diff.removed_count,
        changedCount: diff.changed_count,
        unchangedCount: diff.unchanged_count,
        qualityScore: diff.quality_score,
        aiSummary: diff.ai_summary,
        categories,
      }
    },

    feedDiffItems(
      _: unknown,
      args: {
        retailerId: string
        diffId: string
        changeType?: string
        severity?: string
        category?: string
        page?: number
        perPage?: number
      }
    ) {
      const page = args.page ?? 1
      const perPage = args.perPage ?? 50
      const offset = (page - 1) * perPage

      let whereClause = 'WHERE di.diff_id = ?'
      const params: unknown[] = [args.diffId]

      if (args.changeType) {
        whereClause += ' AND di.change_type = ?'
        params.push(args.changeType)
      }
      if (args.severity) {
        whereClause += ' AND di.severity = ?'
        params.push(args.severity)
      }

      // Count total
      const countResult = db.prepare(
        `SELECT COUNT(*) as cnt FROM feed_diff_items di ${whereClause}`
      ).get(...params) as { cnt: number }

      // Get page of items
      const items = db.prepare(`
        SELECT di.*, fi.item_name as product_name
        FROM feed_diff_items di
        LEFT JOIN feed_items fi ON di.item_id = fi.item_id
        ${whereClause}
        ORDER BY
          CASE di.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
          di.change_type
        LIMIT ? OFFSET ?
      `).all(...params, perPage, offset) as DbRow[]

      return {
        items: items.map(item => ({
          scanCode: item.scan_code,
          productId: item.product_id,
          productName: item.product_name || item.scan_code,
          changeType: item.change_type,
          severity: item.severity,
          fieldChanges: item.field_changes ? JSON.parse(item.field_changes as string) : [],
          isCatalogReady: Boolean(item.is_catalog_ready),
          notReadyReasons: item.not_ready_reasons ? JSON.parse(item.not_ready_reasons as string) : [],
          changeSummary: item.change_summary,
        })),
        pagination: {
          page,
          perPage,
          total: countResult.cnt,
        },
      }
    },

    feedQuality(
      _: unknown,
      { retailerId }: { retailerId: string }
    ) {
      // Current (most recent)
      const current = db.prepare(
        'SELECT * FROM feed_quality_score_history WHERE retailer_id = ? ORDER BY computed_at DESC LIMIT 1'
      ).get(retailerId) as DbRow | undefined

      // Trend (last 10)
      const trend = db.prepare(
        'SELECT upload_id, score, computed_at FROM feed_quality_score_history WHERE retailer_id = ? ORDER BY computed_at DESC LIMIT 10'
      ).all(retailerId) as DbRow[]

      return {
        current: current ? {
          score: current.score,
          catalogReadyCount: current.catalog_ready_count,
          totalCount: current.total_count,
          notReadyCount: current.not_ready_count,
          breakdown: current.breakdown ? JSON.parse(current.breakdown as string) : [],
        } : null,
        trend: trend.map(t => ({
          uploadId: t.upload_id,
          score: t.score,
          computedAt: t.computed_at,
        })),
      }
    },

    feedAnomalyAlerts(
      _: unknown,
      { uploadId }: { retailerId: string; uploadId: string }
    ) {
      const alerts = db.prepare(
        'SELECT * FROM feed_anomaly_alerts WHERE upload_id = ? AND dismissed_at IS NULL ORDER BY created_at DESC'
      ).all(uploadId) as DbRow[]

      return {
        alerts: alerts.map(a => ({
          alertId: a.alert_id,
          type: a.alert_type,
          category: a.category,
          affectedCount: a.affected_count,
          affectedPct: a.affected_pct,
          description: a.description,
          isDismissible: Boolean(a.is_dismissible),
        })),
      }
    },

    feedColumnMappings(
      _: unknown,
      { retailerId }: { retailerId: string }
    ) {
      const mappings = db.prepare(
        'SELECT * FROM feed_column_mappings WHERE retailer_id = ? ORDER BY created_at'
      ).all(retailerId) as DbRow[]

      return mappings.map(m => ({
        mappingId: m.mapping_id,
        sourceColumn: m.source_column,
        canonicalField: m.canonical_field,
        transformRule: m.transform_rule,
      }))
    },
  },

  Mutation: {
    dismissAnomalyAlert(
      _: unknown,
      { alertId }: { retailerId: string; alertId: string }
    ) {
      const now = new Date().toISOString()
      db.prepare(
        'UPDATE feed_anomaly_alerts SET dismissed_at = ?, dismissed_by = ? WHERE alert_id = ?'
      ).run(now, 'hackathon_user', alertId)

      return { dismissedAt: now }
    },

    cancelFeedUpload(
      _: unknown,
      { retailerId, uploadId }: { retailerId: string; uploadId: string }
    ) {
      db.prepare(
        "UPDATE feed_uploads SET status = 'failed', rejection_reason = 'Cancelled by user', updated_at = datetime('now') WHERE upload_id = ? AND retailer_id = ?"
      ).run(uploadId, retailerId)

      return { uploadId, status: 'failed' }
    },

    updateFeedColumnMappings(
      _: unknown,
      { retailerId, mappings }: { retailerId: string; mappings: { sourceColumn: string; canonicalField: string; transformRule?: string }[] }
    ) {
      const upsert = db.prepare(`
        INSERT INTO feed_column_mappings (mapping_id, retailer_id, source_column, canonical_field, transform_rule, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(mapping_id) DO UPDATE SET
          source_column = excluded.source_column,
          canonical_field = excluded.canonical_field,
          transform_rule = excluded.transform_rule,
          updated_at = excluded.updated_at
      `)

      // Delete existing mappings for this retailer and re-insert
      const tx = db.transaction(() => {
        db.prepare('DELETE FROM feed_column_mappings WHERE retailer_id = ?').run(retailerId)
        for (const m of mappings) {
          upsert.run(uuid(), retailerId, m.sourceColumn, m.canonicalField, m.transformRule || null)
        }
      })
      tx()

      // Return updated mappings
      const updated = db.prepare(
        'SELECT * FROM feed_column_mappings WHERE retailer_id = ? ORDER BY created_at'
      ).all(retailerId) as DbRow[]

      return updated.map(m => ({
        mappingId: m.mapping_id,
        sourceColumn: m.source_column,
        canonicalField: m.canonical_field,
        transformRule: m.transform_rule,
      }))
    },
  },
}
