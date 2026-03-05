export const typeDefs = `#graphql
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

  enum UploadStatus {
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

  type FeedUploadStatus {
    uploadId: ID!
    status: String!
    totalRows: Int
    validRows: Int
    invalidRows: Int
    rejectionReason: String
    processedAt: String
    fileName: String
    fileFormat: String
    fileSizeBytes: Int
    uploadedAt: String
  }

  type ValidationSummary {
    totalItems: Int!
    valid: Int!
    invalid: Int!
    blockingErrors: Int!
  }

  type Violation {
    itemId: ID!
    rowNumber: Int
    field: String!
    rule: String!
    message: String!
    severity: String!
  }

  type FeedValidation {
    status: String!
    summary: ValidationSummary!
    violations: [Violation!]!
  }

  type AlternativeMatch {
    productId: Int
    score: Float
  }

  type MatchItem {
    scanCode: String
    codeType: String
    productId: Int
    matchMethod: String
    confidence: Float
    alternatives: [AlternativeMatch!]
    isDuplicate: Boolean
  }

  type FeedMatches {
    matchedCount: Int!
    unmatchedCount: Int!
    items: [MatchItem!]!
  }

  type DiffCategory {
    id: String!
    label: String!
    severity: String!
    count: Int!
  }

  type FeedDiff {
    diffId: ID!
    uploadId: ID!
    previousUploadId: ID
    addedCount: Int!
    removedCount: Int!
    changedCount: Int!
    unchangedCount: Int!
    qualityScore: Int
    aiSummary: String
    categories: [DiffCategory!]!
  }

  type FieldChange {
    field: String!
    previous: String
    current: String
    isHighSeverity: Boolean!
  }

  type DiffItem {
    scanCode: String
    productId: Int
    productName: String
    changeType: String!
    severity: String!
    fieldChanges: [FieldChange!]!
    isCatalogReady: Boolean!
    notReadyReasons: [String!]!
    changeSummary: String
  }

  type Pagination {
    page: Int!
    perPage: Int!
    total: Int!
  }

  type FeedDiffItems {
    items: [DiffItem!]!
    pagination: Pagination!
  }

  type QualityBreakdown {
    field: String!
    count: Int!
  }

  type QualityScore {
    score: Int!
    catalogReadyCount: Int!
    totalCount: Int!
    notReadyCount: Int!
    breakdown: [QualityBreakdown!]!
  }

  type QualityTrend {
    uploadId: ID!
    score: Int!
    computedAt: String!
  }

  type FeedQuality {
    current: QualityScore
    trend: [QualityTrend!]!
  }

  type AnomalyAlert {
    alertId: ID!
    type: String!
    category: String
    affectedCount: Int!
    affectedPct: Float!
    description: String
    isDismissible: Boolean!
  }

  type FeedAnomalyAlerts {
    alerts: [AnomalyAlert!]!
  }

  type DismissResult {
    dismissedAt: String!
  }

  type CancelResult {
    uploadId: ID!
    status: String!
  }

  type ColumnMapping {
    mappingId: ID!
    sourceColumn: String!
    canonicalField: String!
    transformRule: String
  }

  input ColumnMappingInput {
    sourceColumn: String!
    canonicalField: String!
    transformRule: String
  }

  type Query {
    feedUploadStatus(retailerId: ID!, uploadId: ID!): FeedUploadStatus
    feedValidation(retailerId: ID!, uploadId: ID!): FeedValidation
    feedMatches(retailerId: ID!, uploadId: ID!): FeedMatches
    feedDiff(retailerId: ID!, diffId: ID!): FeedDiff
    feedDiffItems(
      retailerId: ID!
      diffId: ID!
      changeType: ChangeType
      severity: Severity
      category: String
      page: Int
      perPage: Int
    ): FeedDiffItems
    feedQuality(retailerId: ID!): FeedQuality
    feedAnomalyAlerts(retailerId: ID!, uploadId: ID!): FeedAnomalyAlerts
    feedColumnMappings(retailerId: ID!): [ColumnMapping!]!
  }

  type Mutation {
    dismissAnomalyAlert(retailerId: ID!, alertId: ID!): DismissResult
    cancelFeedUpload(retailerId: ID!, uploadId: ID!): CancelResult
    updateFeedColumnMappings(retailerId: ID!, mappings: [ColumnMappingInput!]!): [ColumnMapping!]!
  }
`
