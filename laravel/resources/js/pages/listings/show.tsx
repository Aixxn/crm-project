import { Head, Link, router } from '@inertiajs/react';
import {
    Bath,
    BedDouble,
    Building2,
    CalendarClock,
    FileText,
    ImageIcon,
    Mail,
    Pencil,
    PhilippinePeso,
    Ruler,
    Trash2,
    Waves,
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
    ListingMediaSummary,
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
    { key: 'tasks', label: 'Tasks/Notes' },
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
            <main className="min-h-full bg-[#f7f5fc] text-[#1f2330]">
                <section className="px-6 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <StatusLabel status={listing.status} />
                                <span className="text-[#596071]">
                                    MLS: #{mlsCode(listing.id)}
                                </span>
                            </div>
                            <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight">
                                {listing.address}
                            </h1>
                            <p className="mt-2 text-xl font-medium text-[#596071]">
                                {listing.property_type || 'Property listing'}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-5xl font-semibold tracking-tight text-blue-700">
                                {money(listing.price)}
                            </div>
                            <div className="mt-3 text-sm text-[#596071]">
                                Estimated Commission:{' '}
                                {money(Number(listing.price) * 0.03)} (3%)
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-8 border-b border-[#c8ccdc]">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() =>
                                    setActiveTab(
                                        tab.key === 'tasks'
                                            ? activeTab === 'notes'
                                                ? 'tasks'
                                                : tab.key
                                            : tab.key,
                                    )
                                }
                                className={
                                    activeTab === tab.key ||
                                    (tab.key === 'tasks' &&
                                        activeTab === 'notes')
                                        ? 'border-b-2 border-blue-700 pb-4 text-sm font-semibold text-blue-700'
                                        : 'pb-4 text-sm text-[#4f5668]'
                                }
                            >
                                {tab.label}
                                {tab.key === 'offers' &&
                                    (listing.offers?.length ?? 0) > 0 && (
                                        <span className="ml-2 rounded-full bg-[#e1e4ef] px-2 py-0.5 text-xs text-[#596071]">
                                            {listing.offers?.length}
                                        </span>
                                    )}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'overview' ? (
                        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
                            <div className="space-y-4">
                                <Gallery listing={listing} />
                                <DescriptionCard listing={listing} />
                            </div>
                            <aside className="space-y-4">
                                <StatsCard listing={listing} />
                                <PriceAnalysis />
                                <AgentCard listing={listing} />
                                <OwnerCard listing={listing} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" asChild>
                                        <Link href={listings.edit(listing)}>
                                            <Pencil className="size-4" />
                                            Edit
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={destroyListing}
                                    >
                                        <Trash2 className="size-4" />
                                        Delete
                                    </Button>
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <section className="mt-8 rounded-md border border-[#c4c8d9] bg-white p-5">
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
                        </section>
                    )}
                </section>
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

function Gallery({ listing }: { listing: ListingDetail }) {
    const media = listing.media ?? [];
    const hero = media[0];
    const thumbs = media.slice(1, 5);

    return (
        <section className="overflow-hidden rounded-md border border-[#c4c8d9] bg-white p-1">
            <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-[#e7e9f2]">
                {hero ? (
                    <img
                        src={hero.url}
                        alt={listing.address}
                        className="size-full object-cover"
                    />
                ) : (
                    <Placeholder className="size-full" />
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                    <GalleryButton icon={<ImageIcon />} label="24 Photos" />
                    <GalleryButton icon={<Building2 />} label="Virtual Tour" />
                </div>
            </div>
            <div className="mt-1 grid grid-cols-4 gap-1">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Thumb
                        key={thumbs[index]?.id ?? index}
                        media={thumbs[index]}
                        overflow={index === 3 && media.length > 5}
                        count={Math.max(media.length - 5, 0)}
                    />
                ))}
            </div>
        </section>
    );
}

function Thumb({
    media,
    overflow,
    count,
}: {
    media?: ListingMediaSummary;
    overflow: boolean;
    count: number;
}) {
    return (
        <div className="relative aspect-[16/5] overflow-hidden rounded-sm bg-[#e7e9f2]">
            {media ? (
                <img
                    src={media.url}
                    alt="Listing media"
                    className="size-full object-cover"
                />
            ) : (
                <Placeholder className="size-full" compact />
            )}
            {overflow && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                    +{count}
                </div>
            )}
        </div>
    );
}

