import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FeedUpload from './FeedUpload'

describe('FeedUpload', () => {
  it('renders the upload prompt text', () => {
    render(<FeedUpload onComplete={() => {}} />)
    expect(screen.getByText('Upload your feed file to preview changes')).toBeInTheDocument()
  })

  it('renders the "browse files" text', () => {
    render(<FeedUpload onComplete={() => {}} />)
    expect(screen.getByText('browse files')).toBeInTheDocument()
  })
})
