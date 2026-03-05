import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FeedQualityScore from './FeedQualityScore'

// Suppress analytics console.log in tests
vi.spyOn(console, 'log').mockImplementation(() => {})

describe('FeedQualityScore', () => {
  it('renders the score percentage', () => {
    render(<FeedQualityScore />)
    expect(screen.getByText('82%')).toBeInTheDocument()
  })

  it('renders the "catalog-ready" label', () => {
    render(<FeedQualityScore />)
    expect(screen.getByText('catalog-ready')).toBeInTheDocument()
  })

  it('renders the catalog-ready product count', () => {
    render(<FeedQualityScore />)
    expect(screen.getByText('410 / 500 products are catalog-ready')).toBeInTheDocument()
  })

  // ── Additional tests ──────────────────────────────────────────────────

  it('shows "90 products need attention" in the breakdown', () => {
    render(<FeedQualityScore />)
    expect(screen.getByText('90 products need attention')).toBeInTheDocument()
  })

  it('shows field counts like "25 missing scan code" in the breakdown', () => {
    render(<FeedQualityScore />)
    // The breakdown renders as a joined string
    expect(screen.getByText(/25 missing scan code/)).toBeInTheDocument()
    expect(screen.getByText(/18 missing brand name/)).toBeInTheDocument()
  })

  it('renders the sparkline SVG', () => {
    const { container } = render(<FeedQualityScore />)
    const sparkline = container.querySelector('.quality-score__sparkline')
    expect(sparkline).not.toBeNull()
    expect(sparkline!.tagName.toLowerCase()).toBe('svg')
  })

  it('sparkline has a polyline element for the trend line', () => {
    const { container } = render(<FeedQualityScore />)
    const polyline = container.querySelector('.quality-score__sparkline polyline')
    expect(polyline).not.toBeNull()
  })

  it('sparkline has an endpoint circle', () => {
    const { container } = render(<FeedQualityScore />)
    const circle = container.querySelector('.quality-score__sparkline circle')
    expect(circle).not.toBeNull()
  })

  it('renders the "Feed quality score" heading', () => {
    render(<FeedQualityScore />)
    expect(screen.getByText('Feed quality score')).toBeInTheDocument()
  })

  it('does not show "Perfect score!" for 82%', () => {
    render(<FeedQualityScore />)
    expect(screen.queryByText('Perfect score!')).not.toBeInTheDocument()
  })

  it('does not show low-score CTA for 82%', () => {
    render(<FeedQualityScore />)
    expect(screen.queryByText(/Contact your TAM/)).not.toBeInTheDocument()
  })
})
