import type {
    InquiryStatus,
    ListingStatus,
    OfferStatus,
    TaskStatus,
    ViewingStatus,
} from '@/types/workflow';

export type WorkflowDomain =
    | 'listing'
    | 'inquiry'
    | 'viewing'
    | 'offer'
    | 'task';
export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const statusTones = {
    listing: {
        Draft: 'neutral',
        Active: 'success',
        'Under Offer': 'warning',
        Closed: 'success',
        'Closed Lost': 'neutral',
    } satisfies Record<ListingStatus, StatusTone>,
    inquiry: {
        New: 'info',
        Contacted: 'info',
        Qualified: 'success',
        Converted: 'success',
        Closed: 'neutral',
    } satisfies Record<InquiryStatus, StatusTone>,
    viewing: {
        Requested: 'warning',
        Scheduled: 'info',
        Completed: 'success',
        'No Show': 'warning',
        Cancelled: 'neutral',
    } satisfies Record<ViewingStatus, StatusTone>,
    offer: {
        Submitted: 'info',
        Accepted: 'success',
        Rejected: 'danger',
        Withdrawn: 'neutral',
    } satisfies Record<OfferStatus, StatusTone>,
    task: {
        Open: 'info',
        'In Progress': 'warning',
        Done: 'success',
    } satisfies Record<TaskStatus, StatusTone>,
};

export type StatusPresentation = { label: string; tone: StatusTone };

export function statusPresentation(
    domain: WorkflowDomain,
    status: string,
): StatusPresentation {
    const domainStatuses: Readonly<Record<string, StatusTone>> =
        statusTones[domain];
    const tone = Object.hasOwn(domainStatuses, status)
        ? domainStatuses[status]
        : undefined;

    if (tone) {
        return { label: status, tone };
    }

    return { label: status.trim() || 'Unknown status', tone: 'neutral' };
}

export function workflowStatusValues(
    domain: WorkflowDomain,
): readonly string[] {
    return Object.keys(statusTones[domain]);
}
