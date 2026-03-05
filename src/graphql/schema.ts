/**
 * GraphQL type definition strings for the Feed Validation & PLS Simulation API.
 *
 * These mirror the backend design doc (docs/backend-design.md) and will be
 * used with a real Apollo Client integration post-hackathon.  For now the
 * mock client in mockClient.ts calls resolvers directly.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const ENUM_TYPES = /* GraphQL */ `
  enum FeedUploadStatus {
    pending
    parsing
    validating
    matching
    computing_diff
    completed
    completed_with_warnings
    rejected_missing_fields
    rejected_mismatch
    failed
  }

  enum ChangeType {
    added
    removed
    changed
    unchanged
  }

  enum Severity {
    critical
    warning
    info
  }

  enum CodeType {
    UPC
    RRC
    PLU
    SKU
    EXTERNAL_INTEGRATION_ID
  }

  enum AnomalyAlertType {
    bulk_name_change
    bulk_removal
    bulk_price_change
    alcohol_flag_change
    cost_unit_flip
  }
`

// ---------------------------------------------------------------------------
// Object types
// ---------------------------------------------------------------------------

export const OBJECT_TYPES = /* GraphQL */ `
  type FeedUploadStatusResult {
    uploadId: ID!
    status: FeedUploadStatus!
    totalRows: Int
    validRows: Int
    invalidRows: Int
    rejectionReason: String
    processedAt: String
  }

  type ValidationViolation {
    itemId: ID!
    rowNumber: Int!
    field: String!
    rule: String!
    message: String!
    severity: Severity!
  }

  type ValidationSummary {
    totalItems: Int!
    valid: Int!
    invalid: Int!
    blockingErrors: Int!
  }

  type FeedValidationResult {
    status: FeedUploadStatus!
    summary: ValidationSummary!
    violations: [ValidationViolation!]!
  }

  type MatchItem {
    scanCode: String!
    codeType: CodeType!
    productId: Int
    matchMethod: String
    confidence: Float
    alternatives: [AlternativeMatch!]
    isDuplicate: Boolean!
  }

  type AlternativeMatch {
    productId: Int!
    score: Float!
  }

  type FeedMatchesResult {
    matchedCount: Int!
    unmatchedCount: Int!
    items: [MatchItem!]!
  }

  type DiffCategory {
    id: ID!
    label: String!
    severity: Severity
    count: Int!
  }

  type FeedDiffResult {
    diffId: ID!
    uploadId: ID!
    previousUploadId: ID
    addedCount: Int!
    removedCount: Int!
    changedCount: Int!
    unchangedCount: Int!
    qualityScore: Int!
    aiSummary: String
    categories: [DiffCategory!]!
  }

  type FieldChange {
    field: String!
    previous: String!
    current: String!
    isHighSeverity: Boolean
  }

  type DiffItem {
    scanCode: String!
    productId: Int
    productName: String!
    changeType: ChangeType!
    severity: Severity!
    fieldChanges: [FieldChange!]
    isCatalogReady: Boolean!
    notReadyReasons: [String!]
  }

  type Pagination {
    page: Int!
    perPage: Int!
    total: Int!
  }

  type FeedDiffItemsResult {
    items: [DiffItem!]!
    pagination: Pagination!
  }

  type QualityBreakdownEntry {
    field: String!
    count: Int!
  }

  type QualityCurrent {
    score: Int!
    catalogReadyCount: Int!
    totalCount: Int!
    notReadyCount: Int!
    breakdown: [QualityBreakdownEntry!]!
  }

  type QualityTrendPoint {
    uploadId: ID!
    score: Int!
    computedAt: String!
  }

  type FeedQualityResult {
    current: QualityCurrent!
    trend: [QualityTrendPoint!]!
  }

  type AnomalyAlert {
    alertId: ID!
    type: AnomalyAlertType!
    category: String!
    affectedCount: Int!
    affectedPct: Float!
    description: String!
    isDismissible: Boolean!
    dismissedAt: String
  }

  type FeedAnomalyAlertsResult {
    alerts: [AnomalyAlert!]!
  }

  type ColumnMapping {
    sourceColumn: String!
    canonicalField: String!
    transformRule: String
  }

  type UploadFeedResult {
    uploadId: ID!
    status: FeedUploadStatus!
  }

  type DismissAlertResult {
    dismissedAt: String!
  }

  type CancelUploadResult {
    uploadId: ID!
    status: FeedUploadStatus!
  }

  type UpdateMappingsResult {
    mappings: [ColumnMapping!]!
  }
`

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const QUERY_TYPES = /* GraphQL */ `
  type Query {
    feedUploadStatus(retailerId: ID!, uploadId: ID!): FeedUploadStatusResult!
    feedValidation(retailerId: ID!, uploadId: ID!): FeedValidationResult!
    feedMatches(retailerId: ID!, uploadId: ID!): FeedMatchesResult!
    feedDiff(retailerId: ID!, diffId: ID!): FeedDiffResult!
    feedDiffItems(
      retailerId: ID!
      diffId: ID!
      changeType: ChangeType
      severity: Severity
      category: String
      page: Int
      perPage: Int
    ): FeedDiffItemsResult!
    feedQuality(retailerId: ID!): FeedQualityResult!
    feedAnomalyAlerts(retailerId: ID!, uploadId: ID!): FeedAnomalyAlertsResult!
  }
`

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const MUTATION_TYPES = /* GraphQL */ `
  type Mutation {
    uploadFeed(retailerId: ID!, file: String!): UploadFeedResult!
    dismissAnomalyAlert(retailerId: ID!, alertId: ID!): DismissAlertResult!
    cancelFeedUpload(retailerId: ID!, uploadId: ID!): CancelUploadResult!
    updateFeedColumnMappings(
      retailerId: ID!
      mappings: [ColumnMappingInput!]!
    ): UpdateMappingsResult!
  }

  input ColumnMappingInput {
    sourceColumn: String!
    canonicalField: String!
    transformRule: String
  }
`

// ---------------------------------------------------------------------------
// Full schema (convenience export)
// ---------------------------------------------------------------------------

export const FULL_SCHEMA = [
  ENUM_TYPES,
  OBJECT_TYPES,
  QUERY_TYPES,
  MUTATION_TYPES,
].join('\n')
