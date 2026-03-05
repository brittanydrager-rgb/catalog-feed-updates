import { useRef, useState } from 'react'
import FeedUpload from './FeedUpload'
import DiffDetailPanel from './DiffDetailPanel'
import './MainPage.css'

interface FileRow {
  date: string
  time: string
  banner: string
  area: string
  filename: string
  status: 'Completed' | 'Completed with warnings' | 'Rejected' | 'Rejected - Mismatch'
  items: string
  isNew?: boolean
}

const MOCK_FILES: FileRow[] = [
  { date: 'Mar 5, 2026',  time: '8:05 AM',  banner: 'The Garden',    area: 'Catalog_UAT CAT1',  filename: 'smoke_test_inventory_file_reinventory__version_1__2026-03-05_08-05-04.csv.gz', status: 'Completed with warnings', items: '10' },
  { date: 'Mar 5, 2026',  time: '8:02 AM',  banner: 'The Garden',    area: 'Catalog_UAT CAT2',  filename: 'smoke_test_inventory_file_feeda__version_1__2026-03-05_08-02-35.csv.gz',      status: 'Completed',              items: '12' },
  { date: 'Mar 5, 2026',  time: '7:55 AM',  banner: 'The Garden',    area: 'Catalog_UAT CAT2',  filename: 'smoke_test_inventory_file_feedb__version_1__2026-03-05_07-55-12.csv.gz',      status: 'Rejected - Mismatch',    items: '—' },
  { date: 'Mar 5, 2026',  time: '7:48 AM',  banner: 'The Garden',    area: 'Catalog_UAT CAT2',  filename: 'smoke_test_inventory_file_feedb__version_1__2026-03-05_07-48-51.csv.gz',      status: 'Rejected',               items: '—' },
  { date: 'Mar 5, 2026',  time: '7:47 AM',  banner: 'The Garden',    area: 'Catalog_UAT CAT2',  filename: 'smoke_test_inventory_file_feeda__version_1__2026-03-05_07-47-34.csv.gz',      status: 'Completed',              items: '2' },
  { date: 'Mar 5, 2026',  time: '7:35 AM',  banner: 'The Garden',    area: 'Catalog_UAT CAT1',  filename: 'smoke_test_inventory_file_reinventory__version_1__2026-03-05_07-35-04.csv.gz', status: 'Completed',              items: '10' },
  { date: 'Mar 5, 2026',  time: '7:32 AM',  banner: 'The Garden',    area: 'Catalog_UAT CAT2',  filename: 'smoke_test_inventory_file_feeda__version_1__2026-03-05_07-32-33.csv.gz',      status: 'Completed',              items: '2' },
]

const STATUS_TOOLTIPS: Record<FileRow['status'], string> = {
  'Completed': 'All items were uploaded and processed successfully.',
  'Completed with warnings': 'File uploaded, but some items had missing data. Previous values were used as a fallback.',
  'Rejected': 'File was not uploaded. One or more items are missing required fields. Fix the errors and re-upload.',
  'Rejected - Mismatch': 'File was not uploaded. Item values conflict with Instacart catalog data. Correct the mismatches and re-upload.',
}

function InfoIcon() {
  return (
    <svg className="inv-status__icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M6 5.5V8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="6" cy="3.75" r="0.6" fill="currentColor"/>
    </svg>
  )
}

