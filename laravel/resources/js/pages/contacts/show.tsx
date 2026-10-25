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
import { EmptyState } from '@/components/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { contactName, formatDateTime, money } from '@/lib/format';
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
            <main className="min-h-full bg-muted">
                <div className="border-b border-border bg-card px-4 py-4 md:px-6">
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
                                <h1 className="text-xl font-semibold text-foreground">
                                    {contactName(contact)}
                                </h1>
                                <RoleBadge role={contact.role} />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
                    <section className="rounded-md border border-border bg-card">
                        <div className="flex gap-1 overflow-x-auto border-b border-border/70 px-3 py-2">
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
                                    <div className="flex size-10 items-center justify-center rounded-md border border-border bg-muted">
                                        <ContactRound className="size-4 text-foreground" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground">
                                            {contactName(contact)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
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
            <div className="rounded-md border border-border p-4">
                <div className="text-sm font-medium text-foreground">Notes</div>
                <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">
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
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"
                >
                    <div>
                        <Link
                            href={listings.show(listing)}
                            className="font-medium text-foreground hover:underline"
                        >
                            {listing.address}
                        </Link>
                        <div className="mt-1 text-sm text-muted-foreground">
                            {listing.property_type || 'Unspecified type'} /{' '}
                            {money(listing.price)}
                        </div>
                    </div>
                    <StatusBadge domain="listing" status={listing.status} />
                </div>
            ))}
        </div>
    );
}

function Inquiries({ rows }: { rows: RelatedInquiry[] }) {
    return (
        <ActivityTable
            domain="inquiry"
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
            domain="viewing"
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
            domain="offer"
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
    domain,
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
    domain: 'inquiry' | 'viewing' | 'offer';
}) {
    if (rows.length === 0) {
        return <EmptyState>{empty}</EmptyState>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="text-xs font-medium text-muted-foreground uppercase">
                    <tr>
                        <th className="px-3 py-2">Listing</th>
                        <th className="px-3 py-2">Details</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Value</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td className="px-3 py-3 font-medium text-foreground">
                                {row.primary}
                            </td>
                            <td className="px-3 py-3 text-muted-foreground">
                                {row.secondary}
                            </td>
                            <td className="px-3 py-3">
                                <StatusBadge
                                    domain={domain}
                                    status={row.status}
                                />
                            </td>
                            <td className="px-3 py-3 text-foreground">
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
        <section className="rounded-md border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md border border-border p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
        <div className="rounded-md border border-border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className="mt-2 text-base font-semibold text-foreground">
                {value}
            </div>
        </div>
    );
}

function RoleBadge({ role }: { role: ContactRole }) {
    const classes: Record<ContactRole, string> = {
        Owner: 'border-status-info-border bg-status-info text-status-info-foreground',
        Buyer: 'border-status-success-border bg-status-success text-status-success-foreground',
        Tenant: 'border-status-warning-border bg-status-warning text-status-warning-foreground',
    };

    return (
        <Badge variant="outline" className={classes[role]}>
            {role}
        </Badge>
    );
}
