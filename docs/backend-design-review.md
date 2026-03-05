# Backend Design Review: Feed Validation & PLS Simulation

Reviewed `docs/backend-design.md` — here's the tldr and detailed feedback.

---

## tldr

Really solid design for a hackathon. The async 5-phase pipeline makes sense, the data model is well thought out, and the PLS integration details are thorough. The main things to tighten up before this goes further:

1. **Synchronous API for the hackathon, Temporal for production** — keep it simple for now with a sync request/response flow, but plan for Temporal workflows when we roll this out for real
2. **GraphQL, not REST** — the IPP frontend is all Apollo/GraphQL, so REST endpoints would be a mismatch
3. **Add indexes** — the diff join on `feed_snapshot_items.scan_code` will be a full table scan without one
4. **Keep recent snapshots instead of overwriting** — avoids the "corrupted feed wipes the baseline" problem
5. **Auto-cleanup for old simulations** — anything older than 30 days should get swept automatically

---

## What works well

- The async pipeline with status polling is the right pattern for ~34s jobs. The 5-phase breakdown is clean and easy to follow.
- Smart to reuse existing IPP infra (BFF, job framework, DB, S3, PLS) instead of spinning up a new service. Way less operational overhead for v1.
- Decision gates between phases are a nice touch — no point burning PLS calls on data that already failed validation.
- JSONB for variable-schema fields (`raw_row`, `field_changes`, `transform_rule`) is the right call. Keeps the schema simple without losing flexibility.
- Storing `pls_response_raw` for debugging — really helpful when things go wrong.
- The sequence diagram and processing time estimates are credible and useful.

---

## Things to address

### Synchronous for hackathon, Temporal for production

For the hackathon, let's keep it simple: make the validation pipeline a synchronous API call. The client uploads a file, the server runs all 5 phases inline, and returns the result in the response. With mock data and small feeds this will be fast enough, and it avoids the complexity of setting up async job infrastructure, status polling, and worker orchestration just for a demo.

For production rollout, we should switch to Temporal workflows. The pipeline has 5 sequential phases, and at real scale (100k+ SKUs, ~34s processing), we need:
- Phase-level checkpointing — if the worker crashes after PLS matching (the most expensive step), we can resume from Phase 4 instead of re-running everything
- Built-in retry with backoff per activity
- Durable state and workflow-level dedup — avoids the double-insert problem if a job gets retried (e.g., `feed_items` and `pls_match_results` would get duplicate rows without idempotency guards)

The sync-to-async migration path is clean: extract each phase into a Temporal activity, wrap them in a workflow, and swap the API from sync response to "return upload_id + poll status." The phase logic itself doesn't change.

### GraphQL instead of REST

The existing IPP frontend (`retailer-platform-web-workspace`) uses GraphQL via Apollo for everything. The `data-ingestion` domain uses Protobuf-backed GraphQL mesh endpoints. Adding REST would mean either bolting on a second HTTP client alongside Apollo, or wrapping REST in GraphQL at the BFF layer. Neither is great. Better to just define the schema in GraphQL from the start.

### Missing indexes

No indexes are specified anywhere in the design. These are the ones we'll definitely need:

| Table | Column(s) | Why |
|---|---|---|
| `feed_snapshot_items` | `(snapshot_id, scan_code)` | **Diff join hot path — most critical** |
| `feed_items` | `(upload_id, scan_code)` | Dedup check + diff join |
| `pls_match_results` | `(upload_id, item_id)` | Diff join |
| `feed_diff_items` | `(diff_id, change_type, severity)` | API filtering |
| `feed_diffs` | `(retailer_id, created_at DESC)` | History queries |
| `feed_quality_score_history` | `(retailer_id, computed_at DESC)` | Trend sparkline |
| `feed_anomaly_alerts` | `(upload_id, alert_type)` | Alert lookups |
| `feed_uploads` | `(retailer_id, uploaded_at DESC)` | Status polling |

Without these, the diff computation in Phase 4 (joining `feed_items` + `pls_match_results` + `feed_snapshot_items`) will be full table scans. That's fine for 1k items in a demo, not great for 100k+ in production.

### Snapshot retention

The current design overwrites the snapshot each time (only keep latest per retailer). The problem: if a corrupted or bad feed gets processed, it overwrites the baseline. The next upload's diff then compares against the bad data, and there's no way back.

Simple fix: keep the last 2-3 snapshots per retailer. Adds minimal storage overhead and gives us a rollback path.

