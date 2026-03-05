import { describe, it, expect, vi, afterEach } from 'vitest'
import { track, type AnalyticsEvent } from './events'

describe('track()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs to console with "[Analytics]" prefix and event name', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    track({
      event: 'catalog_diff_page_viewed',
      retailer_id: 'r1',
      feed_id: 'f1',
      feed_date: '2026-03-05',
      total_added: 2,
      total_removed: 1,
      total_changed: 5,
    })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toBe('[Analytics] catalog_diff_page_viewed')
    // Second argument is JSON of the properties (without the event key)
    const json = JSON.parse(spy.mock.calls[0][1])
    expect(json).toHaveProperty('retailer_id', 'r1')
    expect(json).toHaveProperty('feed_id', 'f1')
    expect(json).not.toHaveProperty('event')
  })

  it('logs catalog_diff_product_expanded correctly', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    track({
      event: 'catalog_diff_product_expanded',
      retailer_id: 'r1',
      feed_id: 'f1',
      product_id: 'p1',
      scan_code: '123456789',
      change_types: ['price', 'size'],
    })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain('catalog_diff_product_expanded')
    const json = JSON.parse(spy.mock.calls[0][1])
    expect(json.change_types).toEqual(['price', 'size'])
  })

  it('logs catalog_diff_filter_applied correctly', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    track({
      event: 'catalog_diff_filter_applied',
      retailer_id: 'r1',
      feed_id: 'f1',
      filter_type: 'sellability',
    })
    expect(spy).toHaveBeenCalledTimes(1)
    const json = JSON.parse(spy.mock.calls[0][1])
    expect(json.filter_type).toBe('sellability')
  })

  it('logs catalog_anomaly_alert_viewed with counts', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    track({
      event: 'catalog_anomaly_alert_viewed',
      retailer_id: 'r1',
      feed_id: 'f1',
      alert_type: 'bulk_name_change',
      category: 'Produce',
      affected_count: 8,
      affected_pct: 40,
    })
    expect(spy).toHaveBeenCalledTimes(1)
    const json = JSON.parse(spy.mock.calls[0][1])
    expect(json.affected_count).toBe(8)
    expect(json.affected_pct).toBe(40)
  })

  it('logs catalog_anomaly_alert_dismissed correctly', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    track({
      event: 'catalog_anomaly_alert_dismissed',
      retailer_id: 'r1',
      feed_id: 'f1',
      alert_type: 'cost_unit_flip',
      category: 'General',
    })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain('catalog_anomaly_alert_dismissed')
  })

  it('logs catalog_quality_score_viewed with score data', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    track({
      event: 'catalog_quality_score_viewed',
      retailer_id: 'r1',
      feed_id: 'f1',
      score_pct: 82,
      catalog_ready_count: 410,
      total_count: 500,
      not_ready_count: 90,
    })
    expect(spy).toHaveBeenCalledTimes(1)
    const json = JSON.parse(spy.mock.calls[0][1])
    expect(json.score_pct).toBe(82)
  })

  it('logs catalog_quality_trend_viewed with direction', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    track({
      event: 'catalog_quality_trend_viewed',
      retailer_id: 'r1',
      feed_id: 'f1',
      trend_direction: 'up',
    })
    expect(spy).toHaveBeenCalledTimes(1)
    const json = JSON.parse(spy.mock.calls[0][1])
    expect(json.trend_direction).toBe('up')
  })

  it('logs catalog_diff_feed_compared correctly', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    track({
      event: 'catalog_diff_feed_compared',
      retailer_id: 'r1',
      feed_id: 'f1',
      compared_to_feed_id: 'f0',
    })
    expect(spy).toHaveBeenCalledTimes(1)
    const json = JSON.parse(spy.mock.calls[0][1])
    expect(json.compared_to_feed_id).toBe('f0')
  })

  it('properties JSON does not include the event name key', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const events: AnalyticsEvent[] = [
      {
        event: 'catalog_quality_breakdown_viewed',
        retailer_id: 'r1',
        feed_id: 'f1',
        score_pct: 82,
      },
      {
        event: 'catalog_quality_product_clicked',
        retailer_id: 'r1',
        feed_id: 'f1',
        product_id: 'p1',
        failing_criteria: ['missing_image'],
      },
    ]
    events.forEach(e => track(e))
    expect(spy).toHaveBeenCalledTimes(2)
    for (let i = 0; i < 2; i++) {
      const json = JSON.parse(spy.mock.calls[i][1])
      expect(json).not.toHaveProperty('event')
    }
  })
})
