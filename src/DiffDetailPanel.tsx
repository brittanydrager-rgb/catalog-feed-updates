import { useState, useEffect } from 'react'
import { DIFF_CATEGORIES, DIFF_SUMMARY, FAILED_CATEGORIES, MISSING_FIELDS_SUMMARY, MISMATCH_SUMMARY, type DiffCategory } from './mockDiff'
import FeedQualityScore from './FeedQualityScore'
import AnomalyAlerts from './AnomalyAlerts'
import './DiffDetailPanel.css'

type FileStatus = 'Completed' | 'Completed with warnings' | 'Rejected' | 'Rejected - Mismatch'

interface Props {
  open: boolean
  activeTabId: string | null
  uploadedFile: string
  fileStatus?: FileStatus
  onClose: () => void
}

export default function DiffDetailPanel({ open, activeTabId, uploadedFile, fileStatus = 'Completed with warnings', onClose }: Props) {
  const isRejectedMissingFields = fileStatus === 'Rejected'
  const isRejectedMismatch      = fileStatus === 'Rejected - Mismatch'
  const isRejected              = isRejectedMissingFields || isRejectedMismatch

  const categories = isRejectedMissingFields
    ? FAILED_CATEGORIES.filter(c => c.id === 'missing-data')
    : isRejectedMismatch
    ? FAILED_CATEGORIES.filter(c => c.id === 'mismatch')
    : DIFF_CATEGORIES

  const [activeTab, setActiveTab] = useState<string>(categories[0].id)

  // Sync active tab when parent changes selection or status changes
  useEffect(() => {
    if (activeTabId) setActiveTab(activeTabId)
  }, [activeTabId])

  useEffect(() => {
    setActiveTab(categories[0].id)
  }, [fileStatus])

  if (!open) return null

  const currentCategory = categories.find(c => c.id === activeTab) ?? categories[0]
  const hasWarning = !isRejected && fileStatus === 'Completed with warnings'

  return (
    <>
      <div className="ddp-backdrop" onClick={onClose} />
      <aside className="ddp">

        {/* ── Header ───────────────────────────────── */}
        <div className="ddp__header">
          <div>
            <h2 className="ddp__title">Inventory file summary</h2>
            <p className="ddp__subtitle">
              Mar 5, 2026, 8:02AM:{' '}
              <span className="ddp__filename">{uploadedFile}</span>
            </p>
          </div>
          <button className="ddp__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="#343538" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────── */}
        <div className="ddp__body">

          {/* Stats */}
          <section>
            <h3 className="ddp__section-heading">
              {isRejectedMissingFields ? 'Rejection details: Missing fields'
                : isRejectedMismatch   ? 'Rejection details: Mismatch detected'
                : 'Summary of changes'}
            </h3>
            {isRejectedMissingFields ? (
              <div className="ddp__stats">
                <div className="ddp__stat">
                  <span className="ddp__stat-label">Items affected</span>
                  <span className="ddp__stat-value ddp__stat-value--error">{MISSING_FIELDS_SUMMARY.itemsAffected}</span>
                </div>
                <div className="ddp__stat">
                  <span className="ddp__stat-label">Fields missing</span>
                  <span className="ddp__stat-value ddp__stat-value--error">{MISSING_FIELDS_SUMMARY.fieldsMissing}</span>
                </div>
                <div className="ddp__stat">
                  <span className="ddp__stat-label">Validation errors</span>
                  <span className="ddp__stat-value ddp__stat-value--error">{MISSING_FIELDS_SUMMARY.validationErrors}</span>
                </div>
                <div className="ddp__stat">
                  <span className="ddp__stat-label">Rejection reason</span>
                  <span className="ddp__stat-value ddp__stat-value--error">Missing fields</span>
                </div>
              </div>
            ) : isRejectedMismatch ? (
              <div className="ddp__stats">
                <div className="ddp__stat">
                  <span className="ddp__stat-label">Items affected</span>
                  <span className="ddp__stat-value ddp__stat-value--error">{MISMATCH_SUMMARY.itemsAffected}</span>
                </div>
                <div className="ddp__stat">
                  <span className="ddp__stat-label">Conflicts detected</span>
                  <span className="ddp__stat-value ddp__stat-value--error">{MISMATCH_SUMMARY.conflictsDetected}</span>
                </div>
                <div className="ddp__stat">
                  <span className="ddp__stat-label">Rejection reason</span>
                  <span className="ddp__stat-value ddp__stat-value--error">Mismatch detected</span>
                </div>
              </div>
            ) : (
              <div className="ddp__stats">
                <div className="ddp__stat">
                  <span className="ddp__stat-label">Catalog quality issues</span>
                  <span className="ddp__stat-value ddp__stat-value--warn">{DIFF_SUMMARY.qualityIssues}</span>
                </div>
                <div className="ddp__stat">
                  <span className="ddp__stat-label">Price & promo updates</span>
                  <span className="ddp__stat-value">{DIFF_SUMMARY.pricePromoUpdates}</span>
                </div>
                <div className="ddp__stat">
                  <span className="ddp__stat-label">UoM & size changes</span>
                  <span className="ddp__stat-value ddp__stat-value--warn">{DIFF_SUMMARY.uomSizeChanges}</span>
                </div>
                <div className="ddp__stat">
                  <span className="ddp__stat-label">New items</span>
                  <span className="ddp__stat-value">{DIFF_SUMMARY.newItems}</span>
                </div>
              </div>
            )}
          </section>

          {/* AI Digest */}
          <section className="ddp__digest">
            <div className="ddp__digest-header">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="ddp__digest-icon">
                <path d="M8 1L9.5 5.5H14L10.5 8.5L12 13L8 10L4 13L5.5 8.5L2 5.5H6.5L8 1Z" fill="#7C3AED" opacity="0.9"/>
              </svg>
              <span className="ddp__digest-label">AI summary</span>
            </div>
            {isRejectedMissingFields ? (
              <p className="ddp__digest-text">
                This file was <strong>rejected because 4 items are missing required fields</strong>. Missing fields include{' '}
                <code>item_name</code>, <code>price</code>, <code>size</code>, <code>cost_unit</code>, and{' '}
                <code>available</code>. One item also has an <strong>invalid <code>lookup_code</code> format</strong>{' '}
                (scan code begins with <code>:</code>). <strong>No changes were applied</strong> — fix the
                missing fields below and re-upload.
              </p>
            ) : isRejectedMismatch ? (
              <p className="ddp__digest-text">
                This file was <strong>rejected because 3 items have values that conflict with Instacart's catalog</strong>.
                Mismatches include an item name discrepancy on Insta Carrot Kit, a brand and size conflict on Item D,
                and a size format inconsistency on Item G. <strong>No changes were applied</strong> — review the
                conflicts below, correct the feed values to match catalog data, and re-upload.
              </p>
            ) : (
              <p className="ddp__digest-text">
                Your March 5 feed was accepted with <strong>4 catalog quality issues</strong> to review.
                Two items are <strong>missing product images</strong> which reduces storefront visibility, and one item
                lost nutritional data. <strong>2 unit-of-measure changes</strong> were detected — a <code>lb</code> → <code>each</code>{' '}
                flip on Item D may affect weight-based pricing. <strong>5 price or promo updates</strong> were applied,
                including a new <code>percent_off</code> promotion on Insta Carrot Kit and a removed sale on Item G.
                <strong> 3 size descriptor changes</strong> and <strong>2 new items</strong> were also added.
              </p>
            )}
          </section>

          {/* Rejection error / Warnings */}
          {isRejected ? (
            <section>
              <div className="ddp__rejection">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ddp__warning-icon" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.5" stroke="#C5280C" strokeWidth="1.3"/>
                  <path d="M8 4.5V8.5" stroke="#C5280C" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="0.6" fill="#C5280C"/>
                </svg>
                <p className="ddp__warning-text">
                  {isRejectedMissingFields
                    ? <>This file was not uploaded. Fix the missing required fields below and <span className="ddp__warning-link">re-upload the file</span> to apply your changes.</>
                    : <>This file was not uploaded. Correct the mismatched values below to match catalog data and <span className="ddp__warning-link">re-upload the file</span>.</>
                  }
                </p>
              </div>
            </section>
          ) : hasWarning ? (
            <section>
              <div className="ddp__warning">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ddp__warning-icon" aria-hidden="true">
                  <path d="M8 2L14.5 13H1.5L8 2Z" stroke="#b87503" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M8 7V9.5" stroke="#b87503" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="0.6" fill="#b87503"/>
                </svg>
                <p className="ddp__warning-text">
                  Some products had missing information. We're using data from the previous file.{' '}
                  <span className="ddp__warning-link">Fix the data file</span> to prevent future problems.
                </p>
              </div>
            </section>
          ) : null}

          {/* Feed Quality Score — only for non-rejected statuses */}
          {!isRejected && (
            <section>
              <FeedQualityScore />
            </section>
          )}

          {/* Anomaly Alerts — only for non-rejected statuses */}
          {!isRejected && (
            <section>
              <AnomalyAlerts onViewItems={(tabId) => setActiveTab(tabId)} />
            </section>
          )}

          {/* Tabs */}
          <div className="ddp__tabs-wrap">
            <div className="ddp__tabs" role="tablist">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={activeTab === cat.id}
                  className={`ddp__tab ${activeTab === cat.id ? 'ddp__tab--active' : ''}`}
                  onClick={() => setActiveTab(cat.id)}
                >
                  {!isRejected && cat.severity && <SeverityIcon severity={cat.severity} />}
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>
            <div className="ddp__tabs-divider" />
          </div>

          {/* Tab content — item table */}
          <div className="ddp__tab-content">
            <ItemTable category={currentCategory} />
          </div>

        </div>
      </aside>
    </>
  )
}