Also need a `UNIQUE(retailer_id, snapshot_type)` constraint (or equivalent for N-snapshot model) to enforce the retention invariant at the DB level.

### Auto-cleanup for stale simulations

Simulations older than 30 days should be automatically deleted. The design mentions retention windows (90 days for `feed_items`, 30 diffs per retailer) but doesn't describe how cleanup actually happens. We need a scheduled Temporal workflow or cron job to sweep:
- `feed_uploads` + associated `feed_items`, `feed_item_validations`, `pls_match_results` older than 30 days
- `feed_diffs` + `feed_diff_items` beyond the per-retailer cap
- `feed_quality_score_history` beyond the 30-entry cap

### AI summary should be async

The LLM call in Phase 5 is synchronous in the worker pipeline. LLM APIs can take 5-30+ seconds and are unreliable. If the LLM is slow or errors out, it shouldn't block the whole job from completing. Better approach: finish the job with `ai_summary = null`, fire a separate async task to generate it, and update the row when it's ready. The UI can show a "generating summary..." placeholder.

### Concurrent upload race condition

If a retailer uploads two files before the first finishes processing, both workers will try to save a new snapshot. Last write wins, and the loser's diff baseline is gone. We need a per-retailer mutex (e.g., Temporal's single-execution-per-workflow-ID, or a DB advisory lock) to serialize uploads per retailer.

---

## Data model nits

These are smaller things but worth cleaning up:

- **Redundant `upload_id` on `feed_item_validations` and `pls_match_results`** — already reachable via `item_id → feed_items.upload_id`. Either remove it or document that it's an intentional denormalization for query performance.
- **`feed_diff_items.item_id` FK to `feed_items`** — `feed_items` has a 30-day retention but diffs could outlive them (slow retailers). The FK will break on cleanup. Need cascade-delete or decouple.
- **`quality_score` in both `feed_diffs` and `feed_quality_score_history`** — pick one as the source of truth.
- **`feed_column_mappings` has no versioning** — if a mapping changes between uploads, we can't re-process old uploads with their original mapping. Consider snapshotting the mapping used per upload.
- **`feed_anomaly_alerts.dismissed_at` without `dismissed_by`** — minor, but worth adding for traceability.

---

## API design notes

- **Status polling is unbounded** — should at least document a recommended poll interval (e.g., every 2s). Bonus: add SSE or webhook support later.
- **`PUT /feed-column-mappings` is full-replace** — to update 1 of 50 mappings, you have to send all 50. PATCH with partial update would be friendlier.
- **No upload cancellation** — once a bad file is submitted, there's no way to cancel. A `POST /feed-uploads/:id/cancel` endpoint would help.
- **No error response schema** — worth defining what 400/404/500 responses look like so frontend doesn't have to guess.

---

## Catalog lookup note

The design describes fetching canonical catalog records per matched `product_id` for mismatch detection (Phase 3). This is already handled by the product retrieval service — PLS returns the canonical data alongside the match. No separate catalog lookups needed.

---

## Scalability note (for post-hackathon)

The design targets up to 100k SKUs, which is fine for now. For larger retailers (500k+ SKUs), the main concerns are:
- `feed_items` table growth — need partitioning by `uploaded_at` or `retailer_id`
- `feed_snapshot_items` — 500k rows per retailer, 1000 retailers = 500M rows unpartitioned
- Redis snapshot cache — 500k rows won't fit in a single key, need a different serialization/sharding strategy
- PLS response caching — most scan codes don't change between uploads, so caching `scan_code → product_id` with a 24h TTL would cut PLS load significantly

Not blockers for the hackathon, but worth keeping in mind.

---

## Open questions from the design + thoughts

| # | Question | Thought |
|---|---|---|
| 1 | Does data-ingestion retain raw feed files? | Check with the data-ingestion team. If yes, we can reuse those S3 paths instead of storing files again. |
| 2 | Existing audit/history in catalog store? | If this exists, it could replace `feed_snapshots` entirely — big simplification. Worth investigating before building. |
| 3 | PLS rate limit for background tier? | Need to resolve this before going to production. Drives batch parallelism and whether we need a circuit breaker. |
| 4 | Mismatch thresholds per retailer? | Start with global defaults. Add per-retailer overrides later if needed. |
| 5 | Claude vs internal LLM? | Internal model if available (avoids sending retailer data externally). Claude with PII stripping as fallback. |
| 6 | Column mapping: self-service or TAM-configured? | TAM-only for v1. Self-service needs a validation UI which is a project in itself. |
