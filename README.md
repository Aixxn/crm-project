# Listing-centric real estate CRM

A real estate CRM for one agency, built with Laravel 13, Fortify, Inertia React 3, React 19, Tailwind CSS 4, and Wayfinder. PHPUnit and Pint cover backend verification and formatting.

Staff manage Listings, Contacts, Inquiries, Viewings, Offers, Tasks, Notes, and dashboard metrics. Admin retains global access. Agents and custom staff roles need both the resource permission and access to the assigned Listing. The customer portal has a separate navigation shell and uses the signed-in User's linked Contact.

## Current implementation

The access and identity work in Phase 1 and the lifecycle work in Phase 2 are implemented locally and covered by automated tests.

- Shared visibility rules cover lists, details, related records, options, JSON responses, and dashboard metrics.
- Registration creates a new User and Contact atomically. Email verification is enforced. Portal reads never claim an existing Contact by email.
- Authorized Listing and Inquiry intake can create and link a new Contact in one transaction. Shared Contact edits are restricted.
- Listing, Inquiry, Viewing, Offer, and Task updates follow explicit transitions and record actor, state, timestamp, and correction reason where required.
- Offer acceptance updates the Listing in the same transaction. Database constraints prevent multiple Accepted Offers per Listing.
- Successful closure records `closed_at`. Monthly metrics use Manila month boundaries and do not infer closure from later edits.
- Public Viewing intake preserves buy/rent intent, normalizes offset-bearing times to UTC, and prevents duplicate active requests. Cancellation permits a deliberate new request.
- Historical corrections require an administrator and a reason. Completed Tasks require an explicit reopen operation and reason.

The next phase is **Phase 3: reliable media and announcements**. Upload compensation, durable announcement receipts, queued delivery, and replay recovery remain pending. See the [foundation roadmap](docs/foundation-roadmap.md) for all phases and completion gates.

## Architecture and working rules

Start with [CONTEXT.md](CONTEXT.md) for domain terms and [AGENTS.md](AGENTS.md) for repository rules.

- [System architecture](docs/architecture.md) describes implemented behavior, module ownership, and remaining targets.
- [Architecture decisions](docs/adr/README.md) records the accepted decisions.
- [Design system](docs/design-system.md) defines the shared UI direction. Its broader migration remains pending.
- [Foundation roadmap](docs/foundation-roadmap.md) records current verification and open work.
- [Original validation record](docs/foundation-validation.md) preserves the October 22 review baseline.

Historical May specifications and diagram images are references. Code, migrations, and meaningful tests establish implemented behavior.

## Requirements

- PHP 8.5 recommended and Composer.
- Node.js and npm, using the existing lockfile.
- SQLite for local development.

Sessions, cache, and queues use database drivers by default. Redis is optional.

The lifecycle migration supports SQLite and PostgreSQL syntax. Only SQLite has been verified, including competing-process tests. Other database engines fail that migration explicitly. Production database selection and concurrency verification remain open.

## Project structure

| Path | Purpose |
| --- | --- |
| `laravel/` | Laravel and Inertia React application |
| `laravel/app/Actions/` | Coordinated identity, intake, and lifecycle operations |
| `laravel/app/Services/` | Shared visibility and portal identity rules |
| `laravel/resources/js/` | Staff and portal pages, shared UI, and transport types |
| `laravel/tests/` | PHPUnit feature and unit tests |
| `docs/` | Architecture, decisions, design system, and roadmap |
| `design/` | Historical diagram references |

## Set up a fresh local database

Run application commands from `laravel/`.

```bash
cd laravel
composer install
npm ci
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
npm run build
```

For a disposable demonstration database, optionally run:

```bash
php artisan db:seed
```

The seeder creates demo accounts and sample portal data. Keep demo provisioning separate from production account provisioning.

Configure mail delivery to complete email verification. Registered users must verify their email before protected CRM or portal workflows become available. A staff account also needs the appropriate role and permissions.

To expose uploaded listing images during local development, run:

```bash
php artisan storage:link
```

## Upgrade an existing development database

Back up the database before applying additive migrations:

```bash
php artisan migrate
```

The lifecycle migration stops before schema changes if it finds multiple Accepted Offers for one Listing, duplicate active Viewing times, or soft-deleted Submitted Offers. Review and resolve those records before retrying. The migration does not silently choose winners or remove history.

Existing Closed Listings retain a null `closed_at` unless an authoritative closure date is available through a separately reviewed backfill. Unknown dates are excluded from monthly closure metrics.

A verified legacy portal account without a valid Contact association receives a safe conflict response. An administrator can repair it explicitly using record IDs:

```bash
php artisan portal:repair-contact USER_ID --actor=ADMIN_ID --contact=CONTACT_UUID
php artisan portal:repair-contact USER_ID --actor=ADMIN_ID --create
```

These commands reject unverified accounts, deleted Contacts, conflicting associations, and non-Admin actors. Repeating the same repair preserves the association.

## Run locally

```bash
composer run dev
```

This starts Laravel, Vite, a queue listener, and the log watcher. Open the local Laravel address printed by the command, normally `http://localhost:8000`.

The existing listing-announcement notification is still synchronous. Starting a queue listener does not complete Phase 3's queued announcement delivery.

## Verify changes

Run from `laravel/`:

```bash
php artisan test --compact
vendor/bin/pint --dirty --format agent
npm run types:check
npm run lint:check
npm run format:check
npm run build
```

For a targeted test run:

```bash
php artisan test --compact tests/Feature/Workflows/LifecycleMatrixTest.php
```

The combined `composer run ci:check` command does not include the frontend production build. Run `npm run build` separately.

### Latest recorded results

On October 24, 2026, the full suite passed **305 tests and 2,153 assertions**. TypeScript, ESLint, Pint, changed-file frontend formatting, the production build, and `git diff --check` passed.

Global `npm run format:check` still reports 14 untouched resource files. Browser visual verification for Phases 1 and 2 remains open because the isolated preview could not be reached and browser policy blocked the local-file fallback. Automated render tests do not replace that review.

Production-engine verification, deployment provisioning, and the later roadmap phases remain open. No production migrations or real account repairs were performed during these checks.

## Troubleshooting

If assets are missing or Laravel reports a Vite manifest error:

```bash
npm run build
```

If the application key is missing:

```bash
php artisan key:generate
```

If tables are missing from a fresh local database:

```bash
php artisan migrate
```

If port 8000 is already in use:

```bash
php artisan serve --port=8001
```

For verification failures, check mail configuration and the account's verification status. For a missing portal Contact association, use the explicit Admin repair flow rather than email-based claiming.
