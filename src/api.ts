const RETAILER_ID = '703'

// --- REST: File Upload ---

export interface UploadResult {
  uploadId: string
  status: string
  totalRows: number
  validRows: number
  invalidRows: number
  rejectionReason: string | null
  diffId: string | null
  processedAt: string
}

export async function uploadFile(file: File, retailerId = RETAILER_ID): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('retailerId', retailerId)

  const resp = await fetch('/api/upload', { method: 'POST', body: form })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }))
    throw new Error(err.error || 'Upload failed')
  }
  return resp.json()
}

// --- GraphQL helper ---

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const resp = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await resp.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

// --- Typed GraphQL queries ---

export interface DiffData {
  feedDiff: {
    diffId: string
    addedCount: number
    removedCount: number
    changedCount: number
    unchangedCount: number
    qualityScore: number | null
    aiSummary: string | null
    categories: { id: string; label: string; severity: string; count: number }[]
  } | null
}

export async function fetchDiff(diffId: string, retailerId = RETAILER_ID): Promise<DiffData> {
  return gql(`
    query ($retailerId: ID!, $diffId: ID!) {
      feedDiff(retailerId: $retailerId, diffId: $diffId) {
        diffId addedCount removedCount changedCount unchangedCount
        qualityScore aiSummary
        categories { id label severity count }
      }
    }
  `, { retailerId, diffId })
}

export interface DiffItemData {
  scanCode: string | null
  productId: number | null
  productName: string | null
  changeType: string
  severity: string
  fieldChanges: { field: string; previous: string | null; current: string | null; isHighSeverity: boolean }[]
  isCatalogReady: boolean
  notReadyReasons: string[]
  changeSummary: string | null
}

export interface DiffItemsResult {
  feedDiffItems: {
    items: DiffItemData[]
    pagination: { page: number; perPage: number; total: number }
  }
}

export async function fetchDiffItems(
  diffId: string,
  opts?: { changeType?: string; severity?: string; page?: number; perPage?: number },
  retailerId = RETAILER_ID,
): Promise<DiffItemsResult> {
  return gql(`
    query ($retailerId: ID!, $diffId: ID!, $changeType: ChangeType, $severity: Severity, $page: Int, $perPage: Int) {
      feedDiffItems(retailerId: $retailerId, diffId: $diffId, changeType: $changeType, severity: $severity, page: $page, perPage: $perPage) {
        items {
          scanCode productId productName changeType severity changeSummary
          fieldChanges { field previous current isHighSeverity }
          isCatalogReady notReadyReasons
        }
        pagination { page perPage total }
      }
    }
  `, { retailerId, diffId, ...opts })
}

export interface QualityData {
  feedQuality: {
    current: {
      score: number
      catalogReadyCount: number
      totalCount: number
      notReadyCount: number
      breakdown: { field: string; count: number }[]
    } | null
    trend: { uploadId: string; score: number; computedAt: string }[]
  }
}

export async function fetchQuality(retailerId = RETAILER_ID): Promise<QualityData> {
  return gql(`
    query ($retailerId: ID!) {
      feedQuality(retailerId: $retailerId) {
        current { score catalogReadyCount totalCount notReadyCount breakdown { field count } }
        trend { uploadId score computedAt }
      }
    }
  `, { retailerId })
}

export interface AlertsData {
  feedAnomalyAlerts: {
    alerts: {
      alertId: string
      type: string
      category: string | null
      affectedCount: number
      affectedPct: number
      description: string | null
      isDismissible: boolean
    }[]
  }
}

export async function fetchAlerts(uploadId: string, retailerId = RETAILER_ID): Promise<AlertsData> {
  return gql(`
    query ($retailerId: ID!, $uploadId: ID!) {
      feedAnomalyAlerts(retailerId: $retailerId, uploadId: $uploadId) {
        alerts { alertId type category affectedCount affectedPct description isDismissible }
      }
    }
  `, { retailerId, uploadId })
}
