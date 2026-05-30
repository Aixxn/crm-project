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
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-neutral-950">
                        Edit listing
                    </h1>
                    <p className="mt-1 text-sm text-neutral-600">
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
