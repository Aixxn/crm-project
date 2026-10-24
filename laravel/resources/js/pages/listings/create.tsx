import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import listings from '@/routes/listings';
import { ListingForm } from './_components/listing-form';
import type { AgentSummary, ContactSummary } from './types';

type CreateListingProps = {
    canCreateContact?: boolean;
    agents: AgentSummary[];
    owners: ContactSummary[];
};

export default function CreateListing({
    canCreateContact = false,
    agents,
    owners,
}: CreateListingProps) {
    return (
        <>
            <Head title="Create listing" />
            <main className="min-h-full bg-background text-foreground">
                <div className="border-b border-border bg-card px-6 py-5">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Create listing
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Add the property record, owner, assignment, and launch
                        status.
                    </p>
                </div>
                <ListingForm
                    canCreateContact={canCreateContact}
                    agents={agents}
                    owners={owners}
                />
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
