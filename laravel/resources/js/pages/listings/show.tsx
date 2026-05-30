import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Bath,
    BedDouble,
    DollarSign,
    FileText,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Ruler,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import listings from '@/routes/listings';
import type {
    ContactSummary,
    ListingDetail,
    ListingStatus,
    NoteSummary,
    OfferSummary,
    TaskSummary,
} from './types';

type ListingShowProps = {
    listing: ListingDetail;
};

type TabKey =
    | 'overview'
    | 'inquiries'
    | 'viewings'
    | 'offers'
    | 'tasks'
    | 'notes';

const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'inquiries', label: 'Inquiries' },
    { key: 'viewings', label: 'Viewings' },
    { key: 'offers', label: 'Offers' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'notes', label: 'Notes' },
];

export default function ListingShow({ listing }: ListingShowProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    const destroyListing = () => {
        if (window.confirm('Delete this listing?')) {
            router.delete(listings.destroy(listing).url);
        }
    };

    return (
        <>
            <Head title={listing.address} />
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
                                <Link href={listings.index()}>
                                    <ArrowLeft />
                                    Listings
                                </Link>
                            </Button>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="max-w-4xl text-xl font-semibold text-neutral-950">
                                    {listing.address}
                                </h1>
                                <StatusBadge status={listing.status} />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                                <span>
                                    {listing.property_type ||
                                        'Unspecified type'}
                                </span>
                                <span>{money(listing.price)}</span>
                                <span>
                                    {listing.assigned_agent?.name ??
                                        'Unassigned'}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href={listings.edit(listing)}>
                                    <Pencil />
                                    Edit
                                </Link>
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={destroyListing}
                            >
                                <Trash2 />
                                Delete
                            </Button>
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
                                <Overview listing={listing} />
                            )}
                            {activeTab === 'inquiries' && (
                                <ActivityTable
                                    empty="No inquiries recorded for this listing."
                                    rows={(listing.inquiries ?? []).map(
                                        (inquiry) => ({
                                            id: inquiry.id,
                                            primary: inquiry.contact
                                                ? contactName(inquiry.contact)
                                                : 'Unknown contact',
                                            secondary:
                                                [inquiry.source, inquiry.intent]
                                                    .filter(Boolean)
                                                    .join(' / ') || '-',
                                            status: inquiry.status,
                                            amount: inquiry.budget
                                                ? money(inquiry.budget)
                                                : '-',
                                        }),
                                    )}
                                />
                            )}
                            {activeTab === 'viewings' && (
                                <ActivityTable
                                    empty="No viewings scheduled for this listing."
                                    rows={(listing.viewings ?? []).map(
                                        (viewing) => ({
                                            id: viewing.id,
                                            primary: viewing.contact
                                                ? contactName(viewing.contact)
                                                : 'Unknown contact',
                                            secondary: formatDateTime(
                                                viewing.scheduled_at,
                                            ),
                                            status: viewing.status,
                                            amount: viewing.agent?.name ?? '-',
                                        }),
                                    )}
                                />
                            )}
                            {activeTab === 'offers' && (
                                <Offers offers={listing.offers ?? []} />
                            )}
                            {activeTab === 'tasks' && (
                                <Tasks tasks={listing.tasks ?? []} />
                            )}
                            {activeTab === 'notes' && (
                                <Notes notes={listing.notes ?? []} />
                            )}
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <Panel title="Owner">
                            {listing.owner ? (
                                <ContactBlock contact={listing.owner} />
                            ) : (
                                <p className="text-sm text-neutral-600">
                                    No owner linked.
                                </p>
                            )}
                        </Panel>
                        <Panel title="Agent">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex size-9 items-center justify-center rounded-md border border-[#C3C6D7] bg-[#FAF8FF]">
                                    <UserRound className="size-4 text-neutral-700" />
                                </div>
                                <div>
                                    <div className="font-medium text-neutral-950">
                                        {listing.assigned_agent?.name ??
                                            'Unassigned'}
                                    </div>
                                    <div className="text-neutral-500">
                                        {listing.assigned_agent?.email ?? '-'}
                                    </div>
                                </div>
                            </div>
                        </Panel>
                        <Panel title="Workflow counts">
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <Metric
                                    label="Inquiries"
                                    value={listing.inquiries?.length ?? 0}
                                />
                                <Metric
                                    label="Viewings"
                                    value={listing.viewings?.length ?? 0}
                                />
                                <Metric
                                    label="Offers"
                                    value={listing.offers?.length ?? 0}
                                />
                                <Metric
                                    label="Tasks"
                                    value={listing.tasks?.length ?? 0}
                                />
                            </dl>
                        </Panel>
                    </aside>
                </div>
            </main>
        </>
    );
}

ListingShow.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Listings',
            href: listings.index(),
        },
        {
            title: 'Detail',
            href: listings.show({ listing: ':listing' }),
        },
    ],
};

