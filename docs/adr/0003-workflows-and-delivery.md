# ADR 0003: Coordinate business writes and durable announcement delivery

Date: 2026-10-22. Status: accepted direction; Phase 2 lifecycle/public intake implemented locally on 2026-10-24. Phase 3 compensated media and versioned announcement delivery implemented locally on 2026-10-25; external producer cutover remains unconfirmed.

## Context

Enums constrain values but not transitions. Offers and Listings can be updated independently. Public Viewing intake coordinates several writes without a transaction. Media combines files and database rows without compensation. Webhook duplicate checks inspect notification history and are not atomic; its notification is synchronous despite a “queued” response.

## Decision

Implement the transition tables and coordinated operations in [architecture](../architecture.md). Each operation owns authorization rechecks, invariants, transactional writes and post-commit effects. Offer acceptance serializes on the Listing; successful closure has an authoritative timestamp and transition history. Historical correction is separate from new activity intake.

Viewing request intake coordinates Contact/Inquiry/Viewing behavior, preserves intent, and uses an engine-compatible active-request uniqueness rule. Media intake owns staging and failure cleanup because a database transaction cannot roll back file writes.

Require producer event identity for listing announcements; verify HMAC/freshness in the webhook adapter. Persist a unique receipt, payload identity and dispatch intent. Process recipients through actual queued work with durable event/recipient uniqueness and retry recovery. Do not equate a `Queueable` trait with asynchronous execution.

## Consequences

Locality comes from one implementation per coordinated behavior. New additive migrations are needed for closure/history and event/delivery records. Producer compatibility must be handled explicitly. An external broker and a generic persistence abstraction are unnecessary for this phase.

SQLite unit/feature tests establish behavior but do not establish row-lock/concurrency guarantees for another engine. Production database selection precedes those claims.

## Verification

Test transitions, competing acceptance/closure, stable monthly KPIs, Viewing rollback and retries, intent preservation, media cleanup, concurrent event replay and interrupted fan-out. Prove duplicate prevention on the selected engine and test post-commit dispatch.

## Local Phase 2 evidence

`Actions/Lifecycle/ChangeRecord` owns the transition table, transactional authorization rechecks, parent Listing locking, Offer side effects, closure timestamp and atomic history. Public Inquiry and Viewing intake have dedicated coordinated actions. Partial unique indexes enforce one Accepted Offer per Listing (including deleted Offers) and one active Viewing time per Listing/Contact. Migration preflight rejects conflicting existing rows without repairing them; unknown legacy closure dates remain null.

SQLite is the demonstrated local engine. Process tests use an isolated file database with application SQLite options for competing acceptance and equivalent-offset Viewing requests. PostgreSQL SQL support is provisioned but unverified; other engines fail migration explicitly. Production engine verification remains a Phase 5 gate. Browser validation remains blocked by the local preview server and browser local-file URL policy. Phase 3 implementation and verification are recorded below.

## Local Phase 3 implementation

`CreateListing` stages uploads on private storage, promotes unique owned files before the Listing transaction commits, and compensates partial writes plus owner/Listing/history/media rollback. Ancestor rollback callbacks cover committed savepoints; cleanup never interrupts rollback when storage or logging fails. No filesystem transaction retry is used. Crash-orphan cleanup and durable shared storage remain operational limits.

The unknown external producer keeps its v1 route and HTTP 200 synchronous count. V2 adds the stable event-ID requirement and HTTP 202 receipt without breaking v1. Canonical validated event/Listing identity accepts reordered JSON and rejects reused identity with changed meaning. Replay returns the original receipt even after publication changes. Producer cutover is an open rollout gate.

Two additive tables hold receipt/outbox progress and unique terminal recipient outcomes. Database queue jobs process bounded 50-User chunks under receipt write intent, freeze the maximum User ID at acceptance, and commit notification insertion with delivery markers and cursor progress. An initial write avoids deferred SQLite read-to-write upgrade contention observed in the competing-process test. Notification UUIDs derive from receipt and recipient identity. Read/deleted notifications are not recreated. Eligibility excludes all CRM-capable staff, including custom roles, and publication is rechecked before delivery.

Queue submission is after commit and failures preserve durable recovery intent. `announcements:recover` resubmits incomplete receipts regardless of prior queue state. Normal development workers consume both default and announcements queues. Actual database workers and competing processes are exercised only against isolated file SQLite. No production-engine or producer-rollout claim follows from those local results.
