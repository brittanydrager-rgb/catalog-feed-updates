import { useState, useEffect, useRef } from 'react'
import { ANOMALY_ALERTS, type AnomalyAlert } from './mockDiff'
import { fetchAlerts } from './api'
import { track } from './analytics/events'
import './AnomalyAlerts.css'

interface Props {
  uploadId?: string
  onViewItems: (tabId: string) => void
}

// Map backend alert types to tab IDs for "View affected items"
function alertTypeToTabId(alertType: string): string {
  switch (alertType) {
    case 'bulk_name_change': return 'sellability'
    case 'cost_unit_flip': return 'uom'
    case 'bulk_price_change': return 'price-promo'
    case 'bulk_removal': return 'availability'
    case 'alcohol_flag_change': return 'sellability'
    default: return 'sellability'
  }
}

/* Icon helpers */

function WarningTriangleIcon() {
  return (
    <svg className="anomaly-alerts__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2L14.5 13H1.5L8 2Z" stroke="#A06400" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 7V9.5" stroke="#A06400" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.6" fill="#A06400" />
    </svg>
  )
}

function CriticalCircleIcon() {
  return (
    <svg className="anomaly-alerts__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="#C5280C" strokeWidth="1.3" />
      <path d="M8 4.5V8.5" stroke="#C5280C" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.6" fill="#C5280C" />
    </svg>
  )
}

function AlertIcon({ type }: { type: AnomalyAlert['type'] | string }) {
  if (type === 'cost_unit_flip' || type === 'alcohol_flag_change') {
    return <CriticalCircleIcon />
  }
  return <WarningTriangleIcon />
}

/* Component */

export default function AnomalyAlerts({ uploadId, onViewItems }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const hasTrackedViewed = useRef(false)

  // Real alerts from backend
  const [realAlerts, setRealAlerts] = useState<AnomalyAlert[] | null>(null)

  useEffect(() => {
    if (!uploadId) {
      setRealAlerts(null)
      return
    }

    let cancelled = false
    fetchAlerts(uploadId).then(result => {
      if (cancelled) return
      const mapped: AnomalyAlert[] = result.feedAnomalyAlerts.alerts.map(a => ({
        id: a.alertId,
        type: a.type as AnomalyAlert['type'],
        category: a.category ?? 'General',
        affectedCount: a.affectedCount,
        affectedPct: a.affectedPct,
        description: a.description ?? '',
        viewItemsTabId: alertTypeToTabId(a.type),
        isDismissible: a.isDismissible,
      }))
      setRealAlerts(mapped)
    }).catch(err => console.error('[AnomalyAlerts] fetch error:', err))

    return () => { cancelled = true }
  }, [uploadId])

  const alerts = realAlerts ?? ANOMALY_ALERTS
  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id))

  // Track alert_viewed on initial render
  useEffect(() => {
    if (!hasTrackedViewed.current && visibleAlerts.length > 0) {
      hasTrackedViewed.current = true
      visibleAlerts.forEach(alert => {
        track({
          event: 'catalog_anomaly_alert_viewed',
          retailer_id: 'mock-retailer',
          feed_id: uploadId ?? 'mock-feed',
          alert_type: alert.type,
          category: alert.category,
          affected_count: alert.affectedCount,
          affected_pct: alert.affectedPct,
        })
      })
    }
  }, [visibleAlerts.length])

  if (visibleAlerts.length === 0) return null

  function handleViewItems(alert: AnomalyAlert) {
    track({
      event: 'catalog_anomaly_alert_expanded',
      retailer_id: 'mock-retailer',
      feed_id: uploadId ?? 'mock-feed',
      alert_type: alert.type,
      category: alert.category,
    })
    onViewItems(alert.viewItemsTabId)
  }

  function handleDismiss(alert: AnomalyAlert) {
    track({
      event: 'catalog_anomaly_alert_dismissed',
      retailer_id: 'mock-retailer',
      feed_id: uploadId ?? 'mock-feed',
      alert_type: alert.type,
      category: alert.category,
    })
    setDismissed(prev => {
      const next = new Set(prev)
      next.add(alert.id)
      return next
    })
  }

  const canDismiss = (alert: AnomalyAlert): boolean =>
    alert.isDismissible && alert.type !== 'alcohol_flag_change'

  return (
    <div className="anomaly-alerts">
      {visibleAlerts.map(alert => (
        <div key={alert.id} className="anomaly-alerts__card">
          <AlertIcon type={alert.type} />

          <div className="anomaly-alerts__content">
            <p className="anomaly-alerts__category">{alert.category}</p>
            <p className="anomaly-alerts__description">
              {alert.description}{' '}
              <button
                type="button"
                className="anomaly-alerts__link"
                onClick={() => handleViewItems(alert)}
              >
                View affected items
              </button>
            </p>
          </div>

          {canDismiss(alert) && (
            <button
              type="button"
              className="anomaly-alerts__dismiss"
              onClick={() => handleDismiss(alert)}
              aria-label="Dismiss alert"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 3L3 9M3 3L9 9" stroke="#343538" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
