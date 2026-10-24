import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarClock,
    ContactRound,
    Mail,
    MessageSquareText,
    Pencil,
    PhilippinePeso,
    Phone,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import contacts from '@/routes/contacts';
import listings from '@/routes/listings';
import type {
    ContactDetail,
    ContactRole,
    RelatedInquiry,
    RelatedListing,
    RelatedOffer,
    RelatedViewing,
} from './types';

type ContactShowProps = {
    contact: ContactDetail;
};

type TabKey = 'overview' | 'listings' | 'inquiries' | 'viewings' | 'offers';

const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'listings', label: 'Listings' },
    { key: 'inquiries', label: 'Inquiries' },
    { key: 'viewings', label: 'Viewings' },
    { key: 'offers', label: 'Offers' },
];

export default function ContactShow({ contact }: ContactShowProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    const destroyContact = () => {
        if (window.confirm('Delete this contact?')) {
            router.delete(contacts.destroy(contact).url);
        }
    };

    return (
        <>
            <Head title={contactName(contact)} />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="mb-2 -ml-2"
                            >
                                <Link href={contacts.index()}>
                                    <ArrowLeft />
                                    Contacts
                                </Link>
                            </Button>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-xl font-semibold text-neutral-950">
                                    {contactName(contact)}
                                </h1>
                                <RoleBadge role={contact.role} />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                                <span>{contact.email ?? 'No email'}</span>
                                <span>{contact.phone ?? 'No phone'}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {contact.can_update && (
                                <Button variant="outline" asChild>
                                    <Link href={contacts.edit(contact)}>
                                        <Pencil />
                                        Edit
                                    </Link>
                                </Button>
                            )}
                            {contact.can_delete && (
                                <Button
                                    variant="destructive"
                                    onClick={destroyContact}
                                >
                                    <Trash2 />
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_20rem] md:p-6">
                    <section className="rounded-md border border-[#C3C6D7] bg-white">
                        <div className="flex gap-1 overflow-x-auto border-b border-[#C3C6D7]/70 px-3 py-2">
                            {tabs.map((tab) => (
                                <Button
                                    key={tab.key}
                                    variant={
                                        activeTab === tab.key
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    size="sm"
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    {tab.label}
                                </Button>
                            ))}
                        </div>
                        <div className="p-4 md:p-5">
                            {activeTab === 'overview' && (
                                <Overview contact={contact} />
                            )}
                            {activeTab === 'listings' && (
                                <Listings rows={contact.owned_listings ?? []} />
                            )}
                            {activeTab === 'inquiries' && (
                                <Inquiries rows={contact.inquiries ?? []} />
                            )}
                            {activeTab === 'viewings' && (
                                <Viewings rows={contact.viewings ?? []} />
                            )}
                            {activeTab === 'offers' && (
                                <Offers rows={contact.offers ?? []} />
                            )}
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <Panel title="Contact">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-md border border-[#C3C6D7] bg-[#FAF8FF]">
                                        <ContactRound className="size-4 text-neutral-700" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-neutral-950">
                                            {contactName(contact)}
                                        </div>
                                        <div className="text-sm text-neutral-500">
                                            {contact.role}
                                        </div>
                                    </div>
                                </div>
                                <ContactMethod
                                    icon={<Mail />}
                                    value={contact.email}
                                />
                                <ContactMethod
                                    icon={<Phone />}
                                    value={contact.phone}
                                />
                            </div>
                        </Panel>

                        <Panel title="Activity counts">
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <Metric
                                    label="Listings"
                                    value={contact.owned_listings?.length ?? 0}
                                />
                                <Metric
                                    label="Inquiries"
                                    value={contact.inquiries?.length ?? 0}
                                />
                                <Metric
                                    label="Viewings"
                                    value={contact.viewings?.length ?? 0}
                                />
                                <Metric
                                    label="Offers"
                                    value={contact.offers?.length ?? 0}
                                />
                            </dl>
                        </Panel>
                    </aside>
                </div>
            </main>
        </>
    );
}

ContactShow.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Contacts',
            href: contacts.index(),
        },
        {
            title: 'Detail',
            href: contacts.show({ contact: ':contact' }),
        },
    ],
};

function Overview({ contact }: { contact: ContactDetail }) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
                <OverviewMetric
                    icon={<ContactRound />}
                    label="Role"
                    value={contact.role}
                />
                <OverviewMetric
                    icon={<Mail />}
                    label="Email"
                    value={contact.email ?? '-'}
                />
                <OverviewMetric
                    icon={<Phone />}
                    label="Phone"
                    value={contact.phone ?? '-'}
                />
            </div>
            <div className="rounded-md border border-[#C3C6D7] p-4">
                <div className="text-sm font-medium text-neutral-950">
                    Notes
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap text-neutral-700">
                    {contact.notes || 'No notes recorded.'}
                </p>
            </div>
        </div>
    );
}

