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
import { EmptyState } from '@/components/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, formatDateTime, money, contactName } from '@/lib/format';
import { dashboard } from '@/routes';
import listings from '@/routes/listings';
import type {
    ListingDetail,
    ListingMediaSummary,
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
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletePending, setDeletePending] = useState(false);

    const destroyListing = () => {
        setDeletePending(true);
        router.delete(listings.destroy(listing).url, {
            onFinish: () => {
                setDeletePending(false);
                setDeleteOpen(false);
            },
        });
    };

    return (
        <>
            <Head title={listing.address} />
            <main className="min-h-full bg-background text-foreground">
                <section className="px-6 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <StatusBadge
                                    domain="listing"
                                    status={listing.status}
                                />
                                <span className="text-muted-foreground">
                                    MLS: #{mlsCode(listing.id)}
                                </span>
                            </div>
                            <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight">
                                {listing.address}
                            </h1>
                            <p className="mt-2 text-xl font-medium text-muted-foreground">
                                {listing.property_type || 'Property listing'}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-5xl font-semibold tracking-tight text-primary">
                                {money(listing.price)}
                            </div>
                            <div className="mt-3 text-sm text-muted-foreground">
                                Estimated Commission:{' '}
                                {money(Number(listing.price) * 0.03)} (3%)
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-8 border-b border-border">
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
                                        ? 'border-b-2 border-primary pb-4 text-sm font-semibold text-primary'
                                        : 'pb-4 text-sm text-muted-foreground'
                                }
                            >
                                {tab.label}
                                {tab.key === 'offers' &&
                                    (listing.offers?.length ?? 0) > 0 && (
                                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
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
                                        onClick={() => setDeleteOpen(true)}
                                    >
                                        <Trash2 className="size-4" />
                                        Delete
                                    </Button>
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <section className="mt-8 rounded-md border border-border bg-card p-5">
                            {activeTab === 'inquiries' && (
                                <ActivityTable
                                    domain="inquiry"
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
                                    domain="viewing"
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
            <Dialog
                open={deleteOpen}
                onOpenChange={(open) => !deletePending && setDeleteOpen(open)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete listing?</DialogTitle>
                        <DialogDescription>
                            Delete “{listing.address}”? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={deletePending}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={destroyListing}
                            disabled={deletePending}
                        >
                            {deletePending ? 'Deleting…' : 'Delete listing'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
        <section className="overflow-hidden rounded-md border border-border bg-card p-1">
            <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-muted">
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
                    <GallerySummary
                        icon={<ImageIcon />}
                        label={`${media.length} photos`}
                    />
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
        <div className="relative aspect-[16/5] overflow-hidden rounded-sm bg-muted">
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
                <div className="absolute inset-0 flex items-center justify-center bg-overlay/70 text-sm font-semibold text-overlay-foreground">
                    +{count}
                </div>
            )}
        </div>
    );
}

function DescriptionCard({ listing }: { listing: ListingDetail }) {
    return (
        <section className="rounded-md border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold">Property Description</h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">
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
        <section className="rounded-md border border-border bg-card p-5">
            <div className="grid grid-cols-3 divide-x divide-border text-center">
                <Stat
                    icon={<BedDouble />}
                    value={listing.bedrooms ?? '-'}
                    label="Beds"
                />
                <Stat
                    icon={<Bath />}
                    value={listing.bathrooms ?? '-'}
                    label="Baths"
                />
                <Stat
                    icon={<Ruler />}
                    value={listing.area_sqft ?? '-'}
                    label="SqFt"
                />
            </div>
            <div className="mt-6 border-t border-border pt-4 text-sm">
                <InfoLine label="Price / SqFt" value={pricePerSqft(listing)} />
                <InfoLine label="Lot Size" value="Not recorded" />
                <InfoLine
                    label="Days on Market"
                    value={String(daysOnMarket(listing.created_at))}
                />
            </div>
            <Button
                asChild
                className="mt-5 h-11 w-full rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
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
        <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">Price Analysis</h2>
            <p className="mt-4 text-sm text-muted-foreground">
                Comparable market data is not available.
            </p>
        </section>
    );
}

function AgentCard({ listing }: { listing: ListingDetail }) {
    return (
        <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">Listing Agent</h2>
            <div className="mt-5 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-md bg-status-info text-sm font-semibold text-status-info-foreground">
                    {initials(listing.assigned_agent?.name ?? 'Agent')}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                        {listing.assigned_agent?.name ?? 'Unassigned'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {listing.assigned_agent?.email ?? 'No email'}
                    </div>
                </div>
                {listing.assigned_agent?.email && (
                    <a
                        href={`mailto:${listing.assigned_agent.email}`}
                        className="inline-flex size-9 items-center justify-center rounded-sm border border-border"
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
        <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Owner
            </h2>
            {listing.owner ? (
                <div className="mt-4 text-sm">
                    <div className="font-semibold">
                        {contactName(listing.owner)}
                    </div>
                    <div className="mt-1 text-muted-foreground">
                        {listing.owner.email ?? '-'}
                    </div>
                    <div className="mt-1 text-muted-foreground">
                        {listing.owner.phone ?? '-'}
                    </div>
                </div>
            ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                    No owner linked.
                </p>
            )}
        </section>
    );
}

function ActivityTable({
    rows,
    empty,
    domain,
}: {
    rows: Array<{
        id: string;
        primary: string;
        secondary: string;
        status: string;
        amount: string;
    }>;
    empty: string;
    domain: 'inquiry' | 'viewing';
}) {
    if (rows.length === 0) {
        return <EmptyState>{empty}</EmptyState>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs font-medium text-muted-foreground uppercase">
                    <tr>
                        <th className="px-3 py-2">Contact</th>
                        <th className="px-3 py-2">Details</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Value</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td className="px-3 py-3 font-medium">
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
                    className="rounded-md border border-border p-4"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="font-semibold">
                                {money(offer.amount)}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                                {offer.contact
                                    ? contactName(offer.contact)
                                    : 'Unknown contact'}
                            </div>
                        </div>
                        <StatusBadge domain="offer" status={offer.status} />
                    </div>
                    {offer.notes && (
                        <p className="mt-3 text-sm text-muted-foreground">
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
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"
                >
                    <div>
                        <div className="font-semibold">{task.title}</div>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span>{task.assignee?.name ?? 'Unassigned'}</span>
                            <span>
                                {task.due_date
                                    ? formatDate(task.due_date)
                                    : 'No due date'}
                            </span>
                        </div>
                    </div>
                    <StatusBadge domain="task" status={task.status} />
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
                    className="rounded-md border border-border p-4"
                >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="size-4" />
                        <span>{note.author?.name ?? 'Unknown author'}</span>
                        <span>{formatDate(note.created_at)}</span>
                    </div>
                    <p className="mt-3 text-sm text-foreground">{note.body}</p>
                </div>
            ))}
        </div>
    );
}

function GallerySummary({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <span className="inline-flex h-9 items-center gap-2 rounded-sm bg-card/90 px-4 text-sm font-semibold text-foreground">
            <span className="[&_svg]:size-4">{icon}</span>
            {label}
        </span>
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
            <div className="flex size-9 items-center justify-center rounded-full bg-muted text-primary [&_svg]:size-4">
                {icon}
            </div>
            <div>
                <div className="text-sm text-muted-foreground">{label}</div>
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
            <div className="mx-auto flex size-7 items-center justify-center text-muted-foreground [&_svg]:size-5">
                {icon}
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
            <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </div>
        </div>
    );
}

function InfoLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
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
            className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
        >
            <ImageIcon className={compact ? 'size-4' : 'size-10'} />
        </div>
    );
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
