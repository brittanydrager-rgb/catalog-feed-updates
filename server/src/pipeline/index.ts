import { updateUploadStatus } from '../db.js'
import { phaseParse } from './parse.js'
import { phaseValidate } from './validate.js'
import { phaseMatch } from './match.js'
import { phaseDiff } from './diff.js'
import { phaseQuality } from './quality.js'

/**
 * Run the complete 5-phase feed processing pipeline synchronously.
 * Each phase runs in sequence. If a phase returns a rejection status,
 * the pipeline stops early.
 */
export async function processFeedSync(uploadId: string, filePath: string, retailerId: string): Promise<void> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[pipeline] Starting feed processing for upload ${uploadId}`)
  console.log(`[pipeline] File: ${filePath}`)
  console.log(`[pipeline] Retailer: ${retailerId}`)
  console.log(`${'='.repeat(60)}\n`)

  const startTime = Date.now()

  try {
    // Phase 1: Parse CSV and insert feed_items
    const t1 = Date.now()
    phaseParse(uploadId, filePath, retailerId)
    console.log(`[pipeline] Phase 1 (parse) took ${Date.now() - t1}ms`)

    // Phase 2: Validate all items
    const t2 = Date.now()
    const validateResult = phaseValidate(uploadId)
    console.log(`[pipeline] Phase 2 (validate) took ${Date.now() - t2}ms`)

    if (validateResult === 'rejected_missing_fields') {
      console.log(`[pipeline] STOPPED: Feed rejected due to missing required fields`)
      return
    }

    // Phase 3: PLS Matching (real API call)
    const t3 = Date.now()
    const matchResult = await phaseMatch(uploadId, Number(retailerId))
    console.log(`[pipeline] Phase 3 (match) took ${Date.now() - t3}ms`)

    if (matchResult === 'rejected_mismatch') {
      console.log(`[pipeline] STOPPED: Feed rejected due to catalog mismatch`)
      return
    }

    // Phase 4: Diff Computation
    const t4 = Date.now()
    const diffId = phaseDiff(uploadId, retailerId)
    console.log(`[pipeline] Phase 4 (diff) took ${Date.now() - t4}ms`)

    // Phase 5: Quality Score & Anomaly Detection
    const t5 = Date.now()
    phaseQuality(uploadId, diffId, retailerId)
    console.log(`[pipeline] Phase 5 (quality) took ${Date.now() - t5}ms`)

    const totalTime = Date.now() - startTime
    console.log(`\n${'='.repeat(60)}`)
    console.log(`[pipeline] Feed processing complete in ${totalTime}ms`)
    console.log(`${'='.repeat(60)}\n`)

  } catch (error) {
    console.error(`[pipeline] ERROR:`, error)
    const message = error instanceof Error ? error.message : String(error)
    updateUploadStatus(uploadId, 'failed', {
      rejection_reason: `Pipeline error: ${message}`,
      processed_at: new Date().toISOString(),
    })
  }
}
