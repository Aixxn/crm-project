import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import viewings from '@/routes/viewings';
import type {
    AgentOption,
    ContactOption,
    ListingOption,
} from '../workflow-support';
import { ViewingForm } from './_components/viewing-form';

type CreateViewingProps = {
    listings: ListingOption[];
    contacts: ContactOption[];
    agents: AgentOption[];
};

export default function CreateViewing({
    listings,
    contacts,
    agents,
}: CreateViewingProps) {
    return (
        <>
            <Head title="Create viewing" />
            <main className="min-h-full bg-muted">
                <div className="border-b border-border bg-card px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-foreground">
                        Create viewing
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Schedule a property showing with a contact and agent.
                    </p>
                </div>
                <ViewingForm
                    listings={listings}
                    contacts={contacts}
                    agents={agents}
                />
            </main>
        </>
    );
}

CreateViewing.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Viewings', href: viewings.index() },
        { title: 'Create', href: viewings.create() },
    ],
};
