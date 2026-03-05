/**
 * Mock GraphQL client — typed async functions for each GraphQL operation.
 *
 * Each function calls the corresponding resolver and returns a typed result
 * wrapped in a short delay to simulate network latency.  This prepares for a
 * real Apollo Client integration post-hackathon: swap each function body to
 * use `client.query()` / `client.mutate()` and the call-sites stay the same.
 */

import {
  resolveFeedUploadStatus,
  resolveFeedValidation,
  resolveFeedMatches,
  resolveFeedDiff,
  resolveFeedDiffItems,
  resolveFeedQuality,
  resolveFeedAnomalyAlerts,
  resolveUploadFeed,
  resolveDismissAnomalyAlert,
  resolveCancelFeedUpload,
  resolveUpdateFeedColumnMappings,
} from './resolvers.ts'

// ---------------------------------------------------------------------------
// Simulated network delay (ms)
// ---------------------------------------------------------------------------

const MOCK_LATENCY_MS = 120

function delay(ms = MOCK_LATENCY_MS): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Response types (derived from resolver return types)
// ---------------------------------------------------------------------------

export type FeedUploadStatusResponse = ReturnType<typeof resolveFeedUploadStatus>
export type FeedValidationResponse = ReturnType<typeof resolveFeedValidation>
export type FeedMatchesResponse = ReturnType<typeof resolveFeedMatches>
export type FeedDiffResponse = ReturnType<typeof resolveFeedDiff>
export type FeedDiffItemsResponse = ReturnType<typeof resolveFeedDiffItems>
export type FeedQualityResponse = ReturnType<typeof resolveFeedQuality>
export type FeedAnomalyAlertsResponse = ReturnType<typeof resolveFeedAnomalyAlerts>
export type UploadFeedResponse = ReturnType<typeof resolveUploadFeed>
export type DismissAlertResponse = ReturnType<typeof resolveDismissAnomalyAlert>
export type CancelUploadResponse = ReturnType<typeof resolveCancelFeedUpload>
export type UpdateMappingsResponse = ReturnType<typeof resolveUpdateFeedColumnMappings>

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export async function fetchFeedUploadStatus(
  retailerId: string,
  uploadId: string,
): Promise<FeedUploadStatusResponse> {
  await delay()
  return resolveFeedUploadStatus(retailerId, uploadId)
}

export async function fetchFeedValidation(
  retailerId: string,
  uploadId: string,
): Promise<FeedValidationResponse> {
  await delay()
  return resolveFeedValidation(retailerId, uploadId)
}

export async function fetchFeedMatches(
  retailerId: string,
  uploadId: string,
): Promise<FeedMatchesResponse> {
  await delay()
  return resolveFeedMatches(retailerId, uploadId)
}

export async function fetchFeedDiff(
  retailerId: string,
  diffId: string,
): Promise<FeedDiffResponse> {
  await delay()
  return resolveFeedDiff(retailerId, diffId)
}

export async function fetchFeedDiffItems(
  retailerId: string,
  diffId: string,
  filters?: {
    changeType?: string
    severity?: string
    category?: string
    page?: number
    perPage?: number
  },
): Promise<FeedDiffItemsResponse> {
  await delay()
  return resolveFeedDiffItems(
    retailerId,
    diffId,
    filters?.changeType,
    filters?.severity,
    filters?.category,
    filters?.page,
    filters?.perPage,
  )
}

export async function fetchFeedQuality(
  retailerId: string,
): Promise<FeedQualityResponse> {
  await delay()
  return resolveFeedQuality(retailerId)
}

export async function fetchFeedAnomalyAlerts(
  retailerId: string,
  uploadId: string,
): Promise<FeedAnomalyAlertsResponse> {
  await delay()
  return resolveFeedAnomalyAlerts(retailerId, uploadId)
}

// ---------------------------------------------------------------------------
// Mutation functions
// ---------------------------------------------------------------------------

export async function mutateUploadFeed(
  retailerId: string,
  file: string,
): Promise<UploadFeedResponse> {
  await delay()
  return resolveUploadFeed(retailerId, file)
}

export async function mutateDismissAlert(
  retailerId: string,
  alertId: string,
): Promise<DismissAlertResponse> {
  await delay()
  return resolveDismissAnomalyAlert(retailerId, alertId)
}

export async function mutateCancelUpload(
  retailerId: string,
  uploadId: string,
): Promise<CancelUploadResponse> {
  await delay()
  return resolveCancelFeedUpload(retailerId, uploadId)
}

export async function mutateUpdateColumnMappings(
  retailerId: string,
  mappings: Array<{ sourceColumn: string; canonicalField: string; transformRule?: string }>,
): Promise<UpdateMappingsResponse> {
  await delay()
  return resolveUpdateFeedColumnMappings(retailerId, mappings)
}
