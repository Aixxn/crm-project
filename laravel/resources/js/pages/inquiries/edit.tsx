import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import inquiries from '@/routes/inquiries';
import type { ContactOption, ListingOption } from '../workflow-support';
import { InquiryForm } from './_components/inquiry-form';
import type { InquirySummary } from './types';

type EditInquiryProps = {
    inquiry: InquirySummary;
    listings: ListingOption[];
    contacts: ContactOption[];
};

export default function EditInquiry({
    inquiry,
    listings,
    contacts,
}: EditInquiryProps) {
    return (
        <>
            <Head title="Edit inquiry" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-neutral-950">
                        Edit inquiry
                    </h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        {inquiry.intent}
                    </p>
                </div>
                <InquiryForm
                    inquiry={inquiry}
                    listings={listings}
                    contacts={contacts}
                />
            </main>
        </>
    );
}

EditInquiry.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Inquiries', href: inquiries.index() },
        { title: 'Edit', href: inquiries.edit({ inquiry: ':inquiry' }) },
    ],
};
