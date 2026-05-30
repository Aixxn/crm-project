import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import listings from '@/routes/listings';
import { ListingForm } from './_components/listing-form';
import type { AgentSummary, ContactSummary } from './types';

type CreateListingProps = {
    agents: AgentSummary[];
    owners: ContactSummary[];
};

export default function CreateListing({ agents, owners }: CreateListingProps) {
    return (
        <>
            <Head title="Create listing" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-neutral-950">
                        Create listing
                    </h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        Add the property record, owner, assignment, and launch
                        status.
                    </p>
                </div>
                <ListingForm agents={agents} owners={owners} />
            </main>
        </>
    );
}

CreateListing.layout = {
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
            title: 'Create',
            href: listings.create(),
        },
    ],
};
