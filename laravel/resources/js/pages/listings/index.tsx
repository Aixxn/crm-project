import { Head, Link, router } from '@inertiajs/react';
import {
    Bath,
    BedDouble,
    ImageIcon,
    ListFilter,
    MapPin,
    Pencil,
    Plus,
    Ruler,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { money } from '@/lib/format';
import { dashboard } from '@/routes';
import listings from '@/routes/listings';
import type {
    AgentSummary,
    ListingStatus,
    ListingSummary,
    PaginatedListings,
} from './types';

type ListingIndexProps = {
    listings: PaginatedListings;
    filters: {
        search?: string;
        status?: ListingStatus;
    };
};

const statuses: Array<ListingStatus | 'All Active'> = [
    'All Active',
    'Draft',
    'Active',
    'Under Offer',
    'Closed',
    'Closed Lost',
];

export default function ListingIndex({
    listings: paginated,
    filters,
}: ListingIndexProps) {
    const [search, setSearch] = useString(filters.search ?? '');
    const [status, setStatus] = useString(filters.status ?? 'All Active');

    const applyFilters = () => {
        router.get(
            listings.index().url,
            {
                search: search || undefined,
                status: status === 'All Active' ? undefined : status,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('All Active');
        router.get(listings.index().url, {}, { replace: true });
    };

    return (
        <>
            <Head title="Properties" />
            <main className="min-h-full bg-background text-foreground">
                <section className="px-6 py-7">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                Properties
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Manage and track your active inventory
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex rounded-sm border border-border bg-card p-1 text-sm">
                                <span
                                    className="inline-flex h-9 items-center rounded-sm bg-muted px-4 font-semibold"
                                    aria-current="page"
                                >
                                    List
                                </span>
                                <span className="inline-flex h-9 items-center px-4 font-medium text-muted-foreground">
                                    Map unavailable
                                </span>
                            </div>
                            <Button
                                asChild
                                className="h-10 rounded-sm bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                            >
                                <Link href={listings.create()}>
                                    <Plus className="size-4" />
                                    Add Listing
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-4 rounded-sm border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 font-medium tracking-wide uppercase">
                            <ListFilter className="size-4" />
                            Filters
                        </div>
                        <Divider />
                        <label className="flex items-center gap-2">
                            <span>Status:</span>
                            <select
                                value={status}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setStatus(value);
                                    router.get(
                                        listings.index().url,
                                        {
                                            search: search || undefined,
                                            status:
                                                value === 'All Active'
                                                    ? undefined
                                                    : value,
                                        },
                                        { preserveState: true, replace: true },
                                    );
                                }}
                                className="rounded-sm bg-transparent font-medium text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                                {statuses.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Divider />
                        <span className="flex items-center gap-2">
                            <span>Price: Any</span>
                        </span>
                        <Divider />
                        <label className="flex min-w-60 flex-1 items-center gap-2">
                            <MapPin className="size-4" />
                            <input
                                value={search}
                                aria-label="Search listings by neighborhood, city, or ZIP"
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        applyFilters();
                                    }
                                }}
                                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                placeholder="Neighborhood, City, or Zip"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="ml-auto text-xs font-semibold text-primary"
                        >
                            Clear
                        </button>
                    </div>

                    <section className="mt-8 overflow-hidden rounded-md border border-border bg-card">
                        <div className="grid min-w-[55rem] grid-cols-[minmax(18rem,1fr)_8rem_9rem_10rem_10rem_8rem] items-center bg-muted px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            <div>Property</div>
                            <div>Status</div>
                            <div>Price</div>
                            <div>Specs</div>
                            <div>Agent</div>
                            <div className="text-right">Actions</div>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="min-w-[55rem] divide-y divide-border">
                                {paginated.data.map((listing) => (
                                    <PropertyRow
                                        key={listing.id}
                                        listing={listing}
                                    />
                                ))}
                            </div>
                        </div>

                        {paginated.data.length === 0 && (
                            <EmptyState>
                                No listings match the current filters.
                            </EmptyState>
                        )}
                        <Pagination paginated={paginated} />
                    </section>
                </section>
            </main>
        </>
    );
}

ListingIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Listings',
            href: listings.index(),
        },
    ],
};

function PropertyRow({ listing }: { listing: ListingSummary }) {
    const image = listing.media?.[0]?.url;

    return (
        <div className="grid grid-cols-[minmax(18rem,1fr)_8rem_9rem_10rem_10rem_8rem] items-center px-4 py-3 text-sm">
            <div className="flex min-w-0 items-center gap-4">
                <Link
                    href={listings.show(listing)}
                    className="block size-16 shrink-0 overflow-hidden rounded-sm border border-border bg-muted"
                >
                    {image ? (
                        <img
                            src={image}
                            alt={listing.address}
                            className="size-full object-cover"
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="size-5" />
                        </div>
                    )}
                </Link>
                <div className="min-w-0">
                    <Link
                        href={listings.show(listing)}
                        className="truncate font-semibold text-foreground hover:text-primary"
                    >
                        {listing.address}
                    </Link>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                        {listing.property_type || 'Unspecified type'}
                    </div>
                </div>
            </div>
            <div>
                <StatusBadge domain="listing" status={listing.status} />
            </div>
            <div className="font-semibold text-foreground">
                {listing.status === 'Draft' ? 'TBD' : money(listing.price)}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Spec icon={<BedDouble />} label={listing.bedrooms ?? '-'} />
                <Spec icon={<Bath />} label={listing.bathrooms ?? '-'} />
                <Spec icon={<Ruler />} label={listing.area_sqft ?? '-'} />
            </div>
            <AgentCell agent={listing.assigned_agent} />
            <div className="flex justify-end gap-2">
                <Link
                    href={listings.show(listing)}
                    className="inline-flex h-8 items-center rounded-sm border border-border px-3 text-xs font-semibold hover:bg-muted"
                >
                    View
                </Link>
                <Link
                    href={listings.edit(listing)}
                    className="inline-flex h-8 items-center rounded-sm border border-border px-2 text-muted-foreground hover:bg-muted"
                    aria-label="Edit listing"
                >
                    <Pencil className="size-4" />
                </Link>
            </div>
        </div>
    );
}

function AgentCell({ agent }: { agent?: AgentSummary | null }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-status-info text-[0.65rem] font-semibold text-status-info-foreground">
                {initials(agent?.name ?? 'Unassigned')}
            </div>
            <span className="truncate text-sm text-foreground">
                {shortName(agent?.name) ?? '-'}
            </span>
        </div>
    );
}

function Spec({ icon, label }: { icon: ReactNode; label: string | number }) {
    return (
        <span className="inline-flex items-center gap-1 [&_svg]:size-3.5">
            {icon}
            {label}
        </span>
    );
}

function Divider() {
    return <span className="h-6 w-px bg-border" />;
}

function initials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function shortName(name?: string | null) {
    if (!name) {
        return null;
    }

    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length < 2) {
        return name;
    }

    return `${parts[0][0]}. ${parts.at(-1)}`;
}

function useString(initialValue: string): [string, (value: string) => void] {
    const state = useState(initialValue);

    return state;
}
