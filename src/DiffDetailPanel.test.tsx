import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@instacart/ids-core', () => ({
  MoonIcon: () => <div data-testid="moon-icon" />,
}))

import DiffDetailPanel from './DiffDetailPanel'

describe('DiffDetailPanel', () => {
  it('renders the "Inventory file summary" heading', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Completed with warnings"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Inventory file summary')).toBeInTheDocument()
  })

  it('renders the "AI summary" text', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Completed with warnings"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('AI summary')).toBeInTheDocument()
  })

  it('renders "Feed quality score" for non-rejected status', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Completed with warnings"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Feed quality score')).toBeInTheDocument()
  })

  it('does NOT render "Feed quality score" for rejected status', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Rejected"
        onClose={() => {}}
      />
    )
    expect(screen.queryByText('Feed quality score')).not.toBeInTheDocument()
  })
})
