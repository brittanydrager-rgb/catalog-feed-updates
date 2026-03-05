import './TopNav.css'

const NAV_BG = '#003D29'
const NAV_BG_HOVER = '#0A5546'

const NAV_TABS = ['Analytics', 'Catalog', 'Merchandising', 'Marketing', 'Operations', 'Developer']
const ACTIVE_TAB = 'Catalog'

export default function TopNav() {
  return (
    <nav className="top-nav" style={{ backgroundColor: NAV_BG }}>
      <img src="/ic-platform.svg" alt="Instacart Platform" className="top-nav__logo" />

      <div className="top-nav__tabs">
        {NAV_TABS.map((tab) => (
          <button
            key={tab}
            className={`top-nav__tab ${tab === ACTIVE_TAB ? 'top-nav__tab--active' : ''}`}
            style={{ '--hover-bg': NAV_BG_HOVER } as React.CSSProperties}
          >
            <div className={`top-nav__tab-inner ${tab === ACTIVE_TAB ? 'top-nav__tab-inner--underlined' : ''}`}>
              {tab}
            </div>
          </button>
        ))}
      </div>

      <div className="top-nav__actions">
        <button className="top-nav__icon-btn" aria-label="Search" style={{ '--hover-bg': NAV_BG_HOVER } as React.CSSProperties}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M10.5 3C6.36 3 3 6.36 3 10.5C3 14.64 6.36 18 10.5 18C12.28 18 13.91 17.39 15.2 16.37L19.41 20.59L20.59 19.41L16.37 15.2C17.39 13.91 18 12.28 18 10.5C18 6.36 14.64 3 10.5 3ZM10.5 5C13.54 5 16 7.46 16 10.5C16 13.54 13.54 16 10.5 16C7.46 16 5 13.54 5 10.5C5 7.46 7.46 5 10.5 5Z" fill="white"/></svg>
        </button>
        <button className="top-nav__icon-btn" aria-label="Notifications" style={{ '--hover-bg': NAV_BG_HOVER } as React.CSSProperties}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="white"/></svg>
        </button>
        <button className="top-nav__icon-btn" aria-label="Help" style={{ '--hover-bg': NAV_BG_HOVER } as React.CSSProperties}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z" fill="white"/></svg>
        </button>
        <button className="top-nav__user-menu" style={{ '--hover-bg': NAV_BG_HOVER } as React.CSSProperties}>
          <div className="top-nav__retailer-avatar">TG</div>
          <span className="top-nav__user-label">The Garden</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </nav>
  )
}
