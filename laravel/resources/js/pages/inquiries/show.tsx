import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import contacts from '@/routes/contacts';
import inquiries from '@/routes/inquiries';
import listings from '@/routes/listings';
import { contactName, money, StatusBadge } from '../workflow-support';
import type { InquirySummary } from './types';

type InquiryShowProps = {
    inquiry: InquirySummary;
};

export default function InquiryShow({ inquiry }: InquiryShowProps) {
    const destroyInquiry = () => {
        if (window.confirm('Delete this inquiry?')) {
            router.delete(inquiries.destroy(inquiry).url);
        }
    };

    return (
        <>
            <Head title="Inquiry detail" />
            <main className="min-h-full bg-muted">
                <div className="border-b border-border bg-card px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="mb-2 -ml-2"
                            >
                                <Link href={inquiries.index()}>
                                    <ArrowLeft />
                                    Inquiries
                                </Link>
                            </Button>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-xl font-semibold text-foreground">
                                    {inquiry.intent}
                                </h1>
                                <StatusBadge
                                    domain="inquiry"
                                    status={inquiry.status}
                                />
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {inquiry.source} / {money(inquiry.budget)}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href={inquiries.edit(inquiry)}>
                                    <Pencil />
                                    Edit
                                </Link>
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={destroyInquiry}
                            >
                                <Trash2 />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
                    <Panel title="Listing">
                        {inquiry.listing ? (
                            <Link
                                className="font-medium hover:underline"
                                href={listings.show(inquiry.listing)}
                            >
                                {inquiry.listing.address}
                            </Link>
                        ) : (
                            '-'
                        )}
                    </Panel>
                    <Panel title="Contact">
                        {inquiry.contact ? (
                            <Link
                                className="font-medium hover:underline"
                                href={contacts.show(inquiry.contact)}
                            >
                                {contactName(inquiry.contact)}
                            </Link>
                        ) : (
                            '-'
                        )}
                    </Panel>
                    <Panel title="Budget">{money(inquiry.budget)}</Panel>
                </div>
            </main>
        </>
    );
}

InquiryShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Inquiries', href: inquiries.index() },
        { title: 'Detail', href: inquiries.show({ inquiry: ':inquiry' }) },
    ],
};

function Panel({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-md border border-border bg-card p-4 text-sm">
            <h2 className="mb-3 font-semibold text-foreground">{title}</h2>
            <div className="text-foreground">{children}</div>
        </section>
    );
}
