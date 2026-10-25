# CRM domain context

This is a listing-centric real estate CRM for one agency and one workspace. The internal CRM and the buyer portal share a Laravel application and database. Multi-agency tenancy, billing, MLS/IDX, calendar synchronization, and a separate frontend backend are outside the current foundation.

Read [architecture](docs/architecture.md), [design system](docs/design-system.md), [delivery plan](docs/foundation-roadmap.md), and [decisions](docs/adr/README.md) before changing cross-cutting behavior. These documents distinguish the implemented baseline from the intended design.

## Domain glossary

| Term | Meaning |
| --- | --- |
| Agency workspace | The single organization whose staff share CRM records; there is no tenant identifier. |
| User | A login identity. Its primary key is an integer. A portal User can be linked to one Contact. |
| Admin | A User with the `admin` role; has global CRM access through the existing permission bypass. |
| Agent | Staff whose operational access follows `listings.assigned_agent_id`, together with resource permissions. |
| Restricted staff | A User with a custom role granting CRM permissions. CRM entry does not grant every resource permission. |
| Portal user | An authenticated customer without an implicit staff entitlement. Self-registration grants no CRM role. |
| Contact | A CRM person with Owner, Buyer, or Tenant classification. This classification is not an authorization role. Contacts may participate in multiple listings. |
| Listing | The property marketing record. It has an owner Contact and one assigned staff User. Listing assignment is the anchor for staff record visibility. |
| Public listing | A non-deleted Listing in Active or Under Offer status. Publication eligibility is independent of staff ownership. |
| Inquiry | A Contact's interest in a Listing, including buy/rent intent, source, budget, and optional message. |
| Viewing request | A buyer's requested time, recorded as Requested; it is not a confirmed appointment. |
| Viewing | A Listing/Contact appointment assigned to a staff User. |
| Offer | A Contact's proposed amount for a Listing. Offer acceptance and transaction closure are separate business events. |
| Task | Assigned work linked to a Listing, Inquiry, Offer, or Contact. Its assignee does not independently grant access to its parent. |
| Note | Authored internal context linked to the same supported parent types. Authorship does not independently grant access. |
| Saved listing | A User's bookmark; it grants neither staff access nor access to an unpublished property. |
| Listing-offered event | The existing webhook's announcement of an available Listing to eligible buyers. It does not mean a buyer's Offer was accepted. |
| Announcement receipt | A durable v2 listing-offered event identity and dispatch intent. Retries return the same receipt, independently of visible notification history. |
| Announcement delivery | A terminal delivered, ineligible, or unpublished outcome for one receipt and User. Its durable identity prevents duplicate or resurrected notifications. |
| Closure | A Listing's successful final outcome, distinct from Closed Lost. Successful closure records authoritative `closed_at`; unknown legacy closure dates remain null. |

## Persistent conventions

- `users.id` and references to Users are integers. CRM entity, role, and permission identifiers are UUIDs. The historical diagrams incorrectly describe every identifier as a UUID.
- Money is Philippine pesos (PHP). Preserve decimal values in persistence and writes; formatting is presentation behavior.
- The current area field is `area_sqft`. Changing its unit requires an explicit data conversion and label migration.
- The intended agency display timezone is `Asia/Manila`; datetime persistence and transport will use UTC/explicit offsets. Current browser-local date formatting is not yet aligned.
- Stored enum values include spaces and title casing. Do not silently rename them.

## Architecture vocabulary

A **module** hides an **implementation** behind an **interface**, including its rules and errors. **Depth** produces **leverage** for callers and **locality** for maintainers. A **seam** is where behavior can vary; an **adapter** supplies that behavior. Prefer concrete modules that hide real coordination. Do not add a repository or an interface per model without a demonstrated need.
