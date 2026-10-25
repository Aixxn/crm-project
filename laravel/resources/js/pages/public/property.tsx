import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Bath,
    BedDouble,
    CalendarClock,
    Heart,
    Mail,
    Phone,
    Ruler,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { agencyDatetimeToIso } from '@/lib/agency-time';
import { PublicLayout } from './_components/public-layout';

type PublicListingDetail = {
    id: string;
    href: string;
    image?: string | null;
    formattedPrice: string;
    address: string;
    propertyType?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    areaSqft?: number | null;
    status: string;
    media?: { id: string; url: string; type: string }[];
    agent?: {
        name?: string | null;
        email?: string | null;
    };
};

type PropertyProps = {
    listing?: PublicListingDetail | null;
    isSaved?: boolean;
    submitInquiryUrl?: string | null;
    requestViewingUrl?: string | null;
    saveListingUrl?: string;
    unsaveListingUrl?: string | null;
};

export default function Property({
    listing,
    isSaved = false,
    submitInquiryUrl,
    requestViewingUrl,
    saveListingUrl = '/saved-listings',
    unsaveListingUrl,
}: PropertyProps) {
    const { auth } = usePage().props;

    if (!listing) {
        return (
            <PublicLayout title="Listing unavailable" active="Browse">
                <section className="mx-auto max-w-3xl px-5 py-20 text-center">
                    <div className="rounded-md border border-dashed border-border bg-card p-10">
                        <h1 className="text-3xl font-semibold">
                            Listing unavailable
                        </h1>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            This property is no longer available or is not
                            visible in the buyer portal.
                        </p>
                        <Link
                            href="/browse"
                            className="mt-6 inline-flex h-11 items-center justify-center rounded-sm bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                            Browse available listings
                        </Link>
                    </div>
                </section>
            </PublicLayout>
        );
    }

    const gallery = listing.media?.length
        ? listing.media
        : listing.image
          ? [{ id: 'primary', url: listing.image, type: 'photo' }]
          : [];

    const toggleSaved = () => {
        if (!auth.user) {
            router.visit('/login');

            return;
        }

        if (isSaved && unsaveListingUrl) {
            router.delete(unsaveListingUrl, { preserveScroll: true });

            return;
        }

        router.post(
            saveListingUrl,
            { listing_id: listing.id },
            { preserveScroll: true },
        );
    };

    return (
        <PublicLayout title={listing.address} active="Browse">
            <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
                    <div className="relative min-h-[33rem] overflow-hidden rounded-md bg-overlay text-overlay-foreground">
                        {gallery[0] ? (
                            <img
                                src={gallery[0].url}
                                alt={listing.address}
                                className="absolute inset-0 size-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground">
                                No image available
                            </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-overlay/95 via-overlay/65 to-overlay/35" />
                        <div className="absolute top-5 left-5">
                            <StatusBadge
                                domain="listing"
                                status={listing.status}
                            />
                        </div>
                        <div className="absolute right-5 bottom-6 left-5 rounded-md bg-overlay/75 p-4 text-overlay-foreground">
                            <div className="mb-3 text-sm font-semibold">
                                {listing.status} Listing
                            </div>
                            <div className="text-4xl font-semibold tracking-tight md:text-5xl">
                                {listing.formattedPrice}
                            </div>
                            <p className="mt-3 max-w-2xl text-sm text-overlay-foreground">
                                {listing.address}
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium text-overlay-foreground">
                                <HeroMetric
                                    icon={<BedDouble />}
                                    label={`${listing.bedrooms ?? 'TBD'} Beds`}
                                />
                                <HeroMetric
                                    icon={<Bath />}
                                    label={`${listing.bathrooms ?? 'TBD'} Baths`}
                                />
                                <HeroMetric
                                    icon={<Ruler />}
                                    label={
                                        listing.areaSqft
                                            ? `${listing.areaSqft.toLocaleString()} Sq Ft`
                                            : 'Area TBD'
                                    }
                                />
                            </div>
                        </div>
                        <div className="absolute top-5 right-5 flex gap-3">
                            <IconAction
                                label={
                                    isSaved ? 'Remove saved listing' : 'Save'
                                }
                                onClick={toggleSaved}
                            >
                                <Heart
                                    className={
                                        isSaved
                                            ? 'size-4 fill-primary text-primary'
                                            : 'size-4'
                                    }
                                />
                            </IconAction>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <GallerySlot media={gallery[1]} />
                        <GallerySlot media={gallery[2]} />
                        <ContactCard
                            listing={listing}
                            submitInquiryUrl={submitInquiryUrl}
                            requestViewingUrl={requestViewingUrl}
                            isAuthenticated={Boolean(auth.user)}
                        />
                    </div>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
                    <div className="space-y-8">
                        <section className="rounded-md bg-card p-6 shadow-sm">
                            <h1 className="text-2xl font-semibold">
                                Property Overview
                            </h1>
                            <p className="mt-4 text-sm leading-7 text-muted-foreground">
                                This {listing.propertyType ?? 'property'} is
                                currently listed as {listing.status}. Review the
                                available facts and contact the listing agent
                                for disclosures, showing windows, and next
                                steps.
                            </p>
                        </section>

                        <section className="rounded-md bg-card p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">
                                Listing Facts
                            </h2>
                            <div className="mt-5 grid gap-3 sm:grid-cols-4">
                                {[
                                    ['Type', listing.propertyType ?? 'TBD'],
                                    ['Beds', String(listing.bedrooms ?? 'TBD')],
                                    [
                                        'Baths',
                                        String(listing.bathrooms ?? 'TBD'),
                                    ],
                                    [
                                        'Area',
                                        listing.areaSqft
                                            ? `${listing.areaSqft.toLocaleString()}`
                                            : 'TBD',
                                    ],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="rounded-md border border-border p-4 text-center"
                                    >
                                        <div className="text-2xl font-semibold text-primary">
                                            {value}
                                        </div>
                                        <div className="mt-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                            {label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="hidden lg:block" />
                </div>
            </section>
        </PublicLayout>
    );
}

function ContactCard({
    listing,
    submitInquiryUrl,
    requestViewingUrl,
    isAuthenticated,
}: {
    listing: PublicListingDetail;
    submitInquiryUrl?: string | null;
    requestViewingUrl?: string | null;
    isAuthenticated: boolean;
}) {
    const inquiryForm = useForm({
        intent: 'buy',
        budget: '',
        message: `I would like more information about ${listing.address}.`,
    });
    const viewingForm = useForm({
        intent: 'buy',
        preferred_date: '',
        preferred_time: '',
        scheduled_at: '',
    });
    const [viewingRequested, setViewingRequested] = useState(false);

    const requireAuth = () => {
        if (!isAuthenticated) {
            router.visit('/login');

            return false;
        }

        return true;
    };

    const submitInquiry = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!requireAuth() || !submitInquiryUrl) {
            return;
        }

        inquiryForm.post(submitInquiryUrl, { preserveScroll: true });
    };

    const submitViewing = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!requireAuth() || !requestViewingUrl) {
            return;
        }

        const scheduledAt =
            viewingForm.data.preferred_date && viewingForm.data.preferred_time
                ? `${viewingForm.data.preferred_date}T${viewingForm.data.preferred_time}`
                : '';

        viewingForm.transform((data) => ({
            intent: data.intent,
            scheduled_at: agencyDatetimeToIso(scheduledAt || data.scheduled_at),
        }));

        viewingForm.post(requestViewingUrl, {
            preserveScroll: true,
            onSuccess: () => {
                setViewingRequested(true);
                viewingForm.reset();
                viewingForm.transform((data) => data);
            },
            onError: () => viewingForm.transform((data) => data),
        });
    };

    const selectedViewingLabel =
        viewingForm.data.preferred_date && viewingForm.data.preferred_time
            ? new Date(
                  agencyDatetimeToIso(
                      `${viewingForm.data.preferred_date}T${viewingForm.data.preferred_time}`,
                  ),
              ).toLocaleString('en-PH', {
                  timeZone: 'Asia/Manila',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
              })
            : null;

    return (
        <aside className="rounded-md bg-card p-5 shadow-[0_18px_45px_rgba(25,32,56,0.16)] lg:relative lg:mx-5 lg:-mt-20">
            <div className="flex items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-full bg-status-info text-sm font-semibold text-status-info-foreground">
                    {(listing.agent?.name ?? 'Agent').slice(0, 1)}
                </div>
                <div>
                    <div className="font-semibold">
                        {listing.agent?.name ?? 'Listing Agent'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {listing.agent?.email ?? 'EstatePro'}
                    </div>
                </div>
            </div>
            {viewingRequested ? (
                <div className="mt-5 rounded-sm border border-status-info-border bg-status-info p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-status-info-foreground">
                        <CalendarClock className="size-4" />
                        Viewing request sent
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        The listing agent has received your preferred viewing
                        time and will confirm availability.
                    </p>
                    <Button
                        type="button"
                        className="mt-4 h-10 w-full rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => setViewingRequested(false)}
                    >
                        Request another time
                    </Button>
                </div>
            ) : (
                <form className="mt-5 grid gap-3" onSubmit={submitViewing}>
                    <label className="grid gap-1.5 text-sm font-medium text-foreground">
                        Viewing intent
                        <select
                            value={viewingForm.data.intent}
                            onChange={(event) =>
                                viewingForm.setData(
                                    'intent',
                                    event.target.value,
                                )
                            }
                            className="h-11 rounded-md border border-input bg-background px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            <option value="buy">Buy</option>
                            <option value="rent">Rent</option>
                        </select>
                    </label>
                    <p className="text-xs text-muted-foreground">
                        Choose your preferred time in Asia/Manila. The agent
                        will confirm availability.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                            Preferred date
                            <input
                                type="date"
                                aria-describedby={
                                    viewingForm.errors.scheduled_at
                                        ? 'viewing-scheduled-error'
                                        : undefined
                                }
                                value={viewingForm.data.preferred_date}
                                onChange={(event) =>
                                    viewingForm.setData(
                                        'preferred_date',
                                        event.target.value,
                                    )
                                }
                                className="h-11 rounded-sm border border-input px-3 text-sm font-normal text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            />
                        </label>
                        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                            Preferred time
                            <input
                                type="time"
                                aria-describedby={
                                    viewingForm.errors.scheduled_at
                                        ? 'viewing-scheduled-error'
                                        : undefined
                                }
                                value={viewingForm.data.preferred_time}
                                onChange={(event) =>
                                    viewingForm.setData(
                                        'preferred_time',
                                        event.target.value,
                                    )
                                }
                                className="h-11 rounded-sm border border-input px-3 text-sm font-normal text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            />
                        </label>
                    </div>
                    {selectedViewingLabel && (
                        <div className="rounded-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
                            Requested for{' '}
                            <span className="font-semibold text-foreground">
                                {selectedViewingLabel}
                            </span>
                        </div>
                    )}
                    {viewingForm.errors.scheduled_at && (
                        <div
                            id="viewing-scheduled-error"
                            role="alert"
                            className="text-xs text-destructive"
                        >
                            {viewingForm.errors.scheduled_at}
                        </div>
                    )}
                    <Button
                        className="h-11 w-full rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={viewingForm.processing}
                    >
                        <CalendarClock className="size-4" />
                        Request a Viewing
                    </Button>
                </form>
            )}
            <div className="my-5 flex items-center gap-3 text-[0.68rem] font-bold tracking-wide text-muted-foreground uppercase">
                <span className="h-px flex-1 bg-muted" />
                Or Inquire Below
                <span className="h-px flex-1 bg-muted" />
            </div>
            <form className="grid gap-3" onSubmit={submitInquiry}>
                <select
                    aria-label="Inquiry intent"
                    aria-describedby={
                        inquiryForm.errors.budget
                            ? 'inquiry-budget-error'
                            : undefined
                    }
                    value={inquiryForm.data.intent}
                    onChange={(event) =>
                        inquiryForm.setData('intent', event.target.value)
                    }
                    className="h-11 rounded-sm border border-input px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                    <option value="buy">Buy</option>
                    <option value="rent">Rent</option>
                </select>
                <Field
                    placeholder="Budget (Optional)"
                    type="number"
                    value={inquiryForm.data.budget}
                    onChange={(value) => inquiryForm.setData('budget', value)}
                />
                {inquiryForm.errors.budget && (
                    <div
                        id="inquiry-budget-error"
                        role="alert"
                        className="text-xs text-destructive"
                    >
                        {inquiryForm.errors.budget}
                    </div>
                )}
                <textarea
                    aria-label="Message"
                    aria-describedby={
                        inquiryForm.errors.message
                            ? 'inquiry-message-error'
                            : undefined
                    }
                    className="min-h-28 rounded-sm border border-input px-3 py-2 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    placeholder="Message"
                    value={inquiryForm.data.message}
                    onChange={(event) =>
                        inquiryForm.setData('message', event.target.value)
                    }
                />
                {inquiryForm.errors.message && (
                    <div
                        id="inquiry-message-error"
                        role="alert"
                        className="text-xs text-destructive"
                    >
                        {inquiryForm.errors.message}
                    </div>
                )}
                <Button
                    className="h-11 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={inquiryForm.processing}
                >
                    <Mail className="size-4" />
                    Send Message
                </Button>
                {inquiryForm.wasSuccessful && (
                    <p
                        role="status"
                        className="text-sm text-status-success-foreground"
                    >
                        Inquiry sent to the listing agent.
                    </p>
                )}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Phone className="size-3.5" />
                    Contact details are shared after the agent responds.
                </div>
            </form>
        </aside>
    );
}

function Field({
    placeholder,
    type = 'text',
    value,
    onChange,
}: {
    placeholder: string;
    type?: string;
    value?: string;
    onChange?: (value: string) => void;
}) {
    return (
        <input
            type={type}
            aria-label={placeholder}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            className="h-11 rounded-sm border border-input px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            placeholder={placeholder}
        />
    );
}

function GallerySlot({
    media,
}: {
    media?: { id: string; url: string; type: string };
}) {
    if (!media) {
        return (
            <div className="flex h-56 w-full items-center justify-center rounded-md bg-muted text-sm text-muted-foreground lg:h-64">
                No additional image
            </div>
        );
    }

    return (
        <img
            src={media.url}
            alt="Property media"
            className="h-56 w-full rounded-md object-cover lg:h-64"
        />
    );
}

function HeroMetric({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 rounded-sm bg-card/15 px-3 py-2 backdrop-blur">
            <span className="[&_svg]:size-4">{icon}</span>
            {label}
        </div>
    );
}

function IconAction({
    children,
    label,
    onClick,
}: {
    children: ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="flex size-10 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm hover:bg-card"
        >
            {children}
        </button>
    );
}
