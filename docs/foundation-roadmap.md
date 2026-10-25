# Foundation review and implementation order

Reviewed 2026-10-22 against local `ad7138c87d47a038ce3a2476d8c0fc35e6009ef4` and GitHub main `0ec9ce8a2c83f4d4e30747726c59421917a345ae`. Local main has two later housekeeping commits. The local working tree also has pre-existing changes to `DatabaseSeeder.php` and `RbacPermissionTest.php`; this review does not overwrite them.

Phase 1 runtime implementation was delivered locally on 2026-10-23, with 195 passing tests and 1,788 assertions at that checkpoint. Phase 2 lifecycle and atomic public intake are delivered locally on 2026-10-24. Phase 3 media compensation and versioned announcement delivery are implemented locally; external producer cutover remains unconfirmed. The PHP baseline passes 328 tests and 2,365 assertions (2026-10-25 Asia/Manila). Phase 4's shared UI foundation is implemented locally. Frontend behavior/contrast tests, TypeScript, ESLint, global resource formatting, and the production build pass. Browser access now works. Representative staff and Buyer flows have been reviewed; the explicit 200% text-zoom acceptance check remains unverified. Phase 5, including production database selection and engine verification, has not started. The [architecture](architecture.md) distinguishes implemented behavior from remaining targets, and [validation](foundation-validation.md) records the original review baseline.

## Evidence and priority

Paths below are relative to `laravel/`. Static findings are source-verified; concurrency outcomes are risks requiring reproduction/engine-specific tests.

The table records the original review findings. Phase 1 completion and remaining verification limits are recorded below.

| Priority | Finding | Evidence | Consequence |
| --- | --- | --- | --- |
| P0 | Owner options return all Contacts to staff | `app/Http/Controllers/ListingController.php`, `ownerOptions()` | Unassigned Contact names/email/phone reach the browser |
| P0 | Shared Contact detail loads unscoped related records | `ContactController::show()` | Another Agent's Listing/activity data can be serialized |
| P0 | Dashboard uses assignment without each resource permission | `DashboardController`, `EnsureUserHasCrmAccess` | A restricted staff role can receive unrelated resource projections |
| P0 | Email verification gate is ineffective for current User | `app/Models/User.php`; `verified` route groups | Route labels promise stronger identity trust than implemented |
| P1 | Contact-parent Task/Note rules disagree | `OwnershipScope::resolveListing()`, Task/Note list scopes | Record can appear in a list but fail its detail policy |
| P1 | Related Contact IDs are checked for existence rather than access | Offer/Viewing Form Requests | Scoped options do not prevent unauthorized attachment by submitted ID |
| P1 | Identity provisioning and email matching are separate writes | `CreateNewUser`, `BuyerPortalScope` | Partial provisioning and ambiguous existing-contact links |
| P1 | Lifecycle is mostly enum validation | Listing/Offer/Viewing requests/controllers | Invalid transitions and contradictory Offer/Listing state remain possible |
| P1 | Monthly closures use `updated_at` | `DashboardController` | Later edits change the apparent closing month |
| P1 | Viewing intake is multi-write; duplicate check is check-then-create | `PublicViewingRequestController` | Partial Inquiry updates and concurrent duplicates are risks; new inquiry intent is hardcoded buy |
| P1 | Announcement deduplication is not atomic; fan-out is synchronous | `ListingWebhookController`, `ListingOfferedNotification` | Concurrent duplicate/partial delivery risk; response misstates queue behavior |
| P2 | Listing images lack staged-write compensation | `ListingController::store()` | Orphaned images/partial metadata on failures are risks |
| P2 | Shared tokens are bypassed; status coverage incomplete | CSS, `pages/workflow-support.tsx`, dashboard/public pages | Appearance and status fixes must be repeated per screen |
| P2 | Historical docs/diagrams conflict with running code | May specs, `design/*.png`, migrations | Future work can follow wrong IDs, infrastructure, transport or scope |

## Phase 1 — Access and trusted identity

- [x] Add regression tests for shared-Contact nested payloads, owner options, restricted-role dashboard, and Contact-parent Task/Note parity. Make them fail on the current gaps.
- [x] Extend the shared access module and remove duplicated rule implementations only after callers are covered.
- [x] Validate related IDs and destination parents with the same access rules; reject deleted/unknown parents.
- [x] Make User email verification effective, update intended authenticated flows, and prove unverified portal writes are denied.
- [x] Make new-account provisioning atomic and remove automatic email-based claiming/restoration from GET reads. Provide explicit legacy-link repair/conflict handling.
- [x] Implement the Contact bootstrap/shared-edit rule together with the required intake UI. Do not simply hide all Contact options and strand Agent intake.