function Overview({ listing }: { listing: ListingDetail }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OverviewMetric
                icon={<DollarSign />}
                label="Price"
                value={money(listing.price)}
            />
            <OverviewMetric
                icon={<BedDouble />}
                label="Bedrooms"
                value={listing.bedrooms ?? '-'}
            />
            <OverviewMetric
                icon={<Bath />}
                label="Bathrooms"
                value={listing.bathrooms ?? '-'}
            />
            <OverviewMetric
                icon={<Ruler />}
                label="Area sqft"
                value={listing.area_sqft ?? '-'}
            />
            <div className="md:col-span-2 xl:col-span-4">
                <div className="rounded-md border border-[#C3C6D7] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-950">
                        <MapPin className="size-4" />
                        Address
                    </div>
                    <p className="mt-2 text-sm text-neutral-700">
                        {listing.address}
                    </p>
                </div>
            </div>
        </div>
    );
}

function ActivityTable({
    rows,
    empty,
}: {
    rows: Array<{
        id: string;
        primary: string;
        secondary: string;
        status: string;
        amount: string;
    }>;
    empty: string;
}) {
    if (rows.length === 0) {
        return <EmptyState>{empty}</EmptyState>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs font-medium text-neutral-500 uppercase">
                    <tr>
                        <th className="px-3 py-2">Contact</th>
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
                                {row.amount}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Offers({ offers }: { offers: OfferSummary[] }) {
    if (offers.length === 0) {
        return <EmptyState>No offers submitted for this listing.</EmptyState>;
    }

    return (
        <div className="grid gap-3">
            {offers.map((offer) => (
                <div
                    key={offer.id}
                    className="rounded-md border border-[#C3C6D7] p-4"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="font-medium text-neutral-950">
                                {money(offer.amount)}
                            </div>
                            <div className="mt-1 text-sm text-neutral-600">
                                {offer.contact
                                    ? contactName(offer.contact)
                                    : 'Unknown contact'}
                            </div>
                        </div>
                        <Badge variant="outline">{offer.status}</Badge>
                    </div>
                    {offer.notes && (
                        <p className="mt-3 text-sm text-neutral-700">
                            {offer.notes}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

function Tasks({ tasks }: { tasks: TaskSummary[] }) {
    if (tasks.length === 0) {
        return <EmptyState>No tasks linked to this listing.</EmptyState>;
    }

    return (
        <div className="grid gap-3">
            {tasks.map((task) => (
                <div
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#C3C6D7] p-4"
                >
                    <div>
                        <div className="font-medium text-neutral-950">
                            {task.title}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-neutral-600">
                            <span>{task.assignee?.name ?? 'Unassigned'}</span>
                            <span>
                                {task.due_date
                                    ? formatDate(task.due_date)
                                    : 'No due date'}
                            </span>
                        </div>
                    </div>
                    <Badge variant="outline">{task.status}</Badge>
                </div>
            ))}
        </div>
    );
}

function Notes({ notes }: { notes: NoteSummary[] }) {
    if (notes.length === 0) {
        return <EmptyState>No notes linked to this listing.</EmptyState>;
    }

    return (
        <div className="grid gap-3">
            {notes.map((note) => (
                <div
                    key={note.id}
                    className="rounded-md border border-[#C3C6D7] p-4"
                >
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <FileText className="size-4" />
                        <span>{note.author?.name ?? 'Unknown author'}</span>
                        <span>{formatDate(note.created_at)}</span>
                    </div>
                    <p className="mt-3 text-sm text-neutral-800">{note.body}</p>
                </div>
            ))}
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

function ContactBlock({ contact }: { contact: ContactSummary }) {
    return (
        <div className="space-y-3 text-sm">
            <div className="font-medium text-neutral-950">
                {contactName(contact)}
            </div>
            <div className="flex items-center gap-2 text-neutral-600">
                <Mail className="size-4" />
                {contact.email ?? '-'}
            </div>
            <div className="flex items-center gap-2 text-neutral-600">
                <Phone className="size-4" />
                {contact.phone ?? '-'}
            </div>
        </div>
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
            <div className="mt-2 text-lg font-semibold text-neutral-950">
                {value}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: ListingStatus }) {
    const classes: Record<ListingStatus, string> = {
        Draft: 'border-neutral-300 bg-neutral-100 text-neutral-700',
        Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        'Under Offer': 'border-amber-200 bg-amber-50 text-amber-700',
        Closed: 'border-sky-200 bg-sky-50 text-sky-700',
        'Closed Lost': 'border-red-200 bg-red-50 text-red-700',
    };

    return (
        <Badge variant="outline" className={classes[status]}>
            {status}
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

function money(value: string | number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(Number(value));
}

function contactName(contact: ContactSummary) {
    return `${contact.first_name} ${contact.last_name}`.trim();
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
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
