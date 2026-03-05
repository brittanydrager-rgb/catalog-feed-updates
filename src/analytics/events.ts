// ── Event type definitions ────────────────────────────────────────────────

export interface CatalogDiffPageViewed {
  event: 'catalog_diff_page_viewed'
  retailer_id: string
  feed_id: string
  feed_date: string
  total_added: number
  total_removed: number
  total_changed: number
}

export interface CatalogDiffProductExpanded {
  event: 'catalog_diff_product_expanded'
  retailer_id: string
  feed_id: string
  product_id: string
  scan_code: string
  change_types: string[]
}

export interface CatalogDiffFilterApplied {
  event: 'catalog_diff_filter_applied'
  retailer_id: string
  feed_id: string
  filter_type: string
}

export interface CatalogDiffFeedCompared {
  event: 'catalog_diff_feed_compared'
  retailer_id: string
  feed_id: string
  compared_to_feed_id: string
}

export interface CatalogAnomalyAlertViewed {
  event: 'catalog_anomaly_alert_viewed'
  retailer_id: string
  feed_id: string
  alert_type: string
  category: string
  affected_count: number
  affected_pct: number
}

export interface CatalogAnomalyAlertExpanded {
  event: 'catalog_anomaly_alert_expanded'
  retailer_id: string
  feed_id: string
  alert_type: string
  category: string
}

export interface CatalogAnomalyAlertDismissed {
  event: 'catalog_anomaly_alert_dismissed'
  retailer_id: string
  feed_id: string
  alert_type: string
  category: string
}

export interface CatalogQualityScoreViewed {
  event: 'catalog_quality_score_viewed'
  retailer_id: string
  feed_id: string
  score_pct: number
  catalog_ready_count: number
  total_count: number
  not_ready_count: number
}

export interface CatalogQualityBreakdownViewed {
  event: 'catalog_quality_breakdown_viewed'
  retailer_id: string
  feed_id: string
  score_pct: number
}

export interface CatalogQualityProductClicked {
  event: 'catalog_quality_product_clicked'
  retailer_id: string
  feed_id: string
  product_id: string
  failing_criteria: string[]
}

export interface CatalogQualityTrendViewed {
  event: 'catalog_quality_trend_viewed'
  retailer_id: string
  feed_id: string
  trend_direction: 'up' | 'down' | 'flat'
}

export type AnalyticsEvent =
  | CatalogDiffPageViewed
  | CatalogDiffProductExpanded
  | CatalogDiffFilterApplied
  | CatalogDiffFeedCompared
  | CatalogAnomalyAlertViewed
  | CatalogAnomalyAlertExpanded
  | CatalogAnomalyAlertDismissed
  | CatalogQualityScoreViewed
  | CatalogQualityBreakdownViewed
  | CatalogQualityProductClicked
  | CatalogQualityTrendViewed

// ── Tracking function ────────────────────────────────────────────────────

/**
 * Logs analytics events to the console in a structured format.
 * In production this would send to an analytics backend.
 */
export function track<E extends AnalyticsEvent>(event: E): void {
  const { event: eventName, ...properties } = event
  console.log(
    `[Analytics] ${eventName}`,
    JSON.stringify(properties, null, 2),
  )
}
