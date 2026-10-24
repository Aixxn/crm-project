import type { LifecycleOperation } from '@/types/lifecycle';
import type {
    AgentOption,
    ContactOption,
    ListingOption,
    Paginated,
} from '../workflow-support';

export type ViewingStatus =
    | 'Requested'
    | 'Scheduled'
    | 'Completed'
    | 'No Show'
    | 'Cancelled';

export type ViewingSummary = {
    id: string;
    listing_id: string;
    contact_id: string;
    agent_id: number;
    status: ViewingStatus;
    scheduled_at: string;
    created_at: string;
    updated_at: string;
    listing?: ListingOption | null;
    contact?: ContactOption | null;
    agent?: AgentOption | null;
};

export type ViewingFormData = {
    operation: LifecycleOperation;
    reason: string;
    listing_id: string;
    contact_id: string;
    agent_id: string;
    status: ViewingStatus;
    scheduled_at: string;
};

export type PaginatedViewings = Paginated<ViewingSummary>;
