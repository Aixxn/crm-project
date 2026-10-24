export type ContactRole = 'Owner' | 'Buyer' | 'Tenant';

export type ContactSummary = {
    id: string;
    can_update?: boolean;
    can_delete?: boolean;
    role: ContactRole;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type ContactFormData = {
    role: ContactRole;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    notes: string;
};

export type RelatedListing = {
    id: string;
    status: string;
    address: string;
    property_type: string | null;
    price: string;
    created_at: string;
};

export type RelatedInquiry = {
    id: string;
    status: string;
    source: string | null;
    intent: string | null;
    budget: string | null;
    created_at: string;
    listing?: RelatedListing | null;
};

export type RelatedViewing = {
    id: string;
    status: string;
    scheduled_at: string;
    listing?: RelatedListing | null;
};

export type RelatedOffer = {
    id: string;
    status: string;
    amount: string;
    notes: string | null;
    created_at: string;
    listing?: RelatedListing | null;
};

export type ContactDetail = ContactSummary & {
    owned_listings?: RelatedListing[];
    inquiries?: RelatedInquiry[];
    viewings?: RelatedViewing[];
    offers?: RelatedOffer[];
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginatedContacts = {
    data: ContactSummary[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

export type NewContactInput = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
};
