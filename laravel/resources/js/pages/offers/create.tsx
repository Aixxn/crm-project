import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import offers from '@/routes/offers';
import type { ContactOption, ListingOption } from '../workflow-support';
import { OfferForm } from './_components/offer-form';

type CreateOfferProps = {
    listings: ListingOption[];
    contacts: ContactOption[];
};

export default function CreateOffer({ listings, contacts }: CreateOfferProps) {
    return (
        <>
            <Head title="Create offer" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-neutral-950">
                        Create offer
                    </h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        Record a submitted offer for a listing.
                    </p>
                </div>
                <OfferForm listings={listings} contacts={contacts} />
            </main>
        </>
    );
}

CreateOffer.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Offers', href: offers.index() },
        { title: 'Create', href: offers.create() },
    ],
};
