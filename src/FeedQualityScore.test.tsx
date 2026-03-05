import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FeedQualityScore from './FeedQualityScore'

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
})
