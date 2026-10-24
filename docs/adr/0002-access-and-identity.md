# ADR 0002: Make access rules consistent across every projection

Date: 2026-10-22. Status: accepted direction; Phase 1 runtime implementation delivered locally on 2026-10-23. See the [implementation results](../foundation-roadmap.md) for verification limits.

## Context

Policies use `OwnershipScope`, while controllers independently scope indexes, dropdowns, nested relations and dashboard queries. Shared Contact projections can disclose another Agent's activity. Contact-parent Tasks/Notes have list/detail disagreement. `verified` routes do not enforce verification because User lacks `MustVerifyEmail`.

## Decision

Use one implementation of permission + Listing assignment + supported-parent visibility. Apply it before serialization to all projections and before writes to every submitted related ID. Admin retains the explicit bypass. Custom roles retain resource-level restrictions after CRM entry.

Keep Contact classification separate from login roles. Shared Contacts expose only permitted Listing activity; their global identity edits are Admin-managed. Standalone Contact intake is Admin-managed; Agent-created Contacts must be linked atomically inside an authorized intake. See the complete target rules in [architecture](../architecture.md).

Make email verification real before trusting portal identity. New registration creates a new Contact association transactionally. Existing CRM Contact claiming/restoration is an explicit verified, Admin-mediated process, not an email match on a GET request. Public publication eligibility is separate from staff access and reused across portal flows.

## Consequences

One deep access module provides leverage to policies, read projections, form validation and reporting. Related IDs, custom roles and shared Contact edits gain explicit semantics. The Contact intake UI and existing tests must change together with the rule; documentation alone does not close the current gaps.

No global Contact email uniqueness is introduced: a shared email is not necessarily a unique person identifier. Phase 1 implements explicit Admin repair through `portal:repair-contact`, using record IDs rather than matching email. Missing portal associations produce a safe 409 response until repaired.

## Verification

Test shared-Contact cross-Agent projections, options, denied related IDs, dashboard permissions, Contact-parent Tasks/Notes, reassignment, unverified portal writes, registration rollback, and linking ambiguity. Test both JSON and Inertia projections where both exist.
