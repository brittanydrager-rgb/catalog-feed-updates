import fs from 'node:fs'
import { parse } from 'csv-parse/sync'
import { v4 as uuid } from 'uuid'
import { db, updateUploadStatus } from '../db.js'
import { getMapping } from '../columnMappings.js'

export function phaseParse(uploadId: string, filePath: string, retailerId: string): void {
  console.log(`[parse] Phase 1: Parsing file for upload ${uploadId}`)
  updateUploadStatus(uploadId, 'parsing')

  // Read and parse CSV
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[]

  console.log(`[parse] Read ${records.length} rows from CSV`)

  // Load column mapping
  const mapping = getMapping(retailerId)

  // Prepare insert statement
  const insert = db.prepare(`
    INSERT INTO feed_items (
      item_id, upload_id, row_number, scan_code, code_type, item_name, brand_name,
      price, sale_price, cost_unit, size, weight, unit_of_measure,
      category, department, available, alcohol, remote_image_url,
      item_details, ingredients, loyalty_price, raw_row
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `)

  // Batch insert using transaction
  const batchInsert = db.transaction((rows: Record<string, string>[], startRow: number) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = startRow + i + 1

      // Map columns using the mapping config
      const mapped: Record<string, unknown> = {}
      for (const m of mapping) {
        const rawValue = row[m.sourceColumn]
        if (rawValue !== undefined && rawValue !== '') {
          mapped[m.canonicalField] = m.transform ? m.transform(rawValue) : rawValue
        }
      }

      insert.run(
        uuid(),
        uploadId,
        rowNumber,
        mapped.scan_code as string || null,
        'UPC',  // Kroger uses UPC
        mapped.item_name as string || null,
        mapped.brand_name as string || null,
        mapped.price as number || null,       // Kroger CSV has no price
        mapped.sale_price as number || null,
        mapped.cost_unit as string || null,    // Kroger CSV has no cost_unit
        mapped.size as string || null,
        mapped.weight as string || null,
        mapped.unit_of_measure as string || null,
        mapped.category as string || null,
        mapped.department as string || null,
        mapped.available !== undefined ? (mapped.available ? 1 : 0) : null,
        mapped.alcohol !== undefined ? (mapped.alcohol ? 1 : 0) : 0,
        mapped.remote_image_url as string || null,
        mapped.item_details as string || null,
        mapped.ingredients as string || null,
        mapped.loyalty_price as number || null,
        JSON.stringify(row)  // Store original row
      )
    }
  })

  // Process in batches of 500 for good transaction performance
  const BATCH_SIZE = 500
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    batchInsert(batch, i)
  }

  // Update upload with total rows
  updateUploadStatus(uploadId, 'parsing', { total_rows: records.length })

  console.log(`[parse] Phase 1 complete: ${records.length} rows inserted`)
}
