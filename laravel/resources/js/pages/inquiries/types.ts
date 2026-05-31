import type {
    ContactOption,
    ListingOption,
    Paginated,
} from '../workflow-support';

export type InquiryStatus =
    | 'New'
    | 'Contacted'
    | 'Qualified'
    | 'Converted'
    | 'Closed';

export type InquirySummary = {
    id: string;
    listing_id: string;
    contact_id: string;
    status: InquiryStatus;
    source: string;
    intent: string;
    budget: string | null;
    created_at: string;
    updated_at: string;
    listing?: ListingOption | null;
    contact?: ContactOption | null;
};

export type InquiryFormData = {
    listing_id: string;
    contact_id: string;
    status: InquiryStatus;
    source: string;
    intent: string;
    budget: string;
};

export type PaginatedInquiries = Paginated<InquirySummary>;