function DescriptionCard({ listing }: { listing: ListingDetail }) {
    return (
        <section className="rounded-md border border-[#c4c8d9] bg-white p-6">
            <h2 className="text-2xl font-semibold">Property Description</h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#4f5668]">
                This {listing.property_type || 'property'} is managed in the
                Prime CRM inventory workspace. Use this record to monitor buyer
                interest, scheduled viewings, submitted offers, tasks, and
                internal notes tied to the listing.
            </p>
            <h3 className="mt-7 text-lg font-semibold">Key Features</h3>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Feature icon={<CalendarClock />} label="Days on Market">
                    {daysOnMarket(listing.created_at)}
                </Feature>
                <Feature icon={<Building2 />} label="Property Type">
                    {listing.property_type || 'Unspecified'}
                </Feature>
                <Feature icon={<PhilippinePeso />} label="Price / SqFt">
                    {pricePerSqft(listing)}
                </Feature>
                <Feature icon={<Waves />} label="Workflow">
                    {listing.status}
                </Feature>
            </div>
        </section>
    );
}

function StatsCard({ listing }: { listing: ListingDetail }) {
    return (
        <section className="rounded-md border border-[#c4c8d9] bg-white p-5">
            <div className="grid grid-cols-3 divide-x divide-[#c8ccdc] text-center">
                <Stat icon={<BedDouble />} value={listing.bedrooms ?? '-'} label="Beds" />
                <Stat icon={<Bath />} value={listing.bathrooms ?? '-'} label="Baths" />
                <Stat icon={<Ruler />} value={listing.area_sqft ?? '-'} label="SqFt" />
            </div>
            <div className="mt-6 border-t border-[#c8ccdc] pt-4 text-sm">
                <InfoLine label="Price / SqFt" value={pricePerSqft(listing)} />
                <InfoLine label="Lot Size" value="Not recorded" />
                <InfoLine
                    label="Days on Market"
                    value={String(daysOnMarket(listing.created_at))}
                />
            </div>
            <Button
                asChild
                className="mt-5 h-11 w-full rounded-sm bg-blue-700 text-white hover:bg-blue-800"
            >
                <Link href={listings.edit(listing)}>
                    <Pencil className="size-4" />
                    Edit Details
                </Link>
            </Button>
        </section>
    );
}

