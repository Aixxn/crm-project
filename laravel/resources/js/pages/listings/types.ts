import type { User } from '@/types';

export type ListingStatus =
    | 'Draft'
    | 'Active'
    | 'Under Offer'
    | 'Closed'
    | 'Closed Lost';

export type ContactSummary = {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
};

export type AgentSummary = Pick<User, 'id' | 'name' | 'email'>;

export type ListingMediaSummary = {
    id: string;
    url: string;
    type: string;
    sort_order?: number | null;
};

export type ListingSummary = {
    id: string;
    assigned_agent_id: number;
    owner_contact_id: string;
    status: ListingStatus;
    address: string;
    property_type: string | null;
    price: string;
    bedrooms: number | null;
    bathrooms: string | null;
    area_sqft: number | null;
    created_at: string;
    updated_at: string;
    assigned_agent?: AgentSummary | null;
    owner?: ContactSummary | null;
    media?: ListingMediaSummary[];
};

export type ListingFormData = {
    assigned_agent_id: string;
    owner_contact_id: string;
    status: ListingStatus;
    address: string;
    property_type: string;
    price: string;
    bedrooms: string;
    bathrooms: string;
    area_sqft: string;
    images: File[];
};

export type InquirySummary = {
    id: string;
    status: string;
    source: string | null;
    intent: string | null;
    budget: string | null;
    created_at: string;
    contact?: ContactSummary | null;
};

export type ViewingSummary = {
    id: string;
    status: string;
    scheduled_at: string;
    contact?: ContactSummary | null;
    agent?: AgentSummary | null;
};

export type OfferSummary = {
    id: string;
    status: string;
    amount: string;
    notes: string | null;
    created_at: string;
    contact?: ContactSummary | null;
};

export type TaskSummary = {
    id: string;
    title: string;
    due_date: string | null;
    status: string;
    assignee?: AgentSummary | null;
};

export type NoteSummary = {
    id: string;
    body: string;
    created_at: string;
    author?: AgentSummary | null;
};

export type ListingDetail = ListingSummary & {
    inquiries?: InquirySummary[];
    viewings?: ViewingSummary[];
    offers?: OfferSummary[];
    tasks?: TaskSummary[];
    notes?: NoteSummary[];
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginatedListings = {
    data: ListingSummary[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};
