import { Head, Link } from '@inertiajs/react';
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
    TicketCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { PublicHeader } from './_components/public-header';

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
        ? new Date(upcomingViewing.scheduledAt)
        : null;
    const viewingEndTime = scheduledAt
        ? new Date(scheduledAt.getTime() + 60 * 60 * 1000)
        : null;

    return (
        <>
            <Head title="Deal Tracker" />
            <main className="min-h-screen bg-[#FBFBFE] text-[#202230]">
                <PublicHeader active="Concierge" />

                <section className="mx-auto max-w-7xl px-5 py-11">
                    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                            <h1 className="text-5xl font-semibold tracking-tight">
                                Deal Tracker
                            </h1>
                            <p className="mt-5 max-w-3xl text-base leading-7 text-[#4F5365]">
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
                            <Kpi
                                label="Inquiries"
                                value={String(kpis.inquiries)}
                            />
                        </div>
                    </div>

                    {!hasActivity && (
                        <EmptyState
                            title="No active buyer activity"
                            body="Inquiries, viewing requests, and offers will appear here once you start engaging with listings."
                        />
                    )}

                    {activeOffer?.listing && (
                        <section className="mt-8 grid overflow-hidden rounded-md border border-[#C8CDDA] bg-white lg:grid-cols-[26rem_1fr]">
                            <div className="relative min-h-[25.75rem] bg-[#EEF0F6]">
                                {activeOffer.listing.image ? (
                                    <img
                                        src={activeOffer.listing.image}
                                        alt={activeOffer.listing.title}
                                        className="absolute inset-0 size-full object-cover"
                                    />
                                ) : (
                                    <div className="flex size-full min-h-[25.75rem] items-center justify-center text-sm text-[#6E7284]">
                                        No image available
                                    </div>
                                )}
                                <span className="absolute top-5 left-4 inline-flex items-center gap-1 rounded-full bg-[#FFE2D5] px-4 py-1.5 text-sm font-semibold text-[#9A3A15]">
                                    <TicketCheck className="size-4" />
                                    {activeOffer.status}
                                </span>
                            </div>

                            <div className="flex min-w-0 flex-col p-5 md:p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-semibold">
                                            {activeOffer.listing.title}
                                        </h2>
                                        <div className="mt-2 flex items-center gap-1 text-sm text-[#4F5365]">
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
                                            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
                                        >
                                            View Details
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="mt-auto rounded-sm border border-[#CDD2E0] bg-[#F0F1FA] p-6">
                                    <Progress status={activeOffer.status} />
                                    <div className="mt-5 border-t border-[#D8DCE8] pt-5">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <p className="text-sm text-[#5F6373]">
                                                Last update:{' '}
                                                {activeOffer.updatedAt ??
                                                    'Seller agent reviewing contingencies. (2 hours ago)'}
                                            </p>
                                            <button className="inline-flex h-9 items-center justify-center rounded-sm bg-blue-700 px-6 text-sm font-semibold text-white hover:bg-blue-800">
                                                Contact Agent
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        {upcomingViewing?.listing && (
                            <section className="rounded-md border border-[#C8CDDA] bg-white p-5">
                                <DealHeader
                                    listing={upcomingViewing.listing}
                                    icon={<CalendarDays className="size-3.5" />}
                                    status={upcomingViewing.status}
                                />

                                <div className="mt-6 rounded-sm border border-[#CDD2E0] bg-[#F0F1FA] p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-sm border border-[#CDD2E0] bg-white px-4 py-3 text-center">
                                            <div className="text-xs font-semibold text-[#5F6373] uppercase">
                                                {scheduledAt
                                                    ? scheduledAt.toLocaleString(
                                                          'default',
                                                          { month: 'short' },
                                                      )
                                                    : 'Tour'}
                                            </div>
                                            <div className="text-3xl font-semibold text-blue-700">
                                                {scheduledAt
                                                    ? scheduledAt.getDate()
                                                    : '--'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-semibold">
                                                In-Person Tour
                                            </div>
                                            <div className="mt-2 flex items-center gap-1 text-sm text-[#4F5365]">
                                                <Clock3 className="size-4" />
                                                {scheduledAt
                                                    ? `${scheduledAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${viewingEndTime?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                                                    : 'Pending confirmation'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                        <button className="h-9 rounded-sm border border-[#8C92A4] text-sm font-semibold">
                                            Reschedule
                                        </button>
                                        <Link
                                            href={upcomingViewing.listing.href}
                                            className="inline-flex h-9 items-center justify-center rounded-sm bg-[#F2F3FA] text-sm font-semibold text-blue-700"
                                        >
                                            Property Detail
                                        </Link>
                                    </div>
                                </div>
                            </section>
                        )}

                        {latestInquiry?.listing && (
                            <section className="rounded-md border border-[#C8CDDA] bg-white p-5">
                                <DealHeader
                                    listing={latestInquiry.listing}
                                    icon={
                                        <MessageSquare className="size-3.5" />
                                    }
                                    status={latestInquiry.status}
                                />

                                <div className="mt-6 rounded-sm border border-[#CDD2E0] bg-[#F0F1FA] p-5">
                                    <div className="flex gap-4">
                                        <MailCheck className="mt-1 size-6 text-[#5F6373]" />
                                        <div>
                                            <div className="font-semibold">
                                                {latestInquiry.message ??
                                                    'Message sent to listing agent'}
                                            </div>
                                            <div className="mt-2 text-sm text-[#5F6373]">
                                                Sent:{' '}
                                                {latestInquiry.createdAt ??
                                                    'Recently'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 h-1 rounded-full bg-[#D8DCE8]">
                                        <div className="h-1 w-1/4 rounded-full bg-blue-700" />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                                        <Link
                                            href={latestInquiry.listing.href}
                                            className="inline-flex items-center gap-1 font-semibold text-blue-700"
                                        >
                                            Property Detail
                                            <ArrowRight className="size-4" />
                                        </Link>
                                        <span className="text-[#5F6373]">
                                            Awaiting Response
                                        </span>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </section>

                <footer className="border-t border-[#D8DCE8] bg-white">
                    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 text-sm text-[#5F6373] md:grid-cols-[1.2fr_1fr_1fr]">
                        <div>
                            <div className="text-2xl font-semibold text-blue-700">
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
            </main>
        </>
    );
}

function DealHeader({
    listing,
    icon,
    status,
}: {
    listing: DealListing;
    icon: ReactNode;
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
                <div className="flex size-24 items-center justify-center rounded-sm bg-[#EEF0F6] text-xs text-[#6E7284]">
                    No image
                </div>
            )}
            <div>
                <span className="inline-flex items-center gap-1 bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                    {icon}
                    {status}
                </span>
                <h2 className="mt-3 text-xl font-semibold">{listing.title}</h2>
                <p className="mt-1 text-sm text-[#5F6373]">{listing.price}</p>
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
                                    ? 'bg-blue-700'
                                    : 'bg-[#D8DCE8]'
                            }`}
                        />
                    )}
                    <div
                        className={`relative z-10 mx-auto flex size-7 items-center justify-center rounded-full border-2 ${
                            index < currentIndex
                                ? 'border-blue-700 bg-blue-700 text-white'
                                : index === currentIndex
                                  ? 'border-blue-700 bg-white text-blue-700'
                                  : 'border-[#C9CDDA] bg-[#F7F8FC] text-[#6E7284]'
                        }`}
                    >
                        <step.icon className="size-4" />
                    </div>
                    <div
                        className={`mt-2 font-semibold ${index === currentIndex ? 'text-blue-700' : 'text-[#4F5365]'}`}
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
        <div className="w-32 rounded-md border border-[#C8CDDA] bg-[#F0F1FA] p-4">
            <div className="whitespace-nowrap text-xs font-semibold tracking-wide text-[#4F5365] uppercase">
                {label}
            </div>
            <div className="mt-3 text-3xl font-semibold">{value}</div>
        </div>
    );
}

function EmptyState({ title, body }: { title: string; body: string }) {
    return (
        <div className="mt-8 rounded-md border border-dashed border-[#C8CDDA] bg-white p-10 text-center">
            <div className="text-lg font-semibold">{title}</div>
            <p className="mt-2 text-sm text-[#5F6373]">{body}</p>
            <Link
                href="/browse"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
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
