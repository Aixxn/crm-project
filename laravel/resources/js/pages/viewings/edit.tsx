import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import viewings from '@/routes/viewings';
import type {
    AgentOption,
    ContactOption,
    ListingOption,
} from '../workflow-support';
import { ViewingForm } from './_components/viewing-form';
import type { ViewingSummary } from './types';

type EditViewingProps = {
    viewing: ViewingSummary;
    listings: ListingOption[];
    contacts: ContactOption[];
    agents: AgentOption[];
};

export default function EditViewing({
    viewing,
    listings,
    contacts,
    agents,
}: EditViewingProps) {
    return (
        <>
            <Head title="Edit viewing" />
            <main className="min-h-full bg-muted">
                <div className="border-b border-border bg-card px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-foreground">
                        Edit viewing
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {viewing.status}
                    </p>
                </div>
                <ViewingForm
                    viewing={viewing}
                    listings={listings}
                    contacts={contacts}
                    agents={agents}
                />
            </main>
        </>
    );
}

EditViewing.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Viewings', href: viewings.index() },
        { title: 'Edit', href: viewings.edit({ viewing: ':viewing' }) },
    ],
};
