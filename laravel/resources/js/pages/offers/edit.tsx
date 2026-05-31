import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import offers from '@/routes/offers';
import type { ContactOption, ListingOption } from '../workflow-support';
import { OfferForm } from './_components/offer-form';
import type { OfferSummary } from './types';

type EditOfferProps = {
    offer: OfferSummary;
    listings: ListingOption[];
    contacts: ContactOption[];
};

export default function EditOffer({
    offer,
    listings,
    contacts,
}: EditOfferProps) {
    return (
        <>
            <Head title="Edit offer" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-neutral-950">
                        Edit offer
                    </h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        {offer.status}
                    </p>
                </div>
                <OfferForm
                    offer={offer}
                    listings={listings}
                    contacts={contacts}
                />
            </main>
        </>
    );
}

EditOffer.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Offers', href: offers.index() },
        { title: 'Edit', href: offers.edit({ offer: ':offer' }) },
    ],
};