// ── Severity icon for tabs ───────────────────────────────────────────────

function SeverityIcon({ severity }: { severity: 'critical' | 'warning' | 'info' }) {
  if (severity === 'critical') {
    return (
      <svg className="ddp__tab-icon ddp__tab-icon--critical" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-label="Critical" aria-hidden="true">
        <circle cx="7" cy="7" r="6" fill="#C5280C"/>
        <path d="M7 4V7.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="7" cy="9.5" r="0.7" fill="white"/>
      </svg>
    )
  }
  if (severity === 'warning') {
    return (
      <svg className="ddp__tab-icon ddp__tab-icon--warning" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-label="Review recommended" aria-hidden="true">
        <path d="M7 1.5L13 12H1L7 1.5Z" fill="#A06400"/>
        <path d="M7 6V8.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="7" cy="10" r="0.6" fill="white"/>
      </svg>
    )
  }
  return (
    <svg className="ddp__tab-icon ddp__tab-icon--info" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-label="Informational" aria-hidden="true">
      <circle cx="7" cy="7" r="6" fill="#56595E" opacity="0.3"/>
      <path d="M7 6.5V10" stroke="#56595E" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="7" cy="4.5" r="0.7" fill="#56595E"/>
    </svg>
  )
}

// ── Item table inside each tab ──────────────────────────────────────────

