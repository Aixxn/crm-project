import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Bath,
    BedDouble,
    Bell,
    Building2,
    CalendarClock,
    Heart,
    Mail,
    Phone,
    Ruler,
    Search,
    Share2,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import { PublicUserMenu } from './_components/public-user-menu';

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
            <>
                <Head title="Listing unavailable" />
                <main className="min-h-screen bg-[#F5F4FA] text-[#151826]">
                    <PropertyHeader user={auth.user} />
                    <section className="mx-auto max-w-3xl px-5 py-20 text-center">
                        <div className="rounded-md border border-dashed border-[#C9CEDF] bg-white p-10">
                            <h1 className="text-3xl font-semibold">
                                Listing unavailable
                            </h1>
                            <p className="mt-3 text-sm leading-6 text-[#626778]">
                                This property is no longer available or is not
                                visible in the buyer portal.
                            </p>
                            <Link
                                href="/browse"
                                className="mt-6 inline-flex h-11 items-center justify-center rounded-sm bg-blue-700 px-6 text-sm font-semibold text-white hover:bg-blue-800"
                            >
                                Browse available listings
                            </Link>
                        </div>
                    </section>
                </main>
            </>
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
        <>
            <Head title={listing.address} />
            <main className="min-h-screen bg-[#F5F4FA] text-[#151826]">
                <PropertyHeader user={auth.user} />

                <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
                        <div className="relative min-h-[33rem] overflow-hidden rounded-md bg-neutral-900 text-white">
                            {gallery[0] ? (
                                <img
                                    src={gallery[0].url}
                                    alt={listing.address}
                                    className="absolute inset-0 size-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#E8E9ED] text-sm text-[#626778]">
                                    No image available
                                </div>
                            )}
                            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-black/10" />
                            <div className="absolute top-5 left-5 rounded-sm bg-blue-700 px-3 py-1 text-xs font-bold tracking-wide uppercase">
                                {listing.status}
                            </div>
                            <div className="absolute right-5 bottom-6 left-5">
                                <div className="mb-3 text-sm font-semibold">
                                    {listing.status} Listing
                                </div>
                                <div className="text-4xl font-semibold tracking-tight md:text-5xl">
                                    {listing.formattedPrice}
                                </div>
                                <p className="mt-3 max-w-2xl text-sm text-white/85">
                                    {listing.address}
                                </p>
                                <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium text-white/90">
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
                            <div className="absolute right-5 bottom-6 hidden gap-3 md:flex">
                                <IconAction label="Share">
                                    <Share2 className="size-4" />
                                </IconAction>
                                <IconAction
                                    label={
                                        isSaved
                                            ? 'Remove saved listing'
                                            : 'Save'
                                    }
                                    onClick={toggleSaved}
                                >
                                    <Heart
                                        className={
                                            isSaved
                                                ? 'size-4 fill-blue-700 text-blue-700'
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
                            <section className="rounded-md bg-white p-6 shadow-sm">
                                <h1 className="text-2xl font-semibold">
                                    Property Overview
                                </h1>
                                <p className="mt-4 text-sm leading-7 text-[#626778]">
                                    This {listing.propertyType ?? 'property'} is
                                    currently listed as {listing.status}. Review
                                    the available facts and contact the listing
                                    agent for disclosures, showing windows, and
                                    next steps.
                                </p>
                            </section>

                            <section className="rounded-md bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold">
                                    Listing Facts
                                </h2>
                                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                                    {[
                                        ['Type', listing.propertyType ?? 'TBD'],
                                        [
                                            'Beds',
                                            String(listing.bedrooms ?? 'TBD'),
                                        ],
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
                                            className="rounded-md border border-[#E0E3EE] p-4 text-center"
                                        >
                                            <div className="text-2xl font-semibold text-blue-700">
                                                {value}
                                            </div>
                                            <div className="mt-1 text-xs font-bold tracking-wide text-[#6D7282] uppercase">
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
            </main>
        </>
    );
}

function PropertyHeader({ user }: { user?: User | null }) {
    const navItems = [
        { title: 'Browse', href: '/browse', authOnly: false },
        { title: 'Saved', href: '/my-home', authOnly: true },
        { title: 'Sell', href: '/', authOnly: false },
        { title: 'Concierge', href: '/deal-tracker', authOnly: true },
    ] as const;

    return (
        <header className="border-b border-[#D8DCE8] bg-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-5">
                <div className="flex min-w-0 items-center gap-5">
                    <Link
                        href="/"
                        className="flex shrink-0 items-center gap-2 text-xl font-semibold text-blue-700"
                    >
                        <Building2 className="size-6" />
                        EstatePro
                    </Link>
                    <label className="hidden h-10 w-72 items-center gap-2 rounded-sm border border-[#D8DCE8] bg-[#F7F8FC] px-3 text-sm text-[#777C8C] lg:flex">
                        <Search className="size-4" />
                        <input
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#777C8C]"
                            placeholder="City, neighborhood, address"
                        />
                    </label>
                </div>

                <nav className="hidden h-16 items-center gap-9 text-xs font-bold tracking-wide text-[#6E7284] uppercase md:flex">
                    {navItems
                        .filter((item) => !item.authOnly || user)
                        .map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={
                                    item.title === 'Browse'
                                        ? 'relative flex h-16 items-center text-blue-700 after:absolute after:inset-x-0 after:bottom-3 after:h-0.5 after:bg-blue-700'
                                        : 'relative flex h-16 items-center'
                                }
                            >
                                {item.title}
                            </Link>
                        ))}
                </nav>

                <div className="flex shrink-0 items-center gap-5 text-[#4F5365]">
                    {user && (
                        <>
                            <Bell className="hidden size-5 md:block" />
                            <Heart className="hidden size-5 md:block" />
                        </>
                    )}
                    {user ? (
                        <PublicUserMenu user={user} />
                    ) : (
                        <Link
                            href="/login"
                            className="inline-flex h-10 items-center justify-center rounded-sm bg-blue-700 px-6 text-xs font-bold tracking-wide text-white uppercase hover:bg-blue-800"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
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
        scheduled_at: '',
    });

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

        viewingForm.post(requestViewingUrl, { preserveScroll: true });
    };

    return (
        <aside className="rounded-md bg-white p-5 shadow-[0_18px_45px_rgba(25,32,56,0.16)] lg:relative lg:mx-5 lg:-mt-20">
            <div className="flex items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {(listing.agent?.name ?? 'Agent').slice(0, 1)}
                </div>
                <div>
                    <div className="font-semibold">
                        {listing.agent?.name ?? 'Listing Agent'}
                    </div>
                    <div className="text-xs text-[#697083]">
                        {listing.agent?.email ?? 'EstatePro'}
                    </div>
                </div>
            </div>
            <form className="mt-5 grid gap-3" onSubmit={submitViewing}>
                <input
                    type="datetime-local"
                    value={viewingForm.data.scheduled_at}
                    onChange={(event) =>
                        viewingForm.setData('scheduled_at', event.target.value)
                    }
                    className="h-11 rounded-sm border border-[#D8DCE8] px-3 text-sm outline-none focus:border-blue-700"
                />
                {viewingForm.errors.scheduled_at && (
                    <div className="text-xs text-red-600">
                        {viewingForm.errors.scheduled_at}
                    </div>
                )}
                <Button
                    className="h-11 w-full rounded-sm bg-blue-700 text-white hover:bg-blue-800"
                    disabled={viewingForm.processing}
                >
                    <CalendarClock className="size-4" />
                    Request a Viewing
                </Button>
            </form>
            <div className="my-5 flex items-center gap-3 text-[0.68rem] font-bold tracking-wide text-[#8A8F9F] uppercase">
                <span className="h-px flex-1 bg-[#E0E3EE]" />
                Or Inquire Below
                <span className="h-px flex-1 bg-[#E0E3EE]" />
            </div>
            <form className="grid gap-3" onSubmit={submitInquiry}>
                <select
                    value={inquiryForm.data.intent}
                    onChange={(event) =>
                        inquiryForm.setData('intent', event.target.value)
                    }
                    className="h-11 rounded-sm border border-[#D8DCE8] px-3 text-sm outline-none focus:border-blue-700"
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
                    <div className="text-xs text-red-600">
                        {inquiryForm.errors.budget}
                    </div>
                )}
                <textarea
                    className="min-h-28 rounded-sm border border-[#D8DCE8] px-3 py-2 text-sm outline-none focus:border-blue-700"
                    placeholder="Message"
                    value={inquiryForm.data.message}
                    onChange={(event) =>
                        inquiryForm.setData('message', event.target.value)
                    }
                />
                {inquiryForm.errors.message && (
                    <div className="text-xs text-red-600">
                        {inquiryForm.errors.message}
                    </div>
                )}
                <Button
                    className="h-11 rounded-sm bg-[#151826] text-white hover:bg-[#262A3A]"
                    disabled={inquiryForm.processing}
                >
                    <Mail className="size-4" />
                    Send Message
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-[#697083]">
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
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            className="h-11 rounded-sm border border-[#D8DCE8] px-3 text-sm outline-none focus:border-blue-700"
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
            <div className="flex h-56 w-full items-center justify-center rounded-md bg-[#E8E9ED] text-sm text-[#626778] lg:h-64">
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
        <div className="flex items-center gap-2 rounded-sm bg-white/15 px-3 py-2 backdrop-blur">
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
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="flex size-10 items-center justify-center rounded-full bg-white/90 text-[#151826] shadow-sm hover:bg-white"
        >
            {children}
        </button>
    );
}
