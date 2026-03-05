import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AnomalyAlerts from './AnomalyAlerts'

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
})