function ItemTable({ category }: { category: DiffCategory }) {
  if (category.items.length === 0) {
    return <p className="ddp__empty">No items in this category.</p>
  }

  const isMissingData  = category.id === 'missing-data'
  const isSellability  = category.id === 'sellability'
  const isPricePromo   = category.id === 'price-promo'
  const isUom          = category.id === 'uom'
  const isSize         = category.id === 'size'
  const isMismatch     = category.id === 'mismatch'
  const isAvailability = category.id === 'availability'

  return (
    <table className="ddp__item-table">
      <thead>
        <tr>
          <th>Item name</th>
          {(isMissingData || isSellability) && <th>Issues</th>}
          {isPricePromo && <th>Price</th>}
          {isPricePromo && <th>Promotion</th>}
          {isUom        && <th>Previous UoM</th>}
          {isUom        && <th>New UoM</th>}
          {isSize       && <th>Previous size</th>}
          {isSize       && <th>New size</th>}
          {isMismatch   && <th>Field</th>}
          {isMismatch   && <th>Your feed</th>}
          {isMismatch   && <th>Instacart catalog</th>}
          {isMismatch   && <th>Also update</th>}
          {isAvailability && <th>Previous</th>}
          {isAvailability && <th>New</th>}
          <th>UPC</th>
        </tr>
      </thead>
      <tbody>
        {category.items.map(item => {
          const missingFields  = item.changes?.filter(c => c.previous === '(empty)').map(c => c.field) ?? []
          const invalidFields  = item.changes?.filter(c => c.current === '(invalid format)').map(c => `${c.field}: invalid format`) ?? []
          const removedFields  = item.changes?.filter(c => c.previous !== '(empty)' && c.current === '(empty)').map(c => `${c.field}: removed`) ?? []
          const qualityIssues  = [...missingFields.map(f => `${f}: empty`), ...invalidFields, ...removedFields]

          const priceChange    = item.changes?.find(c => c.field === 'price')
          const promoType      = item.changes?.find(c => c.field === 'promotion_type')
          const promoStart     = item.changes?.find(c => c.field === 'promotion_start_date')
          const promoEnd       = item.changes?.find(c => c.field === 'promotion_end_date')

          const uomChange      = item.changes?.find(c => c.field === 'cost_unit')
          const sizeChange     = item.changes?.find(c => c.field === 'size')
          const availChange    = item.changes?.find(c => c.field === 'available')

          const promoSummary   = promoType
            ? promoType.current === '(removed)'
              ? <span className="ddp__promo-removed">Promotion removed</span>
              : <span className="ddp__promo-new">{promoType.current}{promoStart ? ` · ${promoStart.current}–${promoEnd?.current ?? ''}` : ''}</span>
            : <span className="ddp__neutral">—</span>

          return (
            <tr key={item.id}>
              <td className="ddp__item-name-cell">
                <div className="ddp__item-thumb" aria-hidden="true">
                  {item.productName.charAt(0).toUpperCase()}
                </div>
                <span className="ddp__item-name">{item.productName}</span>
              </td>

              {(isMissingData || isSellability) && (
                <td className="ddp__issue-cell">
                  {qualityIssues.length > 0 ? qualityIssues.join(' · ') : '—'}
                </td>
              )}

              {isPricePromo && (
                <td>
                  {priceChange
                    ? <><span className="ddp__price-prev">{priceChange.previous}</span>{' → '}<span className="ddp__price-new">{priceChange.current}</span></>
                    : <span className="ddp__neutral">—</span>}
                </td>
              )}
              {isPricePromo && <td>{promoSummary}</td>}

              {isUom && <td className="ddp__uom-prev">{uomChange?.previous ?? '—'}</td>}
              {isUom && <td className="ddp__uom-new">{uomChange?.current ?? '—'}</td>}

              {isSize && <td className="ddp__size-prev">{sizeChange?.previous ?? '—'}</td>}
              {isSize && <td className="ddp__size-new">{sizeChange?.current ?? '—'}</td>}

              {isMismatch && (
                <td className="ddp__issue-cell">
                  {item.changes?.map(c => c.field).join(', ') ?? '—'}
                </td>
              )}
              {isMismatch && (
                <td className="ddp__mismatch-feed">
                  {item.changes?.map(c => c.current).join(', ') ?? '—'}
                </td>
              )}
              {isMismatch && (
                <td className="ddp__mismatch-catalog">
                  {item.changes?.map(c => c.previous).join(', ') ?? '—'}
                </td>
              )}
              {isMismatch && (
                <td>
                  {item.suggestedFields && item.suggestedFields.length > 0 ? (
                    <ul className="ddp__suggested-fields">
                      {item.suggestedFields.map(s => (
                        <li key={s.field} className="ddp__suggested-field">
                          <code className="ddp__suggested-field-name">{s.field}</code>
                          <span className="ddp__suggested-field-reason">{s.reason}</span>
                        </li>
                      ))}
                    </ul>
                  ) : '—'}
                </td>
              )}

              {isAvailability && <td className="ddp__avail-prev">{availChange?.previous ?? '—'}</td>}
              {isAvailability && <td className="ddp__avail-new">{availChange?.current ?? '—'}</td>}

              <td className="ddp__upc-cell">{item.scanCode}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
