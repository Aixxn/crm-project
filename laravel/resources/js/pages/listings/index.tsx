import { Head, Link, router } from '@inertiajs/react';
import {
    Bath,
    BedDouble,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ImageIcon,
    ListFilter,
    MapPin,
    Pencil,
    Plus,
    Ruler,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
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
            <main className="min-h-full bg-[#f7f5fc] text-[#1f2330]">
                <section className="px-6 py-7">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                Properties
                            </h1>
                            <p className="mt-2 text-sm text-[#596071]">
                                Manage and track your active inventory
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex rounded-sm border border-[#c4c8d9] bg-white p-1 text-sm">
                                <button className="h-9 rounded-sm bg-[#eef1fb] px-4 font-semibold">
                                    List
                                </button>
                                <button className="h-9 px-4 font-medium text-[#4f5668]">
                                    Map
                                </button>
                            </div>
                            <Button
                                asChild
                                className="h-10 rounded-sm bg-blue-700 px-5 text-white hover:bg-blue-800"
                            >
                                <Link href={listings.create()}>
                                    <Plus className="size-4" />
                                    Add Listing
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-4 rounded-sm border border-[#c4c8d9] bg-white px-4 py-3 text-sm text-[#4f5668]">
                        <div className="flex items-center gap-2 font-medium uppercase tracking-wide">
                            <ListFilter className="size-4" />
                            Filters
                        </div>
                        <Divider />
                        <label className="flex items-center gap-2">
                            <span>Status:</span>
                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="bg-transparent font-medium text-[#202432] outline-none"
                            >
                                {statuses.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="size-4" />
                        </label>
                        <Divider />
                        <button className="flex items-center gap-2">
                            <span>Price: Any</span>
                            <ChevronDown className="size-4" />
                        </button>
                        <Divider />
                        <label className="flex min-w-60 flex-1 items-center gap-2">
                            <MapPin className="size-4" />
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        applyFilters();
                                    }
                                }}
                                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#707789]"
                                placeholder="Neighborhood, City, or Zip"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="ml-auto text-xs font-semibold text-blue-700"
                        >
                            Clear
                        </button>
                    </div>

                    <section className="mt-8 overflow-hidden rounded-md border border-[#c4c8d9] bg-white">
                        <div className="grid min-w-[58rem] grid-cols-[3rem_minmax(18rem,1fr)_8rem_9rem_10rem_10rem_8rem] items-center bg-[#eef1fb] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#5e6475]">
                            <input type="checkbox" className="size-4" />
                            <div>Property</div>
                            <div>Status</div>
                            <div>Price</div>
                            <div>Specs</div>
                            <div>Agent</div>
                            <div className="text-right">Actions</div>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="min-w-[58rem] divide-y divide-[#d8dbea]">
                                {paginated.data.map((listing) => (
                                    <PropertyRow
                                        key={listing.id}
                                        listing={listing}
                                    />
                                ))}
                            </div>
                        </div>

                        {paginated.data.length === 0 && (
                            <div className="px-4 py-14 text-center text-sm text-[#687083]">
                                No listings match the current filters.
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d8dbea] px-4 py-3 text-sm text-[#596071]">
                            <span>
                                Showing {paginated.from ?? 0} to{' '}
                                {paginated.to ?? 0} of {paginated.total} entries
                            </span>
                            <div className="flex items-center gap-2">
                                {uniquePaginationLinks(paginated.links).map((link) => (
                                    <PaginationLink
                                        key={`${link.label}-${link.url}`}
                                        label={paginationLabel(link.label)}
                                        url={link.url}
                                        active={link.active}
                                    />
                                ))}
                            </div>
                        </div>
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
        <div className="grid grid-cols-[3rem_minmax(18rem,1fr)_8rem_9rem_10rem_10rem_8rem] items-center px-4 py-3 text-sm">
            <input type="checkbox" className="size-4" />
            <div className="flex min-w-0 items-center gap-4">
                <Link
                    href={listings.show(listing)}
                    className="block size-16 shrink-0 overflow-hidden rounded-sm border border-[#cfd3e3] bg-[#eef1fb]"
                >
                    {image ? (
                        <img
                            src={image}
                            alt={listing.address}
                            className="size-full object-cover"
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center text-[#858b9b]">
                            <ImageIcon className="size-5" />
                        </div>
                    )}
                </Link>
                <div className="min-w-0">
                    <Link
                        href={listings.show(listing)}
                        className="truncate font-semibold text-[#1f2330] hover:text-blue-700"
                    >
                        {listing.address}
                    </Link>
                    <div className="mt-1 truncate text-xs text-[#687083]">
                        {listing.property_type || 'Unspecified type'}
                    </div>
                </div>
            </div>
            <div>
                <StatusPill status={listing.status} />
            </div>
            <div className="font-semibold text-[#1f2330]">
                {listing.status === 'Draft' ? 'TBD' : money(listing.price)}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f6677]">
                <Spec icon={<BedDouble />} label={listing.bedrooms ?? '-'} />
                <Spec icon={<Bath />} label={listing.bathrooms ?? '-'} />
                <Spec icon={<Ruler />} label={listing.area_sqft ?? '-'} />
            </div>
            <AgentCell agent={listing.assigned_agent} />
            <div className="flex justify-end gap-2">
                <Link
                    href={listings.show(listing)}
                    className="inline-flex h-8 items-center rounded-sm border border-[#c4c8d9] px-3 text-xs font-semibold hover:bg-[#eef1fb]"
                >
                    View
                </Link>
                <Link
                    href={listings.edit(listing)}
                    className="inline-flex h-8 items-center rounded-sm border border-[#c4c8d9] px-2 text-[#4f5668] hover:bg-[#eef1fb]"
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
            <div className="flex size-7 items-center justify-center rounded-full bg-[#dfe6f6] text-[0.65rem] font-semibold text-blue-800">
                {initials(agent?.name ?? 'Unassigned')}
            </div>
            <span className="truncate text-sm text-[#2d3242]">
                {shortName(agent?.name) ?? '-'}
            </span>
        </div>
    );
}

function StatusPill({ status }: { status: ListingStatus }) {
    const classes: Record<ListingStatus, string> = {
        Draft: 'bg-[#e5e7ef] text-[#686e7e]',
        Active: 'bg-[#e7f0ff] text-blue-700',
        'Under Offer': 'bg-[#ffe8dd] text-[#b24a1b]',
        Closed: 'bg-[#e5f5ef] text-[#08784f]',
        'Closed Lost': 'bg-[#fee2e2] text-[#b91c1c]',
    };

    return (
        <span
            className={`inline-flex h-7 items-center rounded-sm px-3 text-xs font-semibold ${classes[status]}`}
        >
            {status}
        </span>
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

function PaginationLink({
    label,
    url,
    active,
}: {
    label: string;
    url: string | null;
    active: boolean;
}) {
    const content =
        label === 'Previous' ? (
            <ChevronLeft className="size-4" />
        ) : label === 'Next' ? (
            <ChevronRight className="size-4" />
        ) : (
            label
        );
    const classes = active
        ? 'bg-blue-700 text-white'
        : 'border border-transparent text-[#4f5668] hover:border-[#c4c8d9] hover:bg-[#eef1fb]';

    if (!url) {
        return (
            <span
                className={`inline-flex size-9 items-center justify-center rounded-sm opacity-50 ${classes}`}
            >
                {content}
            </span>
        );
    }

    return (
        <Link
            href={url}
            className={`inline-flex size-9 items-center justify-center rounded-sm text-sm font-semibold ${classes}`}
        >
            {content}
        </Link>
    );
}

function Divider() {
    return <span className="h-6 w-px bg-[#cfd3e3]" />;
}

function money(value: string | number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(Number(value));
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

function paginationLabel(label: string) {
    const normalized = label
        .replace(/&laquo;|«/g, '')
        .replace(/&raquo;|»/g, '')
        .trim();

    if (/previous/i.test(normalized)) {
        return 'Previous';
    }

    if (/next/i.test(normalized)) {
        return 'Next';
    }

    return normalized;
}

function uniquePaginationLinks(links: PaginatedListings['links']) {
    const seen = new Set<string>();

    return links.filter((link) => {
        const label = paginationLabel(link.label);
        const key =
            label === 'Previous' || label === 'Next'
                ? label
                : `${label}-${link.url ?? 'disabled'}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;
    });
}

function useString(initialValue: string): [string, (value: string) => void] {
    const state = useState(initialValue);

    return state;
}
