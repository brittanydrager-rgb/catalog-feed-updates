import { MoonIcon } from '@instacart/ids-core'
import './Sidebar.css'

const NAV_ITEMS = [
  { label: 'Product search' },
  { label: 'Request new product' },
  { label: 'Image uploads' },
  { label: 'Configurable products' },
  { label: 'Brand explorer', isNew: true },
  { label: 'Inventory files', active: true },
  { label: 'Item anomaly reports' },
  { label: 'Missing codes' },
  { label: 'Low Price Alerts' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <MoonIcon size={32} color="systemGrayscale70" />
        <span className="sidebar__title">Catalog</span>
      </div>
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <button key={item.label} className={`sidebar__item ${item.active ? 'sidebar__item--active' : ''}`}>
            <span className="sidebar__item-text">{item.label}</span>
            {item.isNew && <span className="sidebar__item-badge">New</span>}
          </button>
        ))}
      </nav>
    </aside>
  )
}
