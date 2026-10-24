# Real Estate CRM Listing Operations MVP - Design

> Historical spec (May 2026). The [current architecture foundation](../../architecture.md) supersedes infrastructure, transport and scope statements where they differ. Public portal intake now exists; Redis is optional, and the application uses Inertia web routes. See the [roadmap](../../foundation-roadmap.md) for pending runtime changes.

## Context
We are building a real estate CRM focused on property/listing operations. Tech stack: React + Tailwind for the frontend, Laravel for the backend, and Redis for sessions and rate limiting. This spec defines the MVP scope and components before implementation.

## Goals
- Deliver a listing-centric CRM that supports the lifecycle: Listing -> Marketing -> Inquiries -> Viewings -> Offers -> Closed.
- Provide clean, fast workflows for Admin and Agent roles in a single agency, single workspace.
- Keep the MVP lean: internal listings only, manual lead intake, simple viewing records, basic offers, and core KPI counts.

## Out of Scope (MVP)
- External listing integrations (MLS/IDX/portals).
- Automated lead capture (public forms, email ingestion).
- Calendar sync integrations.
- Multi-tenant workspaces or billing.
- Advanced analytics and forecasting.

## Assumptions
- Residential listings only.
- Manual data entry for inquiries.
- Redis is used only for sessions and rate limiting in MVP.

## User Roles
- Admin: manage users, settings, and all records.
- Agent: manage assigned listings and related records.

## Information Architecture & Screens
1. Dashboard
   - KPI cards: active listings, new inquiries, upcoming viewings, offers pending, closed this month.
   - Recent activity list.

2. Listings
   - List view with filters and search.
   - Create/edit form.
   - Detail view with tabs:
     - Overview
     - Inquiries
     - Viewings
     - Offers
     - Tasks/Notes

3. Contacts
   - List view.
   - Create/edit form.
   - Detail view with related listings/inquiries/offers.

4. Inquiries
   - List view with status.
   - Create/edit form.
   - Linked to listing and contact.

5. Viewings
   - List view with date/time/status.
   - Create/edit form.
   - Linked to listing and contact.

6. Offers
   - List view with amount/status.
   - Create/edit form.
   - Linked to listing and contact.

7. Tasks/Notes
   - Task list (Open, In Progress, Done).
   - Notes timeline.
   - Attach to listing, inquiry, contact, or offer.

8. Settings
   - User profile.
   - User management (admin only).
   - Basic org settings.

## Core Data Model (High Level)
### Listing
- status, address, type, price, media, attributes (beds/baths/area)
- owner_contact_id
- assigned_agent_id

### Contact
- name, role (owner/buyer/tenant), phone, email, notes

### Inquiry
- status, source (manual), intent (buy/rent), budget
- listing_id, contact_id

### Viewing
- date/time, status
- listing_id, contact_id, agent_id

### Offer
- amount, status, notes
- listing_id, contact_id

### Task
- title, due_date, status, assignee_id
- related_entity_type, related_entity_id

### Note
- body, author_id
- related_entity_type, related_entity_id

### User
- role (admin/agent), profile fields

## Workflow Statuses
- Listing: Draft -> Active -> Under Offer -> Closed (optionally Closed-Lost)
- Inquiry: New -> Contacted -> Qualified -> Converted/Closed
- Viewing: Scheduled -> Completed -> No-Show/Cancelled
- Offer: Submitted -> Accepted -> Rejected -> Withdrawn
- Task: Open -> In Progress -> Done

## Architecture Overview
### Frontend (React + Tailwind)
- App shell with sidebar and topbar.
- Reusable table, filters, status chips.
- Detail pages with tabs.
- Forms in drawers/modals for create/edit.

### Backend (Laravel)
- REST endpoints for core entities.
- Validation for required fields.
- Role checks (Admin vs Agent).
- Media uploads for listings.

### Redis
- Session store.
- Rate limiting.

## API Surface (MVP)
- CRUD: listings, contacts, inquiries, viewings, offers, tasks, notes.
- Special actions:
  - status updates
  - assign agent
  - attach media
- Dashboard: KPI counts.

## Validation & Edge Cases
- Required fields: listing address/price/status; contact name; inquiry status; viewing date/time; offer amount.
- One primary agent per listing.
- Soft deletes to preserve history.
- Prevent viewing on closed listings.
- Warn when closing a listing with active offers.

## Testing Approach
- Backend: model validation, status transitions, role access.
- Frontend: form validation, list filters, core flow smoke tests.
- Smoke flow: create listing -> add inquiry -> schedule viewing -> create offer -> close listing.

## Future Extensions (Post-MVP)
- External listing integrations.
- Automated lead capture.
- Calendar sync.
- Queues and caching via Redis.
- Advanced analytics and forecasting.
