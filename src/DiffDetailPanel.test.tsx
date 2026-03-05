import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@instacart/ids-core', () => ({
  MoonIcon: () => <div data-testid="moon-icon" />,
}))

// Suppress analytics console.log in tests
vi.spyOn(console, 'log').mockImplementation(() => {})

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

  // ── Additional tests ──────────────────────────────────────────────────

  it('renders "Summary of changes" heading for "Completed" status', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Completed"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Summary of changes')).toBeInTheDocument()
  })

  it('renders "Summary of changes" heading for "Completed with warnings" status', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Completed with warnings"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Summary of changes')).toBeInTheDocument()
  })

  it('renders "Rejection details: Missing fields" for "Rejected" status', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Rejected"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Rejection details: Missing fields')).toBeInTheDocument()
  })

  it('renders rejection stats for "Rejected" status', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Rejected"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Items affected')).toBeInTheDocument()
    expect(screen.getByText('Fields missing')).toBeInTheDocument()
    expect(screen.getByText('Validation errors')).toBeInTheDocument()
    expect(screen.getByText('Missing fields')).toBeInTheDocument()
  })

  it('renders "Rejection details: Mismatch detected" for "Rejected - Mismatch" status', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Rejected - Mismatch"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Rejection details: Mismatch detected')).toBeInTheDocument()
  })

  it('renders mismatch stats for "Rejected - Mismatch" status', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Rejected - Mismatch"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Items affected')).toBeInTheDocument()
    expect(screen.getByText('Conflicts detected')).toBeInTheDocument()
    expect(screen.getByText('Mismatch detected')).toBeInTheDocument()
  })

  it('does NOT render "Feed quality score" for "Rejected - Mismatch" status', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Rejected - Mismatch"
        onClose={() => {}}
      />
    )
    expect(screen.queryByText('Feed quality score')).not.toBeInTheDocument()
  })

  it('renders warning banner for "Completed with warnings"', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Completed with warnings"
        onClose={() => {}}
      />
    )
    expect(screen.getByText(/Some products had missing information/)).toBeInTheDocument()
  })

  it('does NOT render warning banner for "Completed"', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Completed"
        onClose={() => {}}
      />
    )
    expect(screen.queryByText(/Some products had missing information/)).not.toBeInTheDocument()
  })

  it('renders rejection error banner for "Rejected"', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Rejected"
        onClose={() => {}}
      />
    )
    expect(screen.getByText(/This file was not uploaded/)).toBeInTheDocument()
  })

  it('renders rejection error banner for "Rejected - Mismatch"', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Rejected - Mismatch"
        onClose={() => {}}
      />
    )
    expect(screen.getByText(/This file was not uploaded/)).toBeInTheDocument()
  })

  it('close button calls onClose when clicked', () => {
    const onClose = vi.fn()
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Completed with warnings"
        onClose={onClose}
      />
    )
    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking backdrop calls onClose', () => {
    const onClose = vi.fn()
    const { container } = render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Completed with warnings"
        onClose={onClose}
      />
    )
    const backdrop = container.querySelector('.ddp-backdrop')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('tab clicks change the active tab content', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Completed with warnings"
        onClose={() => {}}
      />
    )
    // The tabs should be rendered as role="tab"
    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBeGreaterThan(1)

    // Click a different tab
    const secondTab = tabs[1]
    fireEvent.click(secondTab)
    expect(secondTab.getAttribute('aria-selected')).toBe('true')
  })

  it('returns null when open is false', () => {
    const { container } = render(
      <DiffDetailPanel
        open={false}
        activeTabId={null}
        uploadedFile="test.csv"
        fileStatus="Completed with warnings"
        onClose={() => {}}
      />
    )
    expect(container.querySelector('.ddp')).toBeNull()
  })

  it('displays the uploaded file name', () => {
    render(
      <DiffDetailPanel
        open={true}
        activeTabId={null}
        uploadedFile="my_inventory.csv"
        fileStatus="Completed"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('my_inventory.csv')).toBeInTheDocument()
  })
})
