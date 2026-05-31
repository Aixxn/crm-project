import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import contacts from '@/routes/contacts';
import listings from '@/routes/listings';
import viewings from '@/routes/viewings';
import { contactName, formatDateTime, StatusBadge } from '../workflow-support';
import type { ViewingSummary } from './types';

type ViewingShowProps = { viewing: ViewingSummary };

export default function ViewingShow({ viewing }: ViewingShowProps) {
    const destroyViewing = () => {
        if (window.confirm('Delete this viewing?')) {
            router.delete(viewings.destroy(viewing).url);
        }
    };

    return (
        <>
            <Head title="Viewing detail" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="mb-2 -ml-2"
                            >
                                <Link href={viewings.index()}>
                                    <ArrowLeft />
                                    Viewings
                                </Link>
                            </Button>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-xl font-semibold text-neutral-950">
                                    {formatDateTime(viewing.scheduled_at)}
                                </h1>
                                <StatusBadge status={viewing.status} />
                            </div>
                            <p className="mt-2 text-sm text-neutral-600">
                                {viewing.agent?.name ?? 'Unassigned'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href={viewings.edit(viewing)}>
                                    <Pencil />
                                    Edit
                                </Link>
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={destroyViewing}
                            >
                                <Trash2 />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
                    <Panel title="Listing">
                        {viewing.listing ? (
                            <Link
                                className="font-medium hover:underline"
                                href={listings.show(viewing.listing)}
                            >
                                {viewing.listing.address}
                            </Link>
                        ) : (
                            '-'
                        )}
                    </Panel>
                    <Panel title="Contact">
                        {viewing.contact ? (
                            <Link
                                className="font-medium hover:underline"
                                href={contacts.show(viewing.contact)}
                            >
                                {contactName(viewing.contact)}
                            </Link>
                        ) : (
                            '-'
                        )}
                    </Panel>
                    <Panel title="Agent">{viewing.agent?.name ?? '-'}</Panel>
                </div>
            </main>
        </>
    );
}

ViewingShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Viewings', href: viewings.index() },
        { title: 'Detail', href: viewings.show({ viewing: ':viewing' }) },
    ],
};

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-md border border-[#C3C6D7] bg-white p-4 text-sm">
            <h2 className="mb-3 font-semibold text-neutral-950">{title}</h2>
            <div className="text-neutral-700">{children}</div>
        </section>
    );
}