function PriceAnalysis() {
    return (
        <section className="rounded-md border border-[#c4c8d9] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Price Analysis</h2>
                <button className="text-xs font-semibold text-blue-700">
                    View Comp Report
                </button>
            </div>
            <div className="mt-5 flex h-32 items-end gap-3 rounded-sm bg-[#f0f2fb] p-3">
                {[42, 55, 50, 68, 82].map((height, index) => (
                    <div
                        key={height}
                        className={
                            index === 4
                                ? 'flex-1 rounded-t-sm bg-blue-700'
                                : 'flex-1 rounded-t-sm bg-blue-300'
                        }
                        style={{ height: `${height}%` }}
                    />
                ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-[#596071]">
                    <span className="size-3 rounded-full bg-blue-700" />
                    List Price
                </span>
                <span className="font-semibold text-[#c94716]">-1.5%</span>
            </div>
        </section>
    );
}

function AgentCard({ listing }: { listing: ListingDetail }) {
    return (
        <section className="rounded-md border border-[#c4c8d9] bg-white p-5">
            <h2 className="text-xl font-semibold">Listing Agent</h2>
            <div className="mt-5 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-md bg-[#dfe6f6] text-sm font-semibold text-blue-800">
                    {initials(listing.assigned_agent?.name ?? 'Agent')}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                        {listing.assigned_agent?.name ?? 'Unassigned'}
                    </div>
                    <div className="text-sm text-[#596071]">
                        {listing.assigned_agent?.email ?? 'No email'}
                    </div>
                </div>
                {listing.assigned_agent?.email && (
                    <a
                        href={`mailto:${listing.assigned_agent.email}`}
                        className="inline-flex size-9 items-center justify-center rounded-sm border border-[#c4c8d9]"
                    >
                        <Mail className="size-4" />
                    </a>
                )}
            </div>
        </section>
    );
}

function OwnerCard({ listing }: { listing: ListingDetail }) {
    return (
        <section className="rounded-md border border-[#c4c8d9] bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#596071]">
                Owner
            </h2>
            {listing.owner ? (
                <div className="mt-4 text-sm">
                    <div className="font-semibold">
                        {contactName(listing.owner)}
                    </div>
                    <div className="mt-1 text-[#596071]">
                        {listing.owner.email ?? '-'}
                    </div>
                    <div className="mt-1 text-[#596071]">
                        {listing.owner.phone ?? '-'}
                    </div>
                </div>
            ) : (
                <p className="mt-4 text-sm text-[#596071]">No owner linked.</p>
            )}
        </section>
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
                <thead className="text-xs font-medium text-[#596071] uppercase">
                    <tr>
                        <th className="px-3 py-2">Contact</th>
                        <th className="px-3 py-2">Details</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Value</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#d8dbea]">
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td className="px-3 py-3 font-medium">
                                {row.primary}
                            </td>
                            <td className="px-3 py-3 text-[#596071]">
                                {row.secondary}
                            </td>
                            <td className="px-3 py-3">
                                <Badge variant="outline">{row.status}</Badge>
                            </td>
                            <td className="px-3 py-3">{row.amount}</td>
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
                    className="rounded-md border border-[#c4c8d9] p-4"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="font-semibold">
                                {money(offer.amount)}
                            </div>
                            <div className="mt-1 text-sm text-[#596071]">
                                {offer.contact
                                    ? contactName(offer.contact)
                                    : 'Unknown contact'}
                            </div>
                        </div>
                        <Badge variant="outline">{offer.status}</Badge>
                    </div>
                    {offer.notes && (
                        <p className="mt-3 text-sm text-[#4f5668]">
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
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#c4c8d9] p-4"
                >
                    <div>
                        <div className="font-semibold">{task.title}</div>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-[#596071]">
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
                    className="rounded-md border border-[#c4c8d9] p-4"
                >
                    <div className="flex items-center gap-2 text-sm text-[#596071]">
                        <FileText className="size-4" />
                        <span>{note.author?.name ?? 'Unknown author'}</span>
                        <span>{formatDate(note.created_at)}</span>
                    </div>
                    <p className="mt-3 text-sm text-[#303545]">{note.body}</p>
                </div>
            ))}
        </div>
    );
}

function GalleryButton({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <button className="inline-flex h-9 items-center gap-2 rounded-sm bg-white/90 px-4 text-sm font-semibold text-[#303545]">
            <span className="[&_svg]:size-4">{icon}</span>
            {label}
        </button>
    );
}

function Feature({
    icon,
    label,
    children,
}: {
    icon: ReactNode;
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#eef1fb] text-blue-700 [&_svg]:size-4">
                {icon}
            </div>
            <div>
                <div className="text-sm text-[#596071]">{label}</div>
                <div className="font-semibold">{children}</div>
            </div>
        </div>
    );
}

function Stat({
    icon,
    value,
    label,
}: {
    icon: ReactNode;
    value: ReactNode;
    label: string;
}) {
    return (
        <div className="px-2">
            <div className="mx-auto flex size-7 items-center justify-center text-[#596071] [&_svg]:size-5">
                {icon}
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#596071]">
                {label}
            </div>
        </div>
    );
}

function InfoLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-[#596071]">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}

function StatusLabel({ status }: { status: ListingStatus }) {
    const classes: Record<ListingStatus, string> = {
        Draft: 'bg-[#e5e7ef] text-[#686e7e]',
        Active: 'bg-[#e7f0ff] text-blue-700',
        'Under Offer': 'bg-[#ffe8dd] text-[#b24a1b]',
        Closed: 'bg-[#e5f5ef] text-[#08784f]',
        'Closed Lost': 'bg-[#fee2e2] text-[#b91c1c]',
    };

    return (
        <span
            className={`inline-flex h-7 items-center rounded-sm px-3 text-xs font-bold uppercase tracking-wide ${classes[status]}`}
        >
            {status}
        </span>
    );
}

function Placeholder({
    className,
    compact = false,
}: {
    className: string;
    compact?: boolean;
}) {
    return (
        <div
            className={`flex items-center justify-center bg-[#e7e9f2] text-[#858b9b] ${className}`}
        >
            <ImageIcon className={compact ? 'size-4' : 'size-10'} />
        </div>
    );
}

function EmptyState({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-[#c4c8d9] bg-[#f7f5fc] px-4 text-center text-sm text-[#596071]">
            {children}
        </div>
    );
}

function money(value: string | number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(Number(value));
}

function contactName(contact: ContactSummary) {
    return `${contact.first_name} ${contact.last_name}`.trim();
}

function initials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function pricePerSqft(listing: ListingDetail) {
    if (!listing.area_sqft) {
        return 'TBD';
    }

    return money(Number(listing.price) / listing.area_sqft);
}

function daysOnMarket(createdAt: string) {
    const created = new Date(createdAt).getTime();
    const now = Date.now();

    return Math.max(1, Math.ceil((now - created) / 86_400_000));
}

function mlsCode(id: string) {
    return id.replace(/-/g, '').slice(0, 8).toUpperCase();
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
