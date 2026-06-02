# Listing-Centric Real Estate CRM

This project is a listing-centric real estate CRM for a single agency workspace. It is built with Laravel 13, Inertia React v3, Tailwind CSS v4, Wayfinder, PHPUnit, and Pint.

The CRM supports Admin and Agent workflows around listings, contacts, inquiries, viewings, offers, tasks, notes, and dashboard KPIs. Agents are scoped to listings assigned to them through `listing.assigned_agent_id`, while Admin users can manage all CRM records.

The buyer/lister-facing portal pages live outside the CRM side navigation and are intended for public or authenticated portal users. CRM access remains restricted to Admin and Agent roles.

## Requirements

- PHP 8.5 recommended
- Composer
- Node.js and npm
- SQLite for local development
- Redis only when you intentionally switch sessions, cache, or rate limiting to Redis

## Project Structure

```text
.
├── design/                  # Class diagram and ERD references
├── docs/superpowers/specs/  # MVP and RBAC design specs
└── laravel/                 # Laravel + Inertia React application
```

Run application commands from the `laravel/` directory unless stated otherwise.

## First-Time Setup

1. Enter the Laravel app directory.

```bash
cd laravel
```

2. Install PHP dependencies.

```bash
composer install
```

3. Install JavaScript dependencies.

```bash
npm install
```

4. Create the environment file.

```bash
cp .env.example .env
```

5. Generate the application key.

```bash
php artisan key:generate
```

6. Make sure the SQLite database file exists.

```bash
touch database/database.sqlite
```

7. Run migrations and seed the default roles, permissions, and admin user.

```bash
php artisan migrate --seed
```

8. Build frontend assets once.

```bash
npm run build
```

You can also run the project setup script after entering `laravel/`:

```bash
composer run setup
```

If the SQLite database file does not exist before running the setup script, create it with:

```bash
touch database/database.sqlite
```

## Running the Project

1. Start the Laravel server, Vite dev server, queue listener, and log watcher together.

```bash
composer run dev
```

2. Open the app in your browser.

```text
http://localhost:8000
```

The Vite server runs separately and is used by Laravel automatically during development.

## Default Login

After running the seeder, use this CRM admin account:

```text
Email: test@example.com
Password: password
```

Admin and Agent users can access the CRM dashboard and side panel. Regular registered portal users should remain on buyer/lister portal pages and should not be allowed into the CRM admin area.

## Useful Local Commands

Run migrations:

```bash
php artisan migrate
```

Reset and reseed the local database:

```bash
php artisan migrate:fresh --seed
```

Run the PHP test suite:

```bash
php artisan test --compact
```

Run a targeted PHPUnit test:

```bash
php artisan test --compact --filter=ExampleTest
```

Format changed PHP files:

```bash
vendor/bin/pint --dirty --format agent
```

Run PHP lint checks through Composer:

```bash
composer run lint:check
```

Run frontend type checks:

```bash
npm run types:check
```

Run frontend lint checks:

```bash
npm run lint:check
```

Run frontend formatting checks:

```bash
npm run format:check
```

Build production frontend assets:

```bash
npm run build
```

Run the combined CI-style check:

```bash
composer run ci:check
```

## Environment Notes

The default `.env.example` uses SQLite and database-backed sessions, cache, and queue records:

```text
DB_CONNECTION=sqlite
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

For local development, this keeps setup simple and does not require Redis. If you switch Redis on for sessions, cache, or rate limiting, make sure Redis is running and update the related `.env` values.

## Common Troubleshooting

If assets are missing or the page shows a Vite manifest error, run:

```bash
npm run build
```

If the app key is missing, run:

```bash
php artisan key:generate
```

If the database tables are missing, run:

```bash
php artisan migrate --seed
```

If login says the credentials do not match, confirm the database was seeded and use:

```text
test@example.com / password
```

If the development server is already using port `8000`, start Laravel on another port:

```bash
php artisan serve --port=8001
```

## Reference Documents

- `design/Class Diagram.png`
- `design/ERD DIAGRAM.png`
- `docs/superpowers/specs/2026-05-10-real-estate-crm-listings-mvp-design.md`
- `docs/superpowers/specs/2026-05-21-flexible-rbac-class-model-design.md`
- `laravel/CLAUDE.md`
- `laravel/AGENTS.md`
