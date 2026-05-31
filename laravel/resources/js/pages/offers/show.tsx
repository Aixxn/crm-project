import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import contacts from '@/routes/contacts';
import listings from '@/routes/listings';
import offers from '@/routes/offers';
import { contactName, money, StatusBadge } from '../workflow-support';
import type { OfferSummary } from './types';

type OfferShowProps = { offer: OfferSummary };

export default function OfferShow({ offer }: OfferShowProps) {
    const destroyOffer = () => {
        if (window.confirm('Delete this offer?')) {
            router.delete(offers.destroy(offer).url);
        }
    };

    return (
        <>
            <Head title="Offer detail" />
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
                                <Link href={offers.index()}>
                                    <ArrowLeft />
                                    Offers
                                </Link>
                            </Button>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-xl font-semibold text-neutral-950">
                                    {money(offer.amount)}
                                </h1>
                                <StatusBadge status={offer.status} />
                            </div>
                            <p className="mt-2 text-sm text-neutral-600">
                                {offer.notes || 'No notes recorded.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href={offers.edit(offer)}>
                                    <Pencil />
                                    Edit
                                </Link>
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={destroyOffer}
                            >
                                <Trash2 />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
                    <Panel title="Listing">
                        {offer.listing ? (
                            <Link
                                className="font-medium hover:underline"
                                href={listings.show(offer.listing)}
                            >
                                {offer.listing.address}
                            </Link>
                        ) : (
                            '-'
                        )}
                    </Panel>
                    <Panel title="Contact">
                        {offer.contact ? (
                            <Link
                                className="font-medium hover:underline"
                                href={contacts.show(offer.contact)}
                            >
                                {contactName(offer.contact)}
                            </Link>
                        ) : (
                            '-'
                        )}
                    </Panel>
                    <Panel title="Amount">{money(offer.amount)}</Panel>
                </div>
            </main>
        </>
    );
}

OfferShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Offers', href: offers.index() },
        { title: 'Detail', href: offers.show({ offer: ':offer' }) },
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