Exit gate: list/detail/options/nested/JSON/dashboard agree; restricted roles receive only authorized data; registration and verification behavior pass meaningful failure-path tests.

Regression coverage includes `ContactVisibilityTest`, `ContactIntakeTest`, `PhaseOneAccessTest`, `MalformedRelatedIdentifierTest`, and `TrustedPortalIdentityTest`, alongside the existing CRUD, authentication, dashboard, and workflow tests. New owner and buyer intake creates the Contact and Listing or Inquiry in one transaction. Standalone Contact creation and deletion are Admin-managed. Agents can edit global Contact details only when every live Listing link belongs to that Agent.

Portal reads with a missing or deleted Contact association return a safe 409 without creating, claiming, or restoring a Contact. An administrator can explicitly repair a verified account from `laravel/` with one of these commands. Replace each placeholder with an explicit record ID.

```sh
php artisan portal:repair-contact USER_ID --actor=ADMIN_ID --contact=CONTACT_UUID
php artisan portal:repair-contact USER_ID --actor=ADMIN_ID --create
```

The command refuses unverified accounts, deleted Contacts, conflicting associations, and non-Admin actors. Repeating the same repair preserves the established association. No existing accounts were repaired as part of verification.

## Phase 2 — Listing and customer activity invariants

- [x] Implement the documented Listing/Offer/Inquiry/Viewing/Task transitions in coordinated operations; generic status edits cannot bypass them.
- [x] Add `closed_at` and transition history through additive migrations; stop deriving closure from `updated_at`. Specify a cautious legacy backfill that does not invent closure dates.
- [x] Implement one accepted Offer per Listing and guarded state effects. SQLite is verified locally; chosen production-engine verification remains open in Phase 5.
- [x] Make public Viewing intake atomic, preserve buy/rent intent, reuse publication rules, and back active duplicate prevention with a durable engine-appropriate mechanism.
- [x] Distinguish new scheduling from historical correction; ensure Closed Lost is treated explicitly everywhere.

Exit gate: invalid transitions fail without partial writes, one accepted Offer invariant holds, retries are safe, closure metrics remain stable after edits.

Local implementation evidence (2026-10-24): the transition matrix, atomic history/closure, accepted-offer constraint, explicit correction/reopen, shared publication rule, offset-normalized public intake and cancellation/retry cases are covered by feature tests. Real competing processes exercise acceptance and public intake against isolated file SQLite using application connection options. No production-engine lock claim is made. PostgreSQL is not verified; unsupported engines fail the additive migration explicitly. Legacy closure timestamps remain null and are excluded from closure metrics until authoritative evidence supports a reviewed backfill. Browser verification is blocked by the unavailable preview server and browser local-file URL policy; Phase 4 design work is unchanged.

## Phase 3 — Reliable media and announcements

- [x] Stage uploads and compensate failed media writes; test both storage and database failures.
- [ ] Confirm external producer cutover to v2. The existing v1 route retains optional event IDs and its HTTP 200 synchronous count; v2 requires stable identity and returns a durable HTTP 202 receipt.
- [x] Add durable announcement receipt/dispatch/delivery records with uniqueness; implement replay/payload-conflict behavior.
- [x] Queue bounded fan-out after commit, recover partial deliveries, and test interruption/concurrent replay.
- [x] Narrow the webhook CSRF exception, add an appropriate route limiter, and retain raw-body HMAC/freshness checks.

Exit gate: failure/retry behavior is observable, duplicate notifications are prevented under concurrency, and the worker is actually exercised.

Local implementation evidence (2026-10-25): `CreateListing` privately stages uniquely owned files, promotes before commit, and compensates partial storage writes plus Contact/Listing/history/media rollback. Tests exercise false and throwing storage failures, multi-image failure, cleanup/logging failure, retry and ancestor rollbacks. Crash-orphan cleanup remains an operational limitation.

The additive v2 endpoint persists canonical producer/event identity, frozen public notification data, dispatch intent and a maximum User ID. Database workers process at most 50 Users per chunk and commit notifications, terminal delivery markers and cursor advancement together. Actual `queue:work database --queue=announcements --once` tests use isolated file SQLite. Lost continuation, queue outage after commit, failed-recipient rollback, read/deletion preservation, late-account exclusion, custom staff omission and concurrent receipt/delivery processes are covered. `php artisan announcements:recover` reschedules incomplete receipts. Development workers consume both default and announcements queues. V1 retains its historical synchronous notification-based deduplication limits; external cutover and production-engine verification remain open. No real customer notifications were sent.


