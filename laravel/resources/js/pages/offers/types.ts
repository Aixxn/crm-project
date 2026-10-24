import type { LifecycleOperation } from '@/types/lifecycle';
import type {
    ContactOption,
    ListingOption,
    Paginated,
} from '../workflow-support';

export type OfferStatus = 'Submitted' | 'Accepted' | 'Rejected' | 'Withdrawn';

export type OfferSummary = {
    id: string;
    listing_id: string;
    contact_id: string;
    status: OfferStatus;
    amount: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    listing?: ListingOption | null;
    contact?: ContactOption | null;
};

export type OfferFormData = {
    operation: LifecycleOperation;
    reason: string;
    listing_id: string;
    contact_id: string;
    status: OfferStatus;
    amount: string;
    notes: string;
};

export type PaginatedOffers = Paginated<OfferSummary>;
