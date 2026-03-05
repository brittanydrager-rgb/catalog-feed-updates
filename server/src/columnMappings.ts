import { db } from './db.js'
import { v4 as uuid } from 'uuid'

export interface ColumnMapping {
  sourceColumn: string
  canonicalField: string
  transform?: (value: string) => unknown
}

export const KROGER_MAPPING: ColumnMapping[] = [
  { sourceColumn: 'upc', canonicalField: 'scan_code' },
  { sourceColumn: 'name', canonicalField: 'item_name' },
  { sourceColumn: 'brand', canonicalField: 'brand_name' },
  { sourceColumn: 'department', canonicalField: 'department' },
  { sourceColumn: 'commodity', canonicalField: 'category' },
  { sourceColumn: 'size', canonicalField: 'size' },
  { sourceColumn: 'unit_size', canonicalField: 'unit_of_measure' },
  { sourceColumn: 'alcoholic', canonicalField: 'alcohol', transform: (v) => v === 'True' },
  { sourceColumn: 'default_image_url', canonicalField: 'remote_image_url' },
  { sourceColumn: 'description', canonicalField: 'item_details' },
]

/**
 * Get column mapping for a retailer. For hackathon, always returns KROGER_MAPPING.
 */
export function getMapping(_retailerId: string): ColumnMapping[] {
  return KROGER_MAPPING
}

/**
 * Seed the KROGER_MAPPING into the feed_column_mappings table.
 */
export function seedMappings(retailerId: string): void {
  const existing = db.prepare(
    'SELECT COUNT(*) as cnt FROM feed_column_mappings WHERE retailer_id = ?'
  ).get(retailerId) as { cnt: number }

  if (existing.cnt > 0) return

  const insert = db.prepare(`
    INSERT INTO feed_column_mappings (mapping_id, retailer_id, source_column, canonical_field, transform_rule)
    VALUES (?, ?, ?, ?, ?)
  `)

  const tx = db.transaction(() => {
    for (const m of KROGER_MAPPING) {
      insert.run(
        uuid(),
        retailerId,
        m.sourceColumn,
        m.canonicalField,
        m.transform ? m.transform.toString() : null
      )
    }
  })
  tx()
  console.log(`[mappings] Seeded ${KROGER_MAPPING.length} column mappings for retailer ${retailerId}`)
}
