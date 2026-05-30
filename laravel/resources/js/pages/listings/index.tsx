import { Head, Link, router } from '@inertiajs/react';
import {
    Bath,
    BedDouble,
    Building2,
    Eye,
    Pencil,
    Plus,
    Ruler,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import listings from '@/routes/listings';
import type { ListingStatus, PaginatedListings } from './types';

type ListingIndexProps = {
    listings: PaginatedListings;
    filters: {
        search?: string;
        status?: ListingStatus;
    };
};

const statuses: Array<ListingStatus | 'All'> = [
    'All',
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
    const [status, setStatus] = useString(filters.status ?? 'All');

    const applyFilters = () => {
        router.get(
            listings.index().url,
            {
                search: search || undefined,
                status: status === 'All' ? undefined : status,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <>
            <Head title="Listings" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-950">
                                Listings
                            </h1>
                            <p className="mt-1 text-sm text-neutral-600">
                                {paginated.total} records in the active listing
                                workspace.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href={listings.create()}>
                                <Plus />
                                New listing
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="space-y-4 p-4 md:p-6">
                    <section className="rounded-md border border-[#C3C6D7] bg-white">
                        <div className="grid gap-3 border-b border-[#C3C6D7]/70 p-3 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                    className="pl-9"
                                    placeholder="Search address or property type"
                                />
                            </div>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={applyFilters}>
                                <SlidersHorizontal />
                                Apply
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px] text-left text-sm">
                                <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Property</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Price</th>
                                        <th className="px-4 py-3">Specs</th>
                                        <th className="px-4 py-3">Owner</th>
                                        <th className="px-4 py-3">Agent</th>
                                        <th className="px-4 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#C3C6D7]/60">
                                    {paginated.data.map((listing) => (
                                        <tr
                                            key={listing.id}
                                            className="bg-white align-top hover:bg-[#FAF8FF]"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex gap-3">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#C3C6D7] bg-[#FAF8FF] text-neutral-700">
                                                        <Building2 className="size-4" />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={listings.show(
                                                                listing,
                                                            )}
                                                            className="font-medium text-neutral-950 hover:underline"
                                                        >
                                                            {listing.address}
                                                        </Link>
                                                        <div className="mt-1 text-xs text-neutral-500">
                                                            {listing.property_type ||
                                                                'Unspecified type'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <StatusBadge
                                                    status={listing.status}
                                                />
                                            </td>
                                            <td className="px-4 py-4 font-medium text-neutral-950">
                                                {money(listing.price)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
                                                    <Spec
                                                        icon={<BedDouble />}
                                                        label={
                                                            listing.bedrooms ??
                                                            '-'
                                                        }
                                                    />
                                                    <Spec
                                                        icon={<Bath />}
                                                        label={
                                                            listing.bathrooms ??
                                                            '-'
                                                        }
                                                    />
                                                    <Spec
                                                        icon={<Ruler />}
                                                        label={
                                                            listing.area_sqft ??
                                                            '-'
                                                        }
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-neutral-700">
                                                {listing.owner
                                                    ? contactName(listing.owner)
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-neutral-700">
                                                {listing.assigned_agent?.name ??
                                                    '-'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        asChild
                                                        aria-label="View listing"
                                                    >
                                                        <Link
                                                            href={listings.show(
                                                                listing,
                                                            )}
                                                        >
                                                            <Eye />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        asChild
                                                        aria-label="Edit listing"
                                                    >
                                                        <Link
                                                            href={listings.edit(
                                                                listing,
                                                            )}
                                                        >
                                                            <Pencil />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {paginated.data.length === 0 && (
                            <div className="px-4 py-14 text-center text-sm text-neutral-600">
                                No listings match the current filters.
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C3C6D7]/70 px-4 py-3 text-sm text-neutral-600">
                            <span>
                                Showing {paginated.from ?? 0}-
                                {paginated.to ?? 0} of {paginated.total}
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {paginated.links.map((link) => (
                                    <Button
                                        key={`${link.label}-${link.url}`}
                                        size="sm"
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        disabled={!link.url}
                                        asChild={Boolean(link.url)}
                                    >
                                        {link.url ? (
                                            <Link href={link.url}>
                                                {paginationLabel(link.label)}
                                            </Link>
                                        ) : (
                                            <span>
                                                {paginationLabel(link.label)}
                                            </span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
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

function StatusBadge({ status }: { status: ListingStatus }) {
    const classes: Record<ListingStatus, string> = {
        Draft: 'border-neutral-300 bg-neutral-100 text-neutral-700',
        Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        'Under Offer': 'border-amber-200 bg-amber-50 text-amber-700',
        Closed: 'border-sky-200 bg-sky-50 text-sky-700',
        'Closed Lost': 'border-red-200 bg-red-50 text-red-700',
    };

    return (
        <Badge variant="outline" className={classes[status]}>
            {status}
        </Badge>
    );
}

function Spec({ icon, label }: { icon: ReactNode; label: string | number }) {
    return (
        <span className="inline-flex h-7 items-center gap-1 rounded-md border border-[#C3C6D7] px-2">
            {icon}
            {label}
        </span>
    );
}

function money(value: string | number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(Number(value));
}

function contactName(contact: { first_name: string; last_name: string }) {
    return `${contact.first_name} ${contact.last_name}`.trim();
}

function paginationLabel(label: string) {
    return label.replace('&laquo;', 'Previous').replace('&raquo;', 'Next');
}

function useString(initialValue: string): [string, (value: string) => void] {
    const state = useState(initialValue);

    return state;
}
