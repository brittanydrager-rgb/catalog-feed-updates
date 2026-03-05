import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@instacart/ids-core', () => ({
  MoonIcon: () => <div data-testid="moon-icon" />,
}))

import App from './App'

describe('App', () => {
  it('renders the page title "View inventory files"', () => {
    render(<App />)
    expect(screen.getByText('View inventory files')).toBeInTheDocument()
  })

  it('renders the "Catalog" sidebar text', () => {
    render(<App />)
    expect(screen.getByText('Catalog', { selector: '.sidebar__title' })).toBeInTheDocument()
  })
})
