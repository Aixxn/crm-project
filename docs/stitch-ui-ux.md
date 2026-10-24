# Real Estate CRM - UI/UX Design Brief for Stitch

> Historical design brief. The [current design system](design-system.md) governs shared tokens, status coverage, appearances and reusable patterns. The [architecture](architecture.md) distinguishes implemented features from intended behavior; this brief is not evidence that every described screen exists.

## Project Overview
Design a listing-centric CRM web app for a single real estate agency. The product focuses on property/listing operations and a simple lifecycle: Listing -> Marketing -> Inquiries -> Viewings -> Offers -> Closed.

## Target Users
- Admin: manages users/settings and oversees all listings.
- Agent: manages assigned listings and related records.

## Visual Direction
- Clean SaaS dashboard aesthetic.
- Professional, modern, and high-clarity layouts.
- Emphasize readability and data scanning (tables + cards).
- Use neutral base tones with a single accent color for actions and statuses.

## Primary Navigation
Left sidebar navigation with icons + labels:
- Dashboard
- Listings
- Inquiries
- Viewings
- Offers
- Contacts
- Tasks/Notes
- Settings

Top bar includes:
- Search
- Quick action (Add Listing)
- User profile menu

## Core Screens to Design

### 1. Dashboard
Purpose: quick overview of business activity.
Components:
- KPI cards: Active Listings, New Inquiries, Upcoming Viewings, Offers Pending, Closed This Month.
- Recent activity list (latest inquiries/offers/viewings).
- Quick actions: Add Listing, Add Inquiry, Schedule Viewing.

### 2. Listings - List View
Purpose: manage and search listings.
Components:
- Data table with status chips, price, address, beds/baths/area, assigned agent.
- Filters: status, price range, location, agent.
- Search bar.
- Primary CTA: Add Listing.

### 3. Listing - Detail View
Tabs:
- Overview: property details, media carousel, price history.
- Inquiries: list of inquiries tied to listing.
- Viewings: upcoming and past viewings.
- Offers: active and closed offers.
- Tasks/Notes: timeline of notes + tasks.

### 4. Inquiries - List View
- Table with inquiry status, contact, listing, budget, intent.
- Quick action to create inquiry.

### 5. Viewings - List View
- Table with date/time, status, listing, contact, assigned agent.

### 6. Offers - List View
- Table with amount, status, listing, contact.

### 7. Contacts - List View
- Table with role (owner/buyer/tenant), phone/email, related listings.

### 8. Tasks/Notes
- Task list with status and due date.
- Notes timeline with quick add.

### 9. Settings
- User list with roles (Admin/Agent).
- Profile settings.

## Forms/Modals
- Add/Edit Listing
- Add/Edit Inquiry
- Add/Edit Viewing
- Add/Edit Offer
- Add/Edit Contact

Each form should be clean, structured, and split into logical sections.

## Status System (for chips and labels)
- Listing: Draft, Active, Under Offer, Closed
- Inquiry: New, Contacted, Qualified, Closed
- Viewing: Scheduled, Completed, Cancelled, No-Show
- Offer: Submitted, Accepted, Rejected, Withdrawn
- Task: Open, In Progress, Done

## UX Notes
- Use tabs within listing detail for fast context switching.
- Tables should support row actions (view/edit).
- Provide empty states with clear CTAs.
- Responsive layout for tablet use (no mobile-first requirement for MVP).

## Deliverables
Provide high-fidelity mockups for each primary screen listed above, plus reusable components (table rows, status chips, cards, form sections).
