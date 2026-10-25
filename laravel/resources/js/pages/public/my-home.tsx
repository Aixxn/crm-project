import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Bookmark,
    CalendarDays,
    Clock3,
    Heart,
    History,
    MapPin,
    Search,
} from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { formatDateTime } from '@/lib/format';
import { PublicLayout } from './_components/public-layout';

type SavedProperty = {
    id: string;
    title: string;
    price: string;
    image?: string | null;
    href: string;
    status?: string;
};

type RecentSearch = {
    id: string;
    name: string;
};

type NextViewing = {
    status: string;
    scheduledAt?: string | null;
    listing?: SavedProperty | null;
    agent?: {
        name?: string | null;
        email?: string | null;
    };
};

type MyHomeProps = {
    profile?: {
        name?: string;
    };
    nextViewing?: NextViewing | null;
    savedListings?: SavedProperty[];
    savedListingsTotal?: number;
    recentSearches?: RecentSearch[];
};

export default function MyHome({
    profile,
    nextViewing,
    savedListings = [],
    savedListingsTotal,
    recentSearches = [],
}: MyHomeProps) {
    const viewingListing = nextViewing?.listing;
    const scheduledAt = nextViewing?.scheduledAt
        ? formatDateTime(nextViewing.scheduledAt)
        : null;

    return (
        <PublicLayout title="My Home" active="Saved">
            <section className="mx-auto max-w-7xl px-5 py-10">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <h1 className="text-5xl font-semibold tracking-tight">
                            My Home
                        </h1>
                        <p className="mt-4 text-base text-muted-foreground">
                            Welcome back, {profile?.name ?? 'buyer'}. Here is
                            your personalized dashboard.
                        </p>
                    </div>
                    <Link
                        href="/browse"
                        className="inline-flex h-11 items-center justify-center gap-3 rounded-sm bg-primary px-7 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                        <Search className="size-5" />
                        Resume Searching
                    </Link>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(21rem,1fr)]">
                    <section className="rounded-md border border-border bg-card p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <CalendarDays className="size-5 text-primary" />
                                <h2 className="text-xl font-semibold">
                                    Next Appointment
                                </h2>
                            </div>
                            {nextViewing && (
                                <StatusBadge
                                    domain="viewing"
                                    status={nextViewing.status}
                                />
                            )}
                        </div>

                        {viewingListing ? (
                            <div className="mt-6 grid gap-6 md:grid-cols-[16rem_1fr]">
                                {viewingListing.image ? (
                                    <img
                                        src={viewingListing.image}
                                        alt={viewingListing.title}
                                        className="h-48 w-full rounded-sm object-cover"
                                    />
                                ) : (
                                    <div className="flex h-48 w-full items-center justify-center rounded-sm bg-muted text-sm text-muted-foreground">
                                        No image available
                                    </div>
                                )}
                                <div className="flex min-w-0 flex-col">
                                    <div>
                                        <h3 className="text-2xl font-semibold">
                                            {viewingListing.title}
                                        </h3>
                                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="size-4" />
                                            {viewingListing.status}
                                        </div>
                                    </div>

                                    <div className="mt-auto border-t border-border pt-5">
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <DashboardMeta
                                                label="Date & Time"
                                                value={
                                                    scheduledAt
                                                        ? scheduledAt
                                                        : 'Pending'
                                                }
                                            />
                                            <div>
                                                <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                                    Agent
                                                </div>
                                                <div className="mt-2 font-semibold">
                                                    {nextViewing?.agent?.name ??
                                                        'Listing Agent'}
                                                </div>
                                                {nextViewing?.agent?.email && (
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        {
                                                            nextViewing.agent
                                                                .email
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                title="No upcoming viewings"
                                body="Requested and scheduled tours will appear here."
                                href="/browse"
                                action="Browse listings"
                            />
                        )}
                    </section>

                    <section className="rounded-md border border-border bg-card p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <History className="size-5 text-muted-foreground" />
                                <h2 className="text-xl font-semibold">
                                    Recent Searches
                                </h2>
                            </div>
                        </div>

                        {recentSearches.length > 0 ? (
                            <div className="mt-6 flex flex-wrap gap-3">
                                {recentSearches.map((search) => (
                                    <span
                                        key={search.id}
                                        className="inline-flex items-center gap-2 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground"
                                    >
                                        <Search className="size-4" />
                                        {search.name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No recent searches"
                                body="Saved searches will appear here after you browse listings."
                                href="/browse"
                                action="Start searching"
                                compact
                            />
                        )}
                    </section>
                </div>

                <section className="mt-4 rounded-md border border-border bg-card p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Bookmark className="size-5 fill-primary text-primary" />
                            <h2 className="text-xl font-semibold">
                                Saved Properties
                            </h2>
                        </div>
                        <Link
                            href="/browse"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                        >
                            View All (
                            {savedListingsTotal ?? savedListings.length})
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>

                    <div className="mt-5 border-t border-border pt-6">
                        {savedListings.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {savedListings.map((property) => (
                                    <Link
                                        key={property.id}
                                        href={property.href}
                                        className="group"
                                    >
                                        <div className="relative overflow-hidden rounded-sm border border-border bg-muted">
                                            {property.image ? (
                                                <img
                                                    src={property.image}
                                                    alt={property.title}
                                                    className="aspect-[16/9] w-full object-cover transition group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex aspect-[16/9] w-full items-center justify-center text-sm text-muted-foreground">
                                                    No image available
                                                </div>
                                            )}
                                            <span className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                <Heart className="size-4 fill-white" />
                                            </span>
                                        </div>
                                        <div className="mt-3 text-sm font-semibold">
                                            {property.title}
                                        </div>
                                        <div className="mt-1 text-sm text-muted-foreground">
                                            {property.price}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No saved homes"
                                body="Save homes from Browse to compare them here."
                                href="/browse"
                                action="Find homes"
                                compact
                            />
                        )}
                    </div>
                </section>
            </section>

            <footer className="border-t border-border bg-card">
                <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 text-sm text-muted-foreground md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                    <div>
                        <div className="text-2xl font-semibold text-primary">
                            EstatePro
                        </div>
                        <p className="mt-6">
                            Copyright 2026 EstatePro. All rights reserved.
                        </p>
                    </div>
                    <FooterLinks links={['Terms', 'Privacy']} />
                    <FooterLinks links={['Contact Us', 'Our Agents']} />
                    <FooterLinks links={['Careers']} />
                </div>
            </footer>
        </PublicLayout>
    );
}

function DashboardMeta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {label}
            </div>
            <div className="mt-2 flex items-center gap-2 font-semibold">
                <Clock3 className="size-4 text-muted-foreground" />
                {value}
            </div>
        </div>
    );
}

function EmptyState({
    title,
    body,
    href,
    action,
    compact = false,
}: {
    title: string;
    body: string;
    href?: string;
    action?: string;
    compact?: boolean;
}) {
    return (
        <div
            className={
                compact
                    ? 'mt-4 rounded-sm border border-dashed border-border p-5 text-sm'
                    : 'mt-6 rounded-sm border border-dashed border-border p-6'
            }
        >
            <div className="font-semibold">{title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            {href && action && (
                <Link
                    href={href}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                    {action}
                    <ArrowRight className="size-4" />
                </Link>
            )}
        </div>
    );
}

function FooterLinks({ links }: { links: string[] }) {
    return (
        <div className="grid content-start gap-4">
            {links.map((link) => (
                <span key={link}>{link}</span>
            ))}
        </div>
    );
}
