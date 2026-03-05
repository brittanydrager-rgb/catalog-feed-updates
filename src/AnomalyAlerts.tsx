import { useState } from 'react'
import { ANOMALY_ALERTS, type AnomalyAlert } from './mockDiff'
import './AnomalyAlerts.css'

interface Props {
  onViewItems: (tabId: string) => void
}

/* ── Icon helpers ────────────────────────────────────────────────────── */

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

function AlertIcon({ type }: { type: AnomalyAlert['type'] }) {
  if (type === 'cost_unit_flip' || type === 'alcohol_flag_change') {
    return <CriticalCircleIcon />
  }
  return <WarningTriangleIcon />
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function AnomalyAlerts({ onViewItems }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visibleAlerts = ANOMALY_ALERTS.filter(a => !dismissed.has(a.id))

  if (visibleAlerts.length === 0) return null

  function handleDismiss(id: string) {
    setDismissed(prev => {
      const next = new Set(prev)
      next.add(id)
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
                onClick={() => onViewItems(alert.viewItemsTabId)}
              >
                View affected items
              </button>
            </p>
          </div>

          {canDismiss(alert) && (
            <button
              type="button"
              className="anomaly-alerts__dismiss"
              onClick={() => handleDismiss(alert.id)}
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
