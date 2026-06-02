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
            <main className="min-h-full bg-[#f7f5fc] text-[#1f2330]">
                <div className="border-b border-[#c4c8d9] bg-white px-6 py-5">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Create listing
                    </h1>
                    <p className="mt-2 text-sm text-[#596071]">
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