function StatusBadge({ status }: { status: FileRow['status'] }) {
  const tooltip = STATUS_TOOLTIPS[status]
  if (status === 'Completed with warnings') {
    return (
      <span className="inv-status-wrap">
        <span className="inv-status inv-status--warnings">Completed with warnings<InfoIcon /></span>
        <span className="inv-status__tooltip">{tooltip}</span>
      </span>
    )
  }
  if (status === 'Rejected') {
    return (
      <span className="inv-status-wrap">
        <span className="inv-status inv-status--rejected">Rejected: Missing fields<InfoIcon /></span>
        <span className="inv-status__tooltip">{tooltip}</span>
      </span>
    )
  }
  if (status === 'Rejected - Mismatch') {
    return (
      <span className="inv-status-wrap">
        <span className="inv-status inv-status--rejected">Rejected: Mismatch detected<InfoIcon /></span>
        <span className="inv-status__tooltip">{tooltip}</span>
      </span>
    )
  }
  return (
    <span className="inv-status-wrap">
      <span className="inv-status inv-status--completed">Completed<InfoIcon /></span>
      <span className="inv-status__tooltip">{tooltip}</span>
    </span>
  )
}

export default function MainPage() {
  const uploadRef = useRef<{ trigger: () => void }>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState('')
  const [activeFileStatus, setActiveFileStatus] = useState<FileRow['status']>('Completed with warnings')
  const [files, setFiles] = useState<FileRow[]>(MOCK_FILES)

  function handleUploadComplete(filename: string) {
    const now = new Date()
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const newRow: FileRow = {
      date: 'Mar 5, 2026',
      time,
      banner: 'The Garden',
      area: 'Catalog_UAT CAT2',
      filename,
      status: 'Completed with warnings',
      items: '14',
      isNew: true,
    }
    setFiles(prev => [newRow, ...prev])
    setUploadedFile(filename)
    setActiveFileStatus('Completed with warnings')
    setPanelOpen(true)
  }

  function handleViewSummary(filename: string, status: FileRow['status']) {
    setUploadedFile(filename)
    setActiveFileStatus(status)
    setPanelOpen(true)
  }

  return (
    <div className="main-page">

      {/* ── Page header ───────────────────────────────────────── */}
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">View inventory files</h1>
          <p className="inv-page-desc">Upload and review catalog feed files to catch issues before they affect your storefront.</p>
        </div>
        <div className="inv-page-actions">
          <button className="inv-btn inv-btn--primary" onClick={() => uploadRef.current?.trigger()}>Upload file</button>
        </div>
      </div>

      <div className="main-page__content">

        {/* ── Upload zone ───────────────────────────────────────── */}
        <FeedUpload onComplete={handleUploadComplete} triggerRef={uploadRef} />

        {/* ── Filter bar ───────────────────────────────────────── */}
        <div className="inv-filters">
          <div className="inv-search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10ZM14 14l-2.5-2.5" stroke="#C8CACD" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input className="inv-search__input" placeholder="Search for name, date or inventory area" />
          </div>
          {['Last 7 days', 'All inventory areas'].map(label => (
            <button key={label} className="inv-filter-btn">
              {label}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#343538" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          ))}
        </div>

        {/* ── File table ───────────────────────────────────────── */}
        <table className="inv-table">
          <thead>
            <tr>
              <th style={{ width: 24 }} />
              <th>Last update</th>
              <th>Banner</th>
              <th>Inventory area</th>
              <th>File name</th>
              <th>Status</th>
              <th># of items</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {files.map((row, i) => (
              <tr key={i} className={row.isNew ? 'inv-table__row--new' : ''}>
                <td className="inv-table__chevron-cell">
                  {i === 0 && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="#717182" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </td>
                <td className="inv-table__date-cell">
                  <span className="inv-table__date">{row.date}</span>
                  <span className="inv-table__time">{row.time}</span>
                </td>
                <td>{row.banner}</td>
                <td><span className="inv-table__link">{row.area}</span></td>
                <td><span className="inv-table__link inv-table__filename">{row.filename}</span></td>
                <td><StatusBadge status={row.status} /></td>
                <td>{row.items}</td>
                <td>
                  <button
                    className="inv-btn inv-btn--outline inv-btn--sm"
                    onClick={() => handleViewSummary(row.filename, row.status)}
                  >
                    View summary
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DiffDetailPanel
        open={panelOpen}
        activeTabId={null}
        uploadedFile={uploadedFile}
        fileStatus={activeFileStatus}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  )
}
