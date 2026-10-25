import type { LifecycleOperation } from '@/types/lifecycle';
import type { InquiryStatus } from '@/types/workflow';
export type { InquiryStatus };
import type { NewContactInput } from '../contacts/types';
import type {
    ContactOption,
    ListingOption,
    Paginated,
} from '../workflow-support';

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
    operation: LifecycleOperation;
    reason: string;
    new_contact: NewContactInput | null;
    listing_id: string;
    contact_id: string;
    status: InquiryStatus;
    source: string;
    intent: string;
    budget: string;
};

export type PaginatedInquiries = Paginated<InquirySummary>;
