# CRM project instructions

## Read first

1. `CONTEXT.md`: domain terms and product scope.
2. `docs/architecture.md`: implemented baseline and intended rules.
3. `docs/adr/README.md` and the applicable decisions.
4. `docs/design-system.md` for UI work; `docs/foundation-roadmap.md` for priorities.
5. `laravel/AGENTS.md` before application work; preserve its managed Laravel Boost block.

These root instructions cover the repository. More specific instructions apply within their directories. Follow the user's current task. Documentation of intended behavior is not evidence that it has been implemented.

## Product and architecture

- Keep a single-agency Laravel 13 / Inertia React 3 modular monolith. Preserve React 19, Tailwind 4, Wayfinder, Fortify, PHPUnit, and the existing package managers/lockfiles.
- Keep existing Laravel folders. Place a coordinated business operation under `app/Actions/<Domain>/` when implementing it; use concrete classes. Keep ordinary Eloquent CRUD direct when no coordination is hidden.
- Keep controllers focused on request/response adaptation, Form Requests on input shape and authorization, policies on authorization, and coordinated writes on transactional business behavior. Do not implement a second set of domain rules for JSON responses.
- Introduce an abstract interface only when a real variation or external dependency warrants the seam. Do not add generic repositories, microservices, a second state store, or a second design library by default.
- Record material design changes in `docs/adr/`; update the glossary when introducing a domain concept. Historical May specs and diagram images are references, not the current implementation contract.

## Access rules

- Staff access combines CRM eligibility, the resource permission, and Listing assignment; Admin retains its explicit bypass. Custom staff permissions must work without leaking other resource types.
- Apply visibility to list queries, counts, searches, options, nested relationships, JSON, and detail routes. An authorized parent does not authorize every related record.
- Recheck submitted foreign identifiers server-side. Existence and hidden controls do not prove authorization. Check both old and new parents when moving a record.
- Contact classification is not a staff role. Shared Contact details must not disclose other Agents' Listing activity. Follow the target Contact bootstrap/edit rules in `docs/architecture.md` when implementing that phase.
- Keep public publication checks separate from staff assignment checks. Scope portal records to the authenticated User or linked Contact. Never accept a client-supplied portal `contact_id` as identity.
- A `verified` route requires an actual verification-capable User. Do not automatically claim/restore an existing Contact solely because an unverified account supplies its email.

## Writes and invariants

- Preserve mixed integer/UUID identifiers, current enum values, and decimal money. Use explicit UTC/offset datetimes; display in the configured agency timezone.
- Treat Inquiry + Viewing intake, identity provisioning, and Offer/Listing state changes as coordinated operations. Enforce domain rules at the operation, inside its transaction where races matter.
- Handle retries with durable uniqueness/idempotency where required. A preliminary `exists()` check is not a concurrency guarantee.
- Dispatch work after commit. `Queueable` alone does not queue a notification. Database rollback cannot undo filesystem writes: media needs explicit compensation.
- Do not run destructive migrations or seed a real database to verify a change. Never read or expose `.env`, credentials, personal records, or production secrets in reports.

## Frontend and design

- Reuse `resources/js/components/ui` and existing layouts. Use primitive → semantic → component tokens in `resources/css/app.css`; pages consume semantic utilities.
- Keep the CRM sidebar shell and portal shell distinct while sharing primitives, status meanings, typography, focus behavior, and spacing.
- Prefer named Wayfinder routes. Do not hand-edit generated `resources/js/actions`, `routes`, or `wayfinder` output.
- Keep domain types separate from visual modules. Migrate shared exports out of `pages/workflow-support.tsx` incrementally, preserving existing imports during the transition.
- Cover loading, empty, error, pending, disabled, success, light, and dark states. Use text labels with status color and preserve keyboard/focus behavior.

## Verification and completion

Run commands in `laravel/`. Inspect `composer.json` and `package.json` before assuming a command exists.

- PHP behavior: run relevant PHPUnit feature tests (`php artisan test --compact <path>`). Use factories and an isolated testing database. Format changed PHP with `vendor/bin/pint --dirty --format agent`.
- UI/types: `npm run types:check`, `npm run lint:check`, and `npm run format:check`; build with `npm run build` when assets or frontend behavior change. Visually check changed screens and both appearances.
- Documentation-only work: check links, paths, diagrams, and consistency; do not create tests that just restate prose.
- Test observable behavior at the module's interface. For authorization, include denied access and omitted data, not just successful rendering. For transactional work, include rollback and retry cases.
- Preserve existing uncommitted work. Report checks that passed, failed, or were blocked and state whether work is documentation or runtime implementation. Do not claim a new invariant is enforced until code and meaningful tests demonstrate it.

When resuming this foundation, start with Phase 1 of `docs/foundation-roadmap.md`. Do not implement all phases in one speculative rewrite.
