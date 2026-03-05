import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchFeedUploadStatus,
  fetchFeedValidation,
  fetchFeedMatches,
  fetchFeedDiff,
  fetchFeedDiffItems,
  fetchFeedQuality,
  fetchFeedAnomalyAlerts,
  mutateUploadFeed,
  mutateDismissAlert,
  mutateCancelUpload,
  mutateUpdateColumnMappings,
} from './mockClient'
import { _resetDismissedAlerts } from './resolvers'

beforeEach(() => {
  vi.useFakeTimers()
  _resetDismissedAlerts()
})

afterEach(() => {
  vi.useRealTimers()
})

// ── Query functions ────────────────────────────────────────────────────────

describe('fetchFeedUploadStatus', () => {
  it('returns a resolved promise with the correct shape', async () => {
    const promise = fetchFeedUploadStatus('r1', 'u1')
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result).toHaveProperty('uploadId')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('totalRows')
    expect(result.status).toBe('completed_with_warnings')
  })
})

describe('fetchFeedValidation', () => {
  it('returns a resolved promise with summary and violations', async () => {
    const promise = fetchFeedValidation('r1', 'u1')
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('violations')
  })
})

describe('fetchFeedMatches', () => {
  it('returns matches with matchedCount', async () => {
    const promise = fetchFeedMatches('r1', 'u1')
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result).toHaveProperty('matchedCount')
    expect(result).toHaveProperty('items')
    expect(result.matchedCount).toBe(result.items.length)
  })
})

describe('fetchFeedDiff', () => {
  it('returns diff with categories and quality score', async () => {
    const promise = fetchFeedDiff('r1', 'd1')
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result).toHaveProperty('diffId')
    expect(result).toHaveProperty('qualityScore')
    expect(result).toHaveProperty('categories')
    expect(result.qualityScore).toBe(82)
  })
})

describe('fetchFeedDiffItems', () => {
  it('returns items with pagination (no filters)', async () => {
    const promise = fetchFeedDiffItems('r1', 'd1')
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result).toHaveProperty('items')
    expect(result).toHaveProperty('pagination')
    expect(result.pagination.page).toBe(1)
  })

  it('accepts filter parameters', async () => {
    const promise = fetchFeedDiffItems('r1', 'd1', {
      changeType: 'changed',
      severity: 'critical',
      category: 'sellability',
      page: 1,
      perPage: 10,
    })
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result.pagination.perPage).toBe(10)
    result.items.forEach(item => {
      expect(item.severity).toBe('critical')
    })
  })
})

describe('fetchFeedQuality', () => {
  it('returns current score and trend', async () => {
    const promise = fetchFeedQuality('r1')
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result).toHaveProperty('current')
    expect(result).toHaveProperty('trend')
    expect(result.current.score).toBe(82)
  })
})

describe('fetchFeedAnomalyAlerts', () => {
  it('returns alerts array', async () => {
    const promise = fetchFeedAnomalyAlerts('r1', 'u1')
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result).toHaveProperty('alerts')
    expect(result.alerts.length).toBeGreaterThan(0)
  })
})

// ── Mutation functions ─────────────────────────────────────────────────────

describe('mutateUploadFeed', () => {
  it('returns uploadId and pending status', async () => {
    const promise = mutateUploadFeed('r1', 'file.csv')
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result).toHaveProperty('uploadId')
    expect(result.status).toBe('pending')
  })
})

describe('mutateDismissAlert', () => {
  it('returns dismissedAt timestamp', async () => {
    const promise = mutateDismissAlert('r1', 'alert-1')
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result).toHaveProperty('dismissedAt')
    expect(typeof result.dismissedAt).toBe('string')
  })
})

describe('mutateCancelUpload', () => {
  it('returns uploadId and failed status', async () => {
    const promise = mutateCancelUpload('r1', 'upload-001')
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result.uploadId).toBe('upload-001')
    expect(result.status).toBe('failed')
  })
})

describe('mutateUpdateColumnMappings', () => {
  it('returns the mappings passed in', async () => {
    const input = [
      { sourceColumn: 'A', canonicalField: 'b' },
    ]
    const promise = mutateUpdateColumnMappings('r1', input)
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result.mappings).toHaveLength(1)
    expect(result.mappings[0].sourceColumn).toBe('A')
    expect(result.mappings[0].canonicalField).toBe('b')
    expect(result.mappings[0].transformRule).toBeNull()
  })
})
