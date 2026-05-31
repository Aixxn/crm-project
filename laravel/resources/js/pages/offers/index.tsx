import { Head, Link, router } from '@inertiajs/react';
import {
    CircleDollarSign,
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
import offers from '@/routes/offers';
import {
    contactName,
    money,
    Pagination,
    StatusBadge,
} from '../workflow-support';
import type { ListingOption } from '../workflow-support';
import type { OfferStatus, PaginatedOffers } from './types';

type OfferIndexProps = {
    offers: PaginatedOffers;
    filters: { status?: OfferStatus; listing_id?: string };
    listings: ListingOption[];
};

const statuses: Array<OfferStatus | 'All'> = [
    'All',
    'Submitted',
    'Accepted',
    'Rejected',
    'Withdrawn',
];

export default function OfferIndex({
    offers: paginated,
    filters,
    listings,
}: OfferIndexProps) {
    const [status, setStatus] = useState<string>(filters.status ?? 'All');
    const [listingId, setListingId] = useState<string>(
        filters.listing_id ?? 'All',
    );
    const applyFilters = () =>
        router.get(
            offers.index().url,
            {
                status: status === 'All' ? undefined : status,
                listing_id: listingId === 'All' ? undefined : listingId,
            },
            { preserveState: true, replace: true },
        );

    return (
        <>
            <Head title="Offers" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-950">
                                Offers
                            </h1>
                            <p className="mt-1 text-sm text-neutral-600">
                                {paginated.total} submitted property offers.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href={offers.create()}>
                                <Plus />
                                New offer
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="p-4 md:p-6">
                    <section className="rounded-md border border-[#C3C6D7] bg-white">
                        <div className="grid gap-3 border-b border-[#C3C6D7]/70 p-3 md:grid-cols-[12rem_minmax(0,1fr)_auto]">
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
                            <Select
                                value={listingId}
                                onValueChange={setListingId}
                            >
                                <SelectTrigger className="w-full bg-white">
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
                            <table className="w-full min-w-[820px] text-left text-sm">
                                <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Offer</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Listing</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Notes</th>
                                        <th className="px-4 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#C3C6D7]/60">
                                    {paginated.data.map((offer) => (
                                        <tr
                                            key={offer.id}
                                            className="bg-white hover:bg-[#FAF8FF]"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex gap-3">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#C3C6D7] bg-[#FAF8FF]">
                                                        <CircleDollarSign className="size-4 text-neutral-700" />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={offers.show(
                                                                offer,
                                                            )}
                                                            className="font-medium text-neutral-950 hover:underline"
                                                        >
                                                            {money(
                                                                offer.amount,
                                                            )}
                                                        </Link>
                                                        <div className="mt-1 text-xs text-neutral-500">
                                                            Offer amount
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <StatusBadge
                                                    status={offer.status}
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-neutral-700">
                                                {offer.listing?.address ?? '-'}
                                            </td>
                                            <td className="px-4 py-4 text-neutral-700">
                                                {contactName(offer.contact)}
                                            </td>
                                            <td className="max-w-xs px-4 py-4 text-neutral-600">
                                                <span className="line-clamp-2">
                                                    {offer.notes || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        asChild
                                                        aria-label="View offer"
                                                    >
                                                        <Link
                                                            href={offers.show(
                                                                offer,
                                                            )}
                                                        >
                                                            <Eye />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        asChild
                                                        aria-label="Edit offer"
                                                    >
                                                        <Link
                                                            href={offers.edit(
                                                                offer,
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
                                No offers match the current filters.
                            </div>
                        )}
                        <Pagination paginated={paginated} />
                    </section>
                </div>
            </main>
        </>
    );
}

OfferIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Offers', href: offers.index() },
    ],
};
