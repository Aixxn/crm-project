import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    Check,
    Clock3,
    Circle,
    KeyRound,
    MailCheck,
    MapPin,
    MessageSquare,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { formatDateTime } from '@/lib/format';
import type { WorkflowDomain } from '@/lib/workflow-status';
import { PublicLayout } from './_components/public-layout';

type DealListing = {
    title: string;
    price: string;
    image?: string | null;
    href: string;
};

type DealItem = {
    status: string;
    listing?: DealListing | null;
    amount?: string;
    scheduledAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    message?: string | null;
};

type DealTrackerProps = {
    kpis?: {
        activeOffers: number;
        inquiries: number;
        viewings: number;
    };
    activeOffer?: DealItem | null;
    upcomingViewing?: DealItem | null;
    latestInquiry?: DealItem | null;
};

export default function DealTracker({
    kpis = { activeOffers: 0, inquiries: 0, viewings: 0 },
    activeOffer,
    upcomingViewing,
    latestInquiry,
}: DealTrackerProps) {
    const hasActivity = Boolean(
        activeOffer || upcomingViewing || latestInquiry,
    );
    const scheduledAt = upcomingViewing?.scheduledAt
        ? formatDateTime(upcomingViewing.scheduledAt)
        : null;

    return (
        <PublicLayout title="Deal Tracker" active="Concierge">
            <section className="mx-auto max-w-7xl px-5 py-11">
                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <h1 className="text-5xl font-semibold tracking-tight">
                            Deal Tracker
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
                            Monitor the progress of your active inquiries,
                            scheduled viewings, and submitted offers in
                            real-time.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Kpi
                            label="Active Offers"
                            value={String(kpis.activeOffers)}
                        />
                        <Kpi label="Inquiries" value={String(kpis.inquiries)} />
                    </div>
                </div>

                {!hasActivity && (
                    <EmptyState
                        title="No active buyer activity"
                        body="Inquiries, viewing requests, and offers will appear here once you start engaging with listings."
                    />
                )}

                {activeOffer?.listing && (
                    <section className="mt-8 grid overflow-hidden rounded-md border border-border bg-card lg:grid-cols-[26rem_1fr]">
                        <div className="relative min-h-[25.75rem] bg-muted">
                            {activeOffer.listing.image ? (
                                <img
                                    src={activeOffer.listing.image}
                                    alt={activeOffer.listing.title}
                                    className="absolute inset-0 size-full object-cover"
                                />
                            ) : (
                                <div className="flex size-full min-h-[25.75rem] items-center justify-center text-sm text-muted-foreground">
                                    No image available
                                </div>
                            )}
                            <div className="absolute top-5 left-4">
                                <StatusBadge
                                    domain="offer"
                                    status={activeOffer.status}
                                />
                            </div>
                        </div>

                        <div className="flex min-w-0 flex-col p-5 md:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-semibold">
                                        {activeOffer.listing.title}
                                    </h2>
                                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                                        <MapPin className="size-4" />
                                        Los Angeles, CA 90210
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-semibold">
                                        {activeOffer.amount ??
                                            activeOffer.listing.price}
                                    </div>
                                    <Link
                                        href={activeOffer.listing.href}
                                        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
                                    >
                                        View Details
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-auto rounded-sm border border-border bg-muted p-6">
                                <Progress status={activeOffer.status} />
                                <div className="mt-5 border-t border-border pt-5">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <p className="text-sm text-muted-foreground">
                                            Last update:{' '}
                                            {activeOffer.updatedAt ??
                                                'Seller agent reviewing contingencies. (2 hours ago)'}
                                        </p>
                                        <span className="text-sm text-muted-foreground">
                                            Contact your listing agent for an
                                            update.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {upcomingViewing?.listing && (
                        <section className="rounded-md border border-border bg-card p-5">
                            <DealHeader
                                listing={upcomingViewing.listing}
                                icon={<CalendarDays className="size-3.5" />}
                                domain="viewing"
                                status={upcomingViewing.status}
                            />

                            <div className="mt-6 rounded-sm border border-border bg-muted p-4">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <div className="font-semibold">
                                            In-Person Tour
                                        </div>
                                        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                                            <Clock3 className="size-4" />
                                            {scheduledAt ??
                                                'Pending confirmation'}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    <span className="inline-flex min-h-9 items-center text-sm text-muted-foreground">
                                        To request a change, contact your agent.
                                    </span>
                                    <Link
                                        href={upcomingViewing.listing.href}
                                        className="inline-flex h-9 items-center justify-center rounded-sm bg-muted text-sm font-semibold text-primary"
                                    >
                                        Property Detail
                                    </Link>
                                </div>
                            </div>
                        </section>
                    )}

                    {latestInquiry?.listing && (
                        <section className="rounded-md border border-border bg-card p-5">
                            <DealHeader
                                listing={latestInquiry.listing}
                                icon={<MessageSquare className="size-3.5" />}
                                domain="inquiry"
                                status={latestInquiry.status}
                            />

                            <div className="mt-6 rounded-sm border border-border bg-muted p-5">
                                <div className="flex gap-4">
                                    <MailCheck className="mt-1 size-6 text-muted-foreground" />
                                    <div>
                                        <div className="font-semibold">
                                            {latestInquiry.message ??
                                                'Message sent to listing agent'}
                                        </div>
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            Sent:{' '}
                                            {latestInquiry.createdAt ??
                                                'Recently'}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 h-1 rounded-full bg-border">
                                    <div className="h-1 w-1/4 rounded-full bg-primary" />
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                                    <Link
                                        href={latestInquiry.listing.href}
                                        className="inline-flex items-center gap-1 font-semibold text-primary"
                                    >
                                        Property Detail
                                        <ArrowRight className="size-4" />
                                    </Link>
                                    <span className="text-muted-foreground">
                                        Awaiting Response
                                    </span>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </section>

            <footer className="border-t border-border bg-card">
                <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 text-sm text-muted-foreground md:grid-cols-[1.2fr_1fr_1fr]">
                    <div>
                        <div className="text-2xl font-semibold text-primary">
                            EstatePro
                        </div>
                        <p className="mt-6">
                            Copyright 2026 EstatePro. All rights reserved.
                        </p>
                    </div>
                    <FooterLinks links={['Terms', 'Privacy']} />
                    <FooterLinks
                        links={['Contact Us', 'Our Agents', 'Careers']}
                    />
                </div>
            </footer>
        </PublicLayout>
    );
}

function DealHeader({
    listing,
    icon,
    domain,
    status,
}: {
    listing: DealListing;
    icon: ReactNode;
    domain: WorkflowDomain;
    status: string;
}) {
    return (
        <div className="flex items-start gap-4">
            {listing.image ? (
                <img
                    src={listing.image}
                    alt={listing.title}
                    className="size-24 rounded-sm object-cover"
                />
            ) : (
                <div className="flex size-24 items-center justify-center rounded-sm bg-muted text-xs text-muted-foreground">
                    No image
                </div>
            )}
            <div>
                <div className="flex items-center gap-1">
                    {icon}
                    <StatusBadge domain={domain} status={status} />
                </div>
                <h2 className="mt-3 text-xl font-semibold">{listing.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {listing.price}
                </p>
            </div>
        </div>
    );
}

function Progress({ status }: { status: string }) {
    const currentIndex = status === 'Accepted' ? 3 : 2;

    return (
        <div className="grid grid-cols-4 items-start text-center text-sm">
            {progressSteps.map((step, index) => (
                <div key={step.label} className="relative">
                    {index < progressSteps.length - 1 && (
                        <div
                            className={`absolute top-3 left-1/2 h-1 w-full ${
                                index < currentIndex
                                    ? 'bg-primary'
                                    : 'bg-border'
                            }`}
                        />
                    )}
                    <div
                        className={`relative z-10 mx-auto flex size-7 items-center justify-center rounded-full border-2 ${
                            index < currentIndex
                                ? 'border-primary bg-primary text-primary-foreground'
                                : index === currentIndex
                                  ? 'border-primary bg-card text-primary'
                                  : 'border-border bg-muted text-muted-foreground'
                        }`}
                    >
                        <step.icon className="size-4" />
                    </div>
                    <div
                        className={`mt-2 font-semibold ${index === currentIndex ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        {step.label}
                    </div>
                </div>
            ))}
        </div>
    );
}

const progressSteps = [
    { label: 'Inquiry', icon: Check },
    { label: 'Viewing', icon: Check },
    { label: 'Offer Pending', icon: Circle },
    { label: 'Closing', icon: KeyRound },
] as const;

function Kpi({ label, value }: { label: string; value: string }) {
    return (
        <div className="w-32 rounded-md border border-border bg-muted p-4">
            <div className="text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase">
                {label}
            </div>
            <div className="mt-3 text-3xl font-semibold">{value}</div>
        </div>
    );
}

function EmptyState({ title, body }: { title: string; body: string }) {
    return (
        <div className="mt-8 rounded-md border border-dashed border-border bg-card p-10 text-center">
            <div className="text-lg font-semibold">{title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            <Link
                href="/browse"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
                Browse listings
                <ArrowRight className="size-4" />
            </Link>
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
