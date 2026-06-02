import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import listings from '@/routes/listings';
import { ListingForm } from './_components/listing-form';
import type { AgentSummary, ContactSummary, ListingSummary } from './types';

type EditListingProps = {
    listing: ListingSummary;
    agents: AgentSummary[];
    owners: ContactSummary[];
};

export default function EditListing({
    listing,
    agents,
    owners,
}: EditListingProps) {
    return (
        <>
            <Head title="Edit listing" />
            <main className="min-h-full bg-[#f7f5fc] text-[#1f2330]">
                <div className="border-b border-[#c4c8d9] bg-white px-6 py-5">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Edit listing
                    </h1>
                    <p className="mt-2 text-sm text-[#596071]">
                        {listing.address}
                    </p>
                </div>
                <ListingForm
                    listing={listing}
                    agents={agents}
                    owners={owners}
                />
            </main>
        </>
    );
}

EditListing.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Listings',
            href: listings.index(),
        },
        {
            title: 'Edit',
            href: listings.edit({ listing: ':listing' }),
        },
    ],
};
