import { v4 as uuid } from 'uuid'
import { db, updateUploadStatus } from '../db.js'

interface FeedItem {
  item_id: string
  scan_code: string | null
  code_type: string | null
}

interface PlsMatchedProduct {
  product_id?: string | number
  productId?: string | number
  matched_method?: string
  matchedMethod?: string
}

interface PlsCodeMatch {
  matched_product?: PlsMatchedProduct
  matchedProduct?: PlsMatchedProduct
  other_matches?: PlsMatchedProduct[]
  otherMatches?: PlsMatchedProduct[]
}

interface PlsBulkResponse {
  results?: {
    bulk_retailer_product_code_match?: Record<string, PlsCodeMatch>
    bulkRetailerProductCodeMatch?: Record<string, PlsCodeMatch>
  }
}

const PLS_BACKGROUND_URL =
  'https://background-rpc-product-retrieval-customers.icprivate.com/rpc/' +
  'instacart.customers.product_retrieval.v1.catalog.v1.CatalogProductRetrievalService/' +
  'GetBulkRetailerProductCodeMatching'

const PLS_BATCH_SIZE = 10_000

/**
 * Call the real PLS bulk code matching API.
 * Sends codes in batches of 10k, returns a map of code → match result.
 */
async function callPlsBulk(
  retailerId: number,
  codes: string[],
): Promise<Record<string, PlsCodeMatch>> {
  const allMatches: Record<string, PlsCodeMatch> = {}

  for (let i = 0; i < codes.length; i += PLS_BATCH_SIZE) {
    const batch = codes.slice(i, i + PLS_BATCH_SIZE)
    const batchNum = Math.floor(i / PLS_BATCH_SIZE) + 1
    const totalBatches = Math.ceil(codes.length / PLS_BATCH_SIZE)
    console.log(`[match]   PLS batch ${batchNum}/${totalBatches}: ${batch.length} codes`)

    const startMs = Date.now()
    const resp = await fetch(PLS_BACKGROUND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_meta: { src: 'catalog-feed-updates-hackathon' },
        parameters: {
          retailerId: String(retailerId),
          codes: batch,
          codeType: 1, // LOOKUP_CODE_RAW
        },
      }),
    })

    const latencyMs = Date.now() - startMs
    console.log(`[match]   PLS batch ${batchNum} responded in ${latencyMs}ms (status ${resp.status})`)

    if (!resp.ok) {
      const body = await resp.text()
      console.error(`[match]   PLS error: ${resp.status} ${body.slice(0, 500)}`)
      // Continue with what we have — don't fail the whole pipeline
      continue
    }

    const data = (await resp.json()) as PlsBulkResponse

    const matches = data.results?.bulk_retailer_product_code_match
      ?? data.results?.bulkRetailerProductCodeMatch
      ?? {}
    Object.assign(allMatches, matches)
  }

  return allMatches
}

/**
 * Phase 3: PLS Matching — calls the real GetBulkRetailerProductCodeMatching API.
 * Synchronous wrapper around the async PLS call (pipeline orchestrator must await).
 */
export async function phaseMatch(
  uploadId: string,
  retailerId: number,
): Promise<'continue' | 'rejected_mismatch'> {
  console.log(`[match] Phase 3: PLS bulk matching for upload ${uploadId}`)
  updateUploadStatus(uploadId, 'matching')

  const items = db.prepare(
    'SELECT item_id, scan_code, code_type FROM feed_items WHERE upload_id = ?'
  ).all(uploadId) as FeedItem[]

  // Collect unique scan codes
  const codeToItems = new Map<string, FeedItem[]>()
  for (const item of items) {
    if (!item.scan_code) continue
    const existing = codeToItems.get(item.scan_code) ?? []
    existing.push(item)
    codeToItems.set(item.scan_code, existing)
  }

  const uniqueCodes = Array.from(codeToItems.keys())
  console.log(`[match]   ${items.length} items, ${uniqueCodes.length} unique codes`)

  // Call real PLS API
  const plsMatches = await callPlsBulk(retailerId, uniqueCodes)
  const matchedCount = Object.keys(plsMatches).length
  console.log(`[match]   PLS returned ${matchedCount} matches`)

  // Insert results into DB
  const insertMatch = db.prepare(`
    INSERT INTO pls_match_results (
      match_id, item_id, upload_id, scan_code, code_type,
      matched_product_id, match_method, match_confidence,
      alternative_ids, is_duplicate, pls_response_raw, latency_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const tx = db.transaction(() => {
    for (const item of items) {
      if (!item.scan_code) {
        // No scan code — record as unmatched
        insertMatch.run(
          uuid(), item.item_id, uploadId, item.scan_code,
          item.code_type || 'UPC', 0, 'no_match', 0.0,
          '[]', 0, '{}', 0,
        )
        continue
      }

      const plsMatch = plsMatches[item.scan_code]
      const matchedProduct = plsMatch?.matched_product ?? plsMatch?.matchedProduct
      const rawProductId = matchedProduct?.product_id ?? matchedProduct?.productId
      const productId = rawProductId ? Number(rawProductId) : 0
      const matchMethod = matchedProduct?.matched_method ?? matchedProduct?.matchedMethod ?? 'no_match'
      const hasMatch = productId > 0

      const otherMatches = plsMatch?.other_matches ?? plsMatch?.otherMatches ?? []
      const alternatives = otherMatches.map(m => ({
        product_id: Number(m.product_id ?? m.productId ?? 0),
        matched_method: m.matched_method ?? m.matchedMethod ?? '',
      }))

      insertMatch.run(
        uuid(),
        item.item_id,
        uploadId,
        item.scan_code,
        item.code_type || 'UPC',
        productId,
        hasMatch ? matchMethod : 'no_match',
        hasMatch ? 0.99 : 0.0,
        JSON.stringify(alternatives),
        0, // is_duplicate handled by validation phase
        JSON.stringify(plsMatch ?? {}),
        0, // latency tracked at batch level
      )
    }
  })
  tx()

  const unmatchedCount = items.filter(i =>
    i.scan_code && !plsMatches[i.scan_code]?.matched_product?.product_id
  ).length
  console.log(`[match] Phase 3 complete: ${items.length - unmatchedCount} matched, ${unmatchedCount} unmatched`)

  // For hackathon: skip mismatch detection (no catalog comparison)
  return 'continue'
}
