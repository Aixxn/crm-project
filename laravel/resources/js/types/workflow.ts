import type { User } from '@/types';

export type ContactOption = {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
};

export type ListingOption = {
    id: string;
    address: string;
    assigned_agent_id?: number;
};

export type AgentOption = Pick<User, 'id' | 'name' | 'email'>;

export type RelatedEntityOption = {
    id: string;
    type: string;
    kind: string;
    label: string;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

export type ListingStatus =
    | 'Draft'
    | 'Active'
    | 'Under Offer'
    | 'Closed'
    | 'Closed Lost';
export type InquiryStatus =
    | 'New'
    | 'Contacted'
    | 'Qualified'
    | 'Converted'
    | 'Closed';
export type ViewingStatus =
    | 'Requested'
    | 'Scheduled'
    | 'Completed'
    | 'No Show'
    | 'Cancelled';
export type OfferStatus = 'Submitted' | 'Accepted' | 'Rejected' | 'Withdrawn';
export type TaskStatus = 'Open' | 'In Progress' | 'Done';
export type WorkflowStatus =
    | ListingStatus
    | InquiryStatus
    | ViewingStatus
    | OfferStatus
    | TaskStatus;
