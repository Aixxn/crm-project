import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarClock,
    Eye,
    Pencil,
    Plus,
    SlidersHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import viewings from '@/routes/viewings';
import {
    contactName,
    formatDateTime,
    Pagination,
    StatusBadge,
} from '../workflow-support';
import type { ListingOption } from '../workflow-support';
import type { PaginatedViewings, ViewingStatus } from './types';

type ViewingIndexProps = {
    viewings: PaginatedViewings;
    filters: { status?: ViewingStatus; listing_id?: string };
    listings: ListingOption[];
};

const statuses: Array<ViewingStatus | 'All'> = [
    'All',
    'Requested',
    'Scheduled',
    'Completed',
    'No Show',
    'Cancelled',
];

export default function ViewingIndex({
    viewings: paginated,
    filters,
    listings,
}: ViewingIndexProps) {
    const [status, setStatus] = useState<string>(filters.status ?? 'All');
    const [listingId, setListingId] = useState<string>(
        filters.listing_id ?? 'All',
    );
    const applyFilters = () =>
        router.get(
            viewings.index().url,
            {
                status: status === 'All' ? undefined : status,
                listing_id: listingId === 'All' ? undefined : listingId,
            },
            { preserveState: true, replace: true },
        );

    return (
        <>
            <Head title="Viewings" />
            <main className="min-h-full bg-muted">
                <div className="border-b border-border bg-card px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">
                                Viewings
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {paginated.total} scheduled or completed
                                property viewings.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href={viewings.create()}>
                                <Plus />
                                New viewing
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="p-4 md:p-6">
                    <section className="rounded-md border border-border bg-card">
                        <div className="grid gap-3 border-b border-border/70 p-3 md:grid-cols-[12rem_minmax(0,1fr)_auto]">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-full bg-card">
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
                            <Select
                                value={listingId}
                                onValueChange={setListingId}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue placeholder="Listing" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">
                                        All listings
                                    </SelectItem>
                                    {listings.map((listing) => (
                                        <SelectItem
                                            key={listing.id}
                                            value={listing.id}
                                        >
                                            {listing.address}
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
                                <thead className="bg-muted text-xs font-medium text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Viewing</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Listing</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Agent</th>
                                        <th className="px-4 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {paginated.data.map((viewing) => (
                                        <tr
                                            key={viewing.id}
                                            className="bg-card hover:bg-muted"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex gap-3">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                                                        <CalendarClock className="size-4 text-foreground" />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={viewings.show(
                                                                viewing,
                                                            )}
                                                            className="font-medium text-foreground hover:underline"
                                                        >
                                                            {formatDateTime(
                                                                viewing.scheduled_at,
                                                            )}
                                                        </Link>
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Scheduled
                                                            appointment
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <StatusBadge
                                                    domain="viewing"
                                                    status={viewing.status}
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-foreground">
                                                {viewing.listing?.address ??
                                                    '-'}
                                            </td>
                                            <td className="px-4 py-4 text-foreground">
                                                {contactName(viewing.contact)}
                                            </td>
                                            <td className="px-4 py-4 text-foreground">
                                                {viewing.agent?.name ?? '-'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        asChild
                                                        aria-label="View viewing"
                                                    >
                                                        <Link
                                                            href={viewings.show(
                                                                viewing,
                                                            )}
                                                        >
                                                            <Eye />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        asChild
                                                        aria-label="Edit viewing"
                                                    >
                                                        <Link
                                                            href={viewings.edit(
                                                                viewing,
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
                            <div className="px-4 py-14 text-center text-sm text-muted-foreground">
                                No viewings match the current filters.
                            </div>
                        )}
                        <Pagination paginated={paginated} />
                    </section>
                </div>
            </main>
        </>
    );
}

ViewingIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Viewings', href: viewings.index() },
    ],
};
