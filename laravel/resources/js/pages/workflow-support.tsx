import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

export type AgentOption = {
    id: number;
    name: string;
    email: string;
};

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

export function StatusBadge({ status }: { status: string }) {
    const className =
        statusClasses[status] ??
        'border-neutral-300 bg-neutral-100 text-neutral-700';

    return (
        <Badge variant="outline" className={className}>
            {status}
        </Badge>
    );
}

export function EmptyState({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-[#C3C6D7] bg-[#FAF8FF] px-4 text-center text-sm text-neutral-600">
            {children}
        </div>
    );
}

export function Pagination({ paginated }: { paginated: Paginated<unknown> }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C3C6D7]/70 px-4 py-3 text-sm text-neutral-600">
            <span>
                Showing {paginated.from ?? 0}-{paginated.to ?? 0} of{' '}
                {paginated.total}
            </span>
            <div className="flex flex-wrap gap-1">
                {paginated.links.map((link) => (
                    <Button
                        key={`${link.label}-${link.url}`}
                        size="sm"
                        variant={link.active ? 'default' : 'outline'}
                        disabled={!link.url}
                        asChild={Boolean(link.url)}
                    >
                        {link.url ? (
                            <Link href={link.url}>
                                {paginationLabel(link.label)}
                            </Link>
                        ) : (
                            <span>{paginationLabel(link.label)}</span>
                        )}
                    </Button>
                ))}
            </div>
        </div>
    );
}

export function contactName(contact: ContactOption | null | undefined) {
    if (!contact) {
        return '-';
    }

    return `${contact.first_name} ${contact.last_name ?? ''}`.trim();
}

export function money(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(Number(value));
}

export function formatDate(value: string) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

export function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

export function toDatetimeLocal(value: string | null | undefined) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offsetDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
    );

    return offsetDate.toISOString().slice(0, 16);
}

export function relatedEntityKind(type: string) {
    return type.split('\\').pop() ?? type;
}

export function relatedEntityLabel(
    type: string,
    id: string,
    options: RelatedEntityOption[] = [],
    entity?: Record<string, unknown> | null,
) {
    const option = options.find((item) => item.type === type && item.id === id);

    if (option) {
        return option.label;
    }

    if (entity) {
        if (typeof entity.address === 'string') {
            return entity.address;
        }

        if (typeof entity.first_name === 'string') {
            return `${entity.first_name} ${typeof entity.last_name === 'string' ? entity.last_name : ''}`.trim();
        }

        if (typeof entity.amount === 'string' || typeof entity.amount === 'number') {
            return money(entity.amount);
        }
    }

    return id;
}

function paginationLabel(label: string) {
    return label.replace('&laquo;', 'Previous').replace('&raquo;', 'Next');
}

const statusClasses: Record<string, string> = {
    New: 'border-sky-200 bg-sky-50 text-sky-700',
    Contacted: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    Qualified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Converted: 'border-violet-200 bg-violet-50 text-violet-700',
    Closed: 'border-neutral-300 bg-neutral-100 text-neutral-700',
    Scheduled: 'border-sky-200 bg-sky-50 text-sky-700',
    Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    'No Show': 'border-amber-200 bg-amber-50 text-amber-700',
    Cancelled: 'border-red-200 bg-red-50 text-red-700',
    Submitted: 'border-sky-200 bg-sky-50 text-sky-700',
    Accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Rejected: 'border-red-200 bg-red-50 text-red-700',
    Withdrawn: 'border-neutral-300 bg-neutral-100 text-neutral-700',
    Open: 'border-sky-200 bg-sky-50 text-sky-700',
    'In Progress': 'border-amber-200 bg-amber-50 text-amber-700',
    Done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};