## Phase 4 — Shared design foundation

- [x] Implement the semantic token roles and correct dark contrast pairs without renaming established semantics arbitrarily.
- [x] Extract shared status/formatting/types from the page utility module with temporary re-exports; cover all domain statuses.
- [x] Migrate Listings index/create/detail as the reference staff slice, including the updated Contact intake behavior.
- [x] Reuse these patterns for customer activity/dashboard; consolidate portal header/layout and migrate browse/property/intake.
- [ ] Verify both appearances, keyboard access, responsive tables/forms, and pending/error/empty states in a browser. Compatibility exports remain while existing callers use them.

Exit gate: reference screens consume semantic tokens and shared patterns; type/lint/format/build checks and browser visual review pass. Automated checks pass locally; browser review remains open. Existing visual differences alone do not justify a full rewrite.

Local implementation evidence (2026-10-25 Asia/Manila): all current Listing, Inquiry, Viewing, Offer, and Task statuses resolve through one typed domain registry. The shared formatters use en-PH/PHP and Asia/Manila, while date-only values retain their displayed calendar date. Appearance subscribers update when system light/dark resolution changes, external storage changes apply, and HMR cleanup is idempotent. Shared tokens include matched light/dark foregrounds, status pairs, focus/input roles, sidebar roles, and photo-overlay roles. Listings, Contacts, customer activity, Dashboard, and the public portal use the shared status, empty-state, pagination, and formatting modules where applicable. The public portal uses one layout/header with a keyboard-operable mobile menu and appearance toggle. `npm run test:frontend`, `npm run types:check`, `npm run lint:check`, `npm run format:check`, and `npm run build` passed. Browser follow-up (2026-10-25 Asia/Manila): verified local Admin, Agent and Buyer fixtures preserve normal email verification. Reviewed staff lists, Listing intake and detail, portal Browse/property/My Home/Deal Tracker/settings, both appearances, and representative 375/768/1280px layouts. Browser actions exercised disabled pending states, required-field validation, saved-property persistence, successful Inquiry and Viewing intake, profile-save feedback, mobile keyboard menus, Agent empty scope and a denied Listing detail. Fixed homepage dark surfaces, misleading example-card links and unavailable actions, Browse status/labels, Listing input names, portal settings labels/feedback, Inquiry success feedback, dashboard offer currency, and fabricated staff photo/market controls. Final verification passed 329 PHP tests with 2,374 assertions, all three frontend test files, TypeScript, ESLint, resource formatting, Pint, and the production build (exit 0). Vite retains its large-chunk warning. Test-only Buyer activity remains in the local database. The explicit 200% text-zoom check is still open: browser keyboard shortcuts did not alter the reported scale. Do not mark the browser acceptance checkbox complete until that check is demonstrated.

## Phase 5 — Deployment readiness

- [ ] Choose the production database and demonstrate all locking/uniqueness invariants there; retain portable local setup.
- [ ] Separate demo seeding from production provisioning, configure real verification mail and secrets, and verify backup restoration.
- [ ] Supervise workers; expose failed jobs, queue backlog, request IDs, safe error reporting and `/up` checks.
- [ ] Measure representative assigned-listing/contact/dashboard queries; add targeted indexes and bounded options before speculative caching.
- [ ] Add CI using the existing scripts and an explicit frontend production build. `composer run ci:check` does not currently invoke `npm run build`.

Exit gate: production checks are demonstrated on the chosen deployment, not inferred from local tests.

## Module depth review

| Candidate | Strength | Deletion test and test leverage |
| --- | --- | --- |
| Shared access | Strong; top recommendation | Deletion would redistribute visibility across every caller; tests exercise one rule set across projections |
| Identity provisioning | Strong | Deletion would redistribute trusted linking/creation ordering; rollback/conflict tests exercise the complete operation |
| Listing/customer activity workflows | Strong | Deletion would redistribute state coordination; transition/rollback tests survive internal refactors |
| Announcement delivery | Strong | Deletion would redistribute idempotency/fan-out/retries; tests cross the receipt/delivery seam |
| Media intake | Worth exploring | Depth is cleanup/coordination, not another pass-through storage adapter |
| UI foundation | Strong | Deletion would redistribute status/theme/state behavior across screens; visual changes gain locality |

Do not implement generic repositories, interfaces for every model, microservices, global state duplication, a second theme provider, or a new design library as prerequisites. They do not address the observed friction.
