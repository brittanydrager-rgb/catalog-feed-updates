import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AnomalyAlerts from './AnomalyAlerts'

// Suppress analytics console.log in tests
vi.spyOn(console, 'log').mockImplementation(() => {})

describe('AnomalyAlerts', () => {
  it('renders the "Produce" category from the bulk name change alert', () => {
    render(<AnomalyAlerts onViewItems={() => {}} />)
    expect(screen.getByText('Produce')).toBeInTheDocument()
  })

  it('renders "View affected items" links', () => {
    render(<AnomalyAlerts onViewItems={() => {}} />)
    const links = screen.getAllByText('View affected items')
    expect(links.length).toBeGreaterThan(0)
  })

  // ── Additional tests ──────────────────────────────────────────────────

  it('renders both alert categories (Produce and General)', () => {
    render(<AnomalyAlerts onViewItems={() => {}} />)
    expect(screen.getByText('Produce')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('dismiss button removes alert from DOM', () => {
    render(<AnomalyAlerts onViewItems={() => {}} />)
    // Both alerts should initially be visible
    expect(screen.getByText('Produce')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()

    // Click the first dismiss button
    const dismissButtons = screen.getAllByLabelText('Dismiss alert')
    expect(dismissButtons.length).toBeGreaterThan(0)
    fireEvent.click(dismissButtons[0])

    // One alert should be gone (Produce was the first one)
    // The remaining alerts should still be visible
    const remainingCards = screen.getAllByText('View affected items')
    expect(remainingCards.length).toBe(dismissButtons.length - 1)
  })

  it('"View affected items" calls onViewItems with correct tabId', () => {
    const onViewItems = vi.fn()
    render(<AnomalyAlerts onViewItems={onViewItems} />)

    const links = screen.getAllByText('View affected items')
    // Click the first "View affected items" — should be the Produce alert (viewItemsTabId = 'sellability')
    fireEvent.click(links[0])
    expect(onViewItems).toHaveBeenCalledTimes(1)
    expect(onViewItems).toHaveBeenCalledWith('sellability')

    // Click the second — should be the General alert (viewItemsTabId = 'uom')
    fireEvent.click(links[1])
    expect(onViewItems).toHaveBeenCalledTimes(2)
    expect(onViewItems).toHaveBeenCalledWith('uom')
  })

  it('renders alert descriptions', () => {
    render(<AnomalyAlerts onViewItems={() => {}} />)
    expect(screen.getByText(/40% of items in your Produce category/)).toBeInTheDocument()
    expect(screen.getByText(/2 items changed their sell-by unit/)).toBeInTheDocument()
  })

  it('dismissing all alerts hides the component', () => {
    const { container } = render(<AnomalyAlerts onViewItems={() => {}} />)
    // The component renders .anomaly-alerts wrapper
    expect(container.querySelector('.anomaly-alerts')).not.toBeNull()

    // Dismiss all dismissible alerts
    let dismissButtons = screen.queryAllByLabelText('Dismiss alert')
    while (dismissButtons.length > 0) {
      fireEvent.click(dismissButtons[0])
      dismissButtons = screen.queryAllByLabelText('Dismiss alert')
    }

    // Component should render null (no .anomaly-alerts)
    expect(container.querySelector('.anomaly-alerts')).toBeNull()
  })
})
