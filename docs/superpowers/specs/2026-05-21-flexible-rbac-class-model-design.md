# Flexible RBAC + Ownership-Scoped Permissions - Design

> Historical spec (May 2026). Read the [current architecture foundation](../../architecture.md) and [access decision](../../adr/0002-access-and-identity.md). The implemented User primary key and its references are integers, while CRM/role/permission IDs are UUIDs. The diagrams below are conceptual references, not the authoritative migration schema.

## Context
We need a flexible RBAC model for the CRM MVP that distinguishes Admin and Agent roles and enforces ownership-scoped access for non-admins. This design should align with the listing-centric workflow in the CRM spec.

## Goals
- Support Admin and Agent roles with a flexible permissions system.
- Enforce ownership-scoped permissions for Agents.
- Keep the model extensible for future roles and permissions.

## Non-Goals
- Public/anonymous user access rules (handled as request context, not a stored user).
- Fine-grained field-level permissions.

## Assumptions
- A single workspace (no multi-tenant access yet).
- Listing ownership is represented by `listing.assigned_agent_id`.
- Related entities (inquiries, viewings, offers, tasks, notes) are scoped via listing ownership where applicable.

## RBAC Data Model
### Core Tables
- `users`
- `roles` (`key`, `name`, `description`)
- `permissions` (`key`, `description`)
- `user_roles` (`user_id`, `role_id`)
- `role_permissions` (`role_id`, `permission_id`)

### Roles
- `admin`
- `agent`

### Permission Keys
Use `resource.action` keys, for example:
- `listing.read`, `listing.create`, `listing.update`, `listing.delete`
- `inquiry.read`, `inquiry.create`, `inquiry.update`, `inquiry.delete`
- `viewing.*`, `offer.*`, `task.*`, `note.*`, `contact.*`, `user.*`

## Ownership-Scoped Permissions
Admin has global access. Agent access is scoped to records tied to listings they own.

### Scope Rules
- Listing: `listing.assigned_agent_id == user.id`
- Inquiry/Viewing/Offer: allowed if their `listing_id` belongs to a listing assigned to the agent.
- Task/Note: allowed if their related entity resolves to a listing assigned to the agent.
- Contact: allowed if the contact is linked to a listing assigned to the agent.

## Policy Evaluation Flow
1. If user has `admin` role, allow.
2. Otherwise, verify role has the permission key.
3. If granted, apply ownership checks as above.

## Class Diagram (Mermaid)
```mermaid
classDiagram
class User {
  +id: UUID
  +email: string
  +first_name: string
  +last_name: string
}

class Role {
  +id: UUID
  +key: string
  +name: string
}

class Permission {
  +id: UUID
  +key: string
  +description: string
}

class UserRole {
  +user_id: UUID
  +role_id: UUID
}

class RolePermission {
  +role_id: UUID
  +permission_id: UUID
}

class Listing {
  +id: UUID
  +status: ListingStatus
  +assigned_agent_id: UUID
  +owner_contact_id: UUID
}

class Contact {
  +id: UUID
  +role: ContactRole
}

class Inquiry {
  +id: UUID
  +status: InquiryStatus
  +listing_id: UUID
  +contact_id: UUID
}

class Viewing {
  +id: UUID
  +status: ViewingStatus
  +listing_id: UUID
  +contact_id: UUID
}

class Offer {
  +id: UUID
  +status: OfferStatus
  +listing_id: UUID
  +contact_id: UUID
}

class Task {
  +id: UUID
  +status: TaskStatus
  +assignee_id: UUID
  +related_entity_type: string
  +related_entity_id: UUID
}

class Note {
  +id: UUID
  +body: string
  +author_id: UUID
  +related_entity_type: string
  +related_entity_id: UUID
}

User "1" --> "0..*" UserRole
Role "1" --> "0..*" UserRole
Role "1" --> "0..*" RolePermission
Permission "1" --> "0..*" RolePermission

User "1" --> "0..*" Listing : assigned_agent
Contact "1" --> "0..*" Listing : owner

Listing "1" --> "0..*" Inquiry
Listing "1" --> "0..*" Viewing
Listing "1" --> "0..*" Offer

Contact "1" --> "0..*" Inquiry
Contact "1" --> "0..*" Viewing
Contact "1" --> "0..*" Offer

User "1" --> "0..*" Task : assignee
User "1" --> "0..*" Note : author
```

## ERD (Mermaid)
```mermaid
erDiagram
  USERS {
    uuid id PK
    string email
    string first_name
    string last_name
  }

  ROLES {
    uuid id PK
    string key
    string name
    string description
  }

  PERMISSIONS {
    uuid id PK
    string key
    string description
  }

  USER_ROLES {
    uuid id PK
    uuid user_id FK
    uuid role_id FK
  }

  ROLE_PERMISSIONS {
    uuid id PK
    uuid role_id FK
    uuid permission_id FK
  }

  USERS ||--o{ USER_ROLES : has
  ROLES ||--o{ USER_ROLES : has
  ROLES ||--o{ ROLE_PERMISSIONS : has
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : has

  LISTINGS {
    uuid id PK
    uuid assigned_agent_id FK
    uuid owner_contact_id FK
    string status
  }

  CONTACTS {
    uuid id PK
    string role
    string first_name
    string last_name
    string email
    string phone
  }

  INQUIRIES {
    uuid id PK
    uuid listing_id FK
    uuid contact_id FK
    string status
    string source
    string intent
    decimal budget
  }

  VIEWINGS {
    uuid id PK
    uuid listing_id FK
    uuid contact_id FK
    uuid agent_id FK
    string status
    datetime scheduled_at
  }

  OFFERS {
    uuid id PK
    uuid listing_id FK
    uuid contact_id FK
    string status
    decimal amount
  }

  TASKS {
    uuid id PK
    uuid assignee_id FK
    string status
    string related_entity_type
    uuid related_entity_id
    date due_date
  }

  NOTES {
    uuid id PK
    uuid author_id FK
    string body
    string related_entity_type
    uuid related_entity_id
  }

  LISTING_MEDIA {
    uuid id PK
    uuid listing_id FK
    string url
    string type
    int sort_order
  }

  USERS ||--o{ LISTINGS : assigned_agent
  CONTACTS ||--o{ LISTINGS : owner

  LISTINGS ||--o{ INQUIRIES : has
  LISTINGS ||--o{ VIEWINGS : has
  LISTINGS ||--o{ OFFERS : has

  CONTACTS ||--o{ INQUIRIES : initiates
  CONTACTS ||--o{ VIEWINGS : attends
  CONTACTS ||--o{ OFFERS : makes

  LISTINGS ||--o{ LISTING_MEDIA : media

  USERS ||--o{ VIEWINGS : agent
  USERS ||--o{ TASKS : assignee
  USERS ||--o{ NOTES : author
```

## Success Criteria
- Admin can access and manage all records.
- Agent can only access records tied to listings they own.
- Roles and permissions can be extended without schema changes.

## Testing Approach
- Unit tests for permission checks and ownership scope.
- Policy tests for each resource and action.
- Integration test for agent access boundaries.
