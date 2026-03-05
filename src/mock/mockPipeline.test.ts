import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PIPELINE_PHASES, processFeed } from './mockPipeline'

describe('PIPELINE_PHASES', () => {
  it('contains exactly 5 phases', () => {
    expect(PIPELINE_PHASES).toHaveLength(5)
  })

  it('has the correct phase names in order', () => {
    const names = PIPELINE_PHASES.map(p => p.name)
    expect(names).toEqual([
      'Parsing file...',
      'Validating fields...',
      'Matching products...',
      'Computing diff...',
      'Analyzing quality...',
    ])
  })

  it('total duration sums to 2000ms', () => {
    const total = PIPELINE_PHASES.reduce((sum, p) => sum + p.durationMs, 0)
    expect(total).toBe(2000)
  })

  it('each phase has a positive durationMs', () => {
    PIPELINE_PHASES.forEach(p => {
      expect(p.durationMs).toBeGreaterThan(0)
    })
  })
})

describe('processFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls onProgress for each phase in order', async () => {
    const onProgress = vi.fn()
    const promise = processFeed(onProgress)

    // Advance through all phases
    // Phase 0 fires at t=0
    await vi.advanceTimersByTimeAsync(0)
    expect(onProgress).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenCalledWith({
      phaseIndex: 0,
      phaseName: 'Parsing file...',
      totalPhases: 5,
    })

    // Phase 1 fires at t=300
    await vi.advanceTimersByTimeAsync(300)
    expect(onProgress).toHaveBeenCalledTimes(2)
    expect(onProgress).toHaveBeenCalledWith({
      phaseIndex: 1,
      phaseName: 'Validating fields...',
      totalPhases: 5,
    })

    // Phase 2 fires at t=700
    await vi.advanceTimersByTimeAsync(400)
    expect(onProgress).toHaveBeenCalledTimes(3)
    expect(onProgress).toHaveBeenCalledWith({
      phaseIndex: 2,
      phaseName: 'Matching products...',
      totalPhases: 5,
    })

    // Phase 3 fires at t=1200
    await vi.advanceTimersByTimeAsync(500)
    expect(onProgress).toHaveBeenCalledTimes(4)
    expect(onProgress).toHaveBeenCalledWith({
      phaseIndex: 3,
      phaseName: 'Computing diff...',
      totalPhases: 5,
    })

    // Phase 4 fires at t=1600
    await vi.advanceTimersByTimeAsync(400)
    expect(onProgress).toHaveBeenCalledTimes(5)
    expect(onProgress).toHaveBeenCalledWith({
      phaseIndex: 4,
      phaseName: 'Analyzing quality...',
      totalPhases: 5,
    })

    // Promise resolves after last phase duration (400ms more, at t=2000)
    await vi.advanceTimersByTimeAsync(400)
    await promise

    // Total calls should be exactly 5 (one per phase)
    expect(onProgress).toHaveBeenCalledTimes(5)
  })

  it('resolves the promise after all phases complete', async () => {
    const onProgress = vi.fn()
    let resolved = false
    const promise = processFeed(onProgress).then(() => {
      resolved = true
    })

    // Not resolved before all time elapses
    await vi.advanceTimersByTimeAsync(1999)
    expect(resolved).toBe(false)

    // Resolved after 2000ms total
    await vi.advanceTimersByTimeAsync(1)
    await promise
    expect(resolved).toBe(true)
  })

  it('calls onProgress with totalPhases = 5 for every call', async () => {
    const onProgress = vi.fn()
    const promise = processFeed(onProgress)

    // Run through all timers
    await vi.advanceTimersByTimeAsync(2500)
    await promise

    expect(onProgress).toHaveBeenCalledTimes(5)
    for (let i = 0; i < 5; i++) {
      expect(onProgress.mock.calls[i][0].totalPhases).toBe(5)
      expect(onProgress.mock.calls[i][0].phaseIndex).toBe(i)
    }
  })
})
