# ADR 0001: Retain a single-agency modular monolith

Date: 2026-10-22. Status: accepted foundation; deployment shape already exists.

## Context

The CRM already uses Laravel, Inertia React, Eloquent, Fortify and Wayfinder. Its friction is duplicated access and workflow rules inside one application. No separate client, tenant, independently scaling module or second persistence implementation has been established.

## Decision

Keep one Laravel application and relational database with logical modules for identity/access, listing operations, customer activity, Tasks/Notes, portal projections, announcements, reporting and UI foundation. Preserve the standard Laravel directory layout. Put coordinated operations in concrete domain-named Actions; retain direct CRUD where no coordination is hidden.

Use existing Inertia routes and compatible JSON responses. Use the same business behavior for both. Keep SQLite and database-backed session/cache/queue defaults locally. Production database choice remains a deployment decision; Redis is optional.

## Consequences

Locality improves by concentrating rules rather than distributing them across new processes. Abstract interfaces and adapters are introduced only for demonstrated variation. The design excludes multi-tenancy, a separate REST backend, generic repository scaffolding, microservices and a mandatory broker from this phase.

This supersedes mandatory Redis and REST-only statements in the May MVP spec. It does not remove implemented portal features.

## Verification

Review module dependencies and endpoint parity. No new dependency or folder hierarchy is required for this documentation change. Future concurrency behavior must be verified on the selected production database engine.
