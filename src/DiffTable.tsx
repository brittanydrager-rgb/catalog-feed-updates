import { useState } from 'react'
import { DIFF_CATEGORIES, type DiffCategory } from './mockDiff'
import DiffDetailPanel from './DiffDetailPanel'
import './DiffTable.css'

interface Props {
  uploadedFile: string
}

export default function DiffTable({ uploadedFile }: Props) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  function handleRowClick(cat: DiffCategory) {
    if (panelOpen && activeTabId === cat.id) {
      setPanelOpen(false)
      setActiveTabId(null)
    } else {
      setActiveTabId(cat.id)
      setPanelOpen(true)
    }
  }

  return (
    <>
      <div className="diff-table">
        {/* Summary bar */}
        <div className="diff-table__summary">
          <span className="diff-table__total">{DIFF_CATEGORIES.reduce((n, c) => n + c.count, 0)} changes detected</span>
          <span className="diff-table__dot">·</span>
          <span className="diff-table__added-count">+{DIFF_CATEGORIES.filter(c => c.changeType === 'added').reduce((n, c) => n + c.count, 0)} added</span>
          <span className="diff-table__dot">·</span>
          <span className="diff-table__removed-count">−{DIFF_CATEGORIES.filter(c => c.changeType === 'removed').reduce((n, c) => n + c.count, 0)} removed</span>
          <span className="diff-table__dot">·</span>
          <span className="diff-table__changed-count">{DIFF_CATEGORIES.filter(c => c.changeType === 'changed').reduce((n, c) => n + c.count, 0)} updated</span>
        </div>

        {/* Category table */}
        <div className="diff-table__table-wrap">
          <table className="diff-table__table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th style={{ width: 80, textAlign: 'right' }}># Items</th>
                <th style={{ width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {DIFF_CATEGORIES.map(cat => (
                <tr
                  key={cat.id}
                  className={`diff-table__row diff-table__row--${cat.changeType} ${cat.highSeverity ? 'diff-table__row--high-severity' : ''} ${panelOpen && activeTabId === cat.id ? 'diff-table__row--selected' : ''}`}
                  onClick={() => handleRowClick(cat)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="diff-table__badges">
                      {cat.highSeverity && (
                        <span className="diff-table__badge diff-table__badge--review">⚠ Review</span>
                      )}
                      <span className={`diff-table__badge diff-table__badge--${cat.changeType}`}>
                        {cat.changeType === 'added' ? 'Added'
                          : cat.changeType === 'removed' ? 'Removed'
                          : 'Changed'}
                      </span>
                      <span className="diff-table__category-label">{cat.label}</span>
                    </div>
                  </td>
                  <td className="diff-table__description">{cat.description}</td>
                  <td className="diff-table__item-count">{cat.count} item{cat.count !== 1 ? 's' : ''}</td>
                  <td className="diff-table__chevron-cell">
                    <svg
                      className={`diff-table__chevron ${panelOpen && activeTabId === cat.id ? 'diff-table__chevron--open' : ''}`}
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                    >
                      <path d="M6 4L10 8L6 12" stroke="#56595E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DiffDetailPanel
        open={panelOpen}
        activeTabId={activeTabId}
        uploadedFile={uploadedFile}
        onClose={() => { setPanelOpen(false); setActiveTabId(null) }}
      />
    </>
  )
}
