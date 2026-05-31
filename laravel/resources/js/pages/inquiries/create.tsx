import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import inquiries from '@/routes/inquiries';
import type { ContactOption, ListingOption } from '../workflow-support';
import { InquiryForm } from './_components/inquiry-form';

type CreateInquiryProps = {
    listings: ListingOption[];
    contacts: ContactOption[];
};

export default function CreateInquiry({
    listings,
    contacts,
}: CreateInquiryProps) {
    return (
        <>
            <Head title="Create inquiry" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-neutral-950">
                        Create inquiry
                    </h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        Capture buyer or renter intent for a listing.
                    </p>
                </div>
                <InquiryForm listings={listings} contacts={contacts} />
            </main>
        </>
    );
}

CreateInquiry.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Inquiries', href: inquiries.index() },
        { title: 'Create', href: inquiries.create() },
    ],
};