function Listings({ rows }: { rows: RelatedListing[] }) {
    if (rows.length === 0) {
        return (
            <EmptyState>No owned listings linked to this contact.</EmptyState>
        );
    }

    return (
        <div className="grid gap-3">
            {rows.map((listing) => (
                <div
                    key={listing.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#C3C6D7] p-4"
                >
                    <div>
                        <Link
                            href={listings.show(listing)}
                            className="font-medium text-neutral-950 hover:underline"
                        >
                            {listing.address}
                        </Link>
                        <div className="mt-1 text-sm text-neutral-600">
                            {listing.property_type || 'Unspecified type'} /{' '}
                            {money(listing.price)}
                        </div>
                    </div>
                    <Badge variant="outline">{listing.status}</Badge>
                </div>
            ))}
        </div>
    );
}

function Inquiries({ rows }: { rows: RelatedInquiry[] }) {
    return (
        <ActivityTable
            empty="No inquiries linked to this contact."
            icon={<MessageSquareText />}
            rows={rows.map((inquiry) => ({
                id: inquiry.id,
                primary: inquiry.listing?.address ?? 'Unlinked listing',
                secondary:
                    [inquiry.source, inquiry.intent]
                        .filter(Boolean)
                        .join(' / ') || '-',
                status: inquiry.status,
                value: inquiry.budget ? money(inquiry.budget) : '-',
            }))}
        />
    );
}

function Viewings({ rows }: { rows: RelatedViewing[] }) {
    return (
        <ActivityTable
            empty="No viewings linked to this contact."
            icon={<CalendarClock />}
            rows={rows.map((viewing) => ({
                id: viewing.id,
                primary: viewing.listing?.address ?? 'Unlinked listing',
                secondary: formatDateTime(viewing.scheduled_at),
                status: viewing.status,
                value: '-',
            }))}
        />
    );
}

function Offers({ rows }: { rows: RelatedOffer[] }) {
    return (
        <ActivityTable
            empty="No offers linked to this contact."
            icon={<PhilippinePeso />}
            rows={rows.map((offer) => ({
                id: offer.id,
                primary: offer.listing?.address ?? 'Unlinked listing',
                secondary: offer.notes ?? '-',
                status: offer.status,
                value: money(offer.amount),
            }))}
        />
    );
}

function ActivityTable({
    rows,
    empty,
}: {
    icon: ReactNode;
    rows: Array<{
        id: string;
        primary: string;
        secondary: string;
        status: string;
        value: string;
    }>;
    empty: string;
}) {
    if (rows.length === 0) {
        return <EmptyState>{empty}</EmptyState>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="text-xs font-medium text-neutral-500 uppercase">
                    <tr>
                        <th className="px-3 py-2">Listing</th>
                        <th className="px-3 py-2">Details</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Value</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#C3C6D7]/60">
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td className="px-3 py-3 font-medium text-neutral-950">
                                {row.primary}
                            </td>
                            <td className="px-3 py-3 text-neutral-600">
                                {row.secondary}
                            </td>
                            <td className="px-3 py-3">
                                <Badge variant="outline">{row.status}</Badge>
                            </td>
                            <td className="px-3 py-3 text-neutral-700">
                                {row.value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-md border border-[#C3C6D7] bg-white p-4">
            <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md border border-[#C3C6D7] p-3">
            <dt className="text-xs text-neutral-500">{label}</dt>
            <dd className="mt-1 text-lg font-semibold text-neutral-950">
                {value}
            </dd>
        </div>
    );
}

function ContactMethod({
    icon,
    value,
}: {
    icon: ReactNode;
    value: string | null;
}) {
    return (
        <div className="flex items-center gap-2 text-sm text-neutral-600">
            {icon}
            {value ?? '-'}
        </div>
    );
}

function OverviewMetric({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: ReactNode;
}) {
    return (
        <div className="rounded-md border border-[#C3C6D7] p-4">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
                {icon}
                {label}
            </div>
            <div className="mt-2 text-base font-semibold text-neutral-950">
                {value}
            </div>
        </div>
    );
}

function RoleBadge({ role }: { role: ContactRole }) {
    const classes: Record<ContactRole, string> = {
        Owner: 'border-sky-200 bg-sky-50 text-sky-700',
        Buyer: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        Tenant: 'border-amber-200 bg-amber-50 text-amber-700',
    };

    return (
        <Badge variant="outline" className={classes[role]}>
            {role}
        </Badge>
    );
}

function EmptyState({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-[#C3C6D7] bg-[#FAF8FF] px-4 text-center text-sm text-neutral-600">
            {children}
        </div>
    );
}

function contactName(contact: {
    first_name: string;
    last_name: string | null;
}) {
    return `${contact.first_name} ${contact.last_name ?? ''}`.trim();
}

function money(value: string | number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(Number(value));
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}
