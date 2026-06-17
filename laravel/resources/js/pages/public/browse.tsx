import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    BedDouble,
    Building2,
    Grid3X3,
    Heart,
    House,
    Landmark,
    Map,
    Search,
    SlidersHorizontal,
    Trees,
    Waves,
    Warehouse,
    Ruler,
} from 'lucide-react';
import type { FormEvent, MouseEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from './_components/public-header';

type PublicListingCard = {
    id: string;
    href: string;
    image?: string | null;
    formattedPrice: string;
    address: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    areaSqft?: number | null;
    status: string;
};

type BrowseProps = {
    listings?: PublicListingCard[];
    resultCount?: number;
    savedListingIds?: string[];
    filters?: {
        search?: string;
        property_type?: string;
        status?: string;
        min_price?: string;
        max_price?: string;
        bedrooms?: string;
        bathrooms?: string;
    };
    filterOptions?: {
        propertyTypes: string[];
        statuses: string[];
    };
};

const chips = [
    { label: 'Top Estate', icon: House },
    { label: 'Near Parks', icon: Trees },
    { label: 'Waterfront', icon: Waves },
    { label: 'Transit Hubs', icon: Landmark },
];

export default function Browse({
    listings = [],
    resultCount,
    savedListingIds = [],
    filters = {},
    filterOptions = { propertyTypes: [], statuses: [] },
}: BrowseProps) {
    const { auth } = usePage().props;
    const count = resultCount ?? listings.length;
    const searchForm = useForm({
        search: filters.search ?? '',
        property_type: filters.property_type ?? '',
        status: filters.status ?? '',
        min_price: filters.min_price ?? '',
        max_price: filters.max_price ?? '',
        bedrooms: filters.bedrooms ?? '',
        bathrooms: filters.bathrooms ?? '',
    });

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get('/browse', searchForm.data, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <>
            <Head title="Browse Properties" />
            <main className="min-h-screen bg-[#F7F6FE] text-[#202230]">
                <PublicHeader active="Browse" />
                <section className="mx-auto max-w-7xl px-5 py-11">
                    <h1 className="text-5xl font-semibold tracking-tight">
                        Discover properties
                    </h1>

                    <form
                        className="mt-8 grid max-w-[56rem] gap-3 rounded-md border border-[#C9CEDF] bg-white p-3 md:grid-cols-[1fr_auto]"
                        onSubmit={submitSearch}
                    >
                        <label className="flex h-12 items-center gap-4 px-2 text-[#6E7284]">
                            <Search className="size-5" />
                            <input
                                value={searchForm.data.search}
                                onChange={(event) =>
                                    searchForm.setData(
                                        'search',
                                        event.target.value,
                                    )
                                }
                                className="h-full w-full bg-transparent text-base outline-none placeholder:text-[#808497]"
                                placeholder="Search by neighborhood, ZIP, or address..."
                            />
                        </label>
                        <Button className="h-12 px-8 font-semibold">
                            <SlidersHorizontal />
                            Filters
                        </Button>
                    </form>

                    <div className="mt-3 grid max-w-[56rem] gap-3 md:grid-cols-3">
                        <select
                            value={searchForm.data.property_type}
                            onChange={(event) =>
                                searchForm.setData(
                                    'property_type',
                                    event.target.value,
                                )
                            }
                            className="h-11 rounded-sm border border-[#C9CEDF] bg-white px-3 text-sm"
                        >
                            <option value="">All property types</option>
                            {filterOptions.propertyTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                        <select
                            value={searchForm.data.status}
                            onChange={(event) =>
                                searchForm.setData('status', event.target.value)
                            }
                            className="h-11 rounded-sm border border-[#C9CEDF] bg-white px-3 text-sm"
                        >
                            <option value="">Any status</option>
                            {filterOptions.statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={searchForm.data.bedrooms}
                            onChange={(event) =>
                                searchForm.setData(
                                    'bedrooms',
                                    event.target.value,
                                )
                            }
                            className="h-11 rounded-sm border border-[#C9CEDF] bg-white px-3 text-sm"
                            placeholder="Minimum bedrooms"
                        />
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {chips.map((chip) => (
                            <button
                                key={chip.label}
                                className="inline-flex h-10 items-center gap-2 rounded-md border border-[#C9CEDF] bg-white px-4 text-sm font-medium text-[#303342]"
                            >
                                <chip.icon className="size-4" />
                                {chip.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-b border-[#D8DCE8] pb-4">
                        <p className="text-base text-[#525769]">
                            Showing {count} result{count === 1 ? '' : 's'} in
                            your area
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="text-sm text-[#6E7284]">
                                Sort by:{' '}
                                <span className="font-semibold text-[#202230]">
                                    Newest listings
                                </span>
                            </div>
                            <div className="inline-flex rounded-md border border-[#C9CEDF] bg-[#ECEFF8] p-1">
                                <button className="inline-flex h-9 items-center gap-2 rounded-sm bg-white px-4 text-sm font-semibold text-blue-700">
                                    <Grid3X3 className="size-4" />
                                    Grid
                                </button>
                                <button className="inline-flex h-9 items-center gap-2 px-4 text-sm font-medium text-[#525769]">
                                    <Map className="size-4" />
                                    Map
                                </button>
                            </div>
                        </div>
                    </div>

                    {listings.length > 0 ? (
                        <div className="mt-8 grid gap-6 md:grid-cols-3">
                            {listings.map((property) => (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                    canSave={Boolean(auth.user)}
                                    isSaved={savedListingIds.includes(
                                        property.id,
                                    )}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No matching listings"
                            body="Try adjusting your search or filters."
                        />
                    )}
                </section>

                <footer className="border-t border-[#D8DCE8] bg-white">
                    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                        <div>
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-2xl font-semibold text-blue-700"
                            >
                                <Building2 className="size-7" />
                                EstatePro
                            </Link>
                            <p className="mt-6 max-w-sm text-sm leading-6 text-[#525769]">
                                Elevating the standard of real estate brokerage
                                through intelligent design and comprehensive
                                market data.
                            </p>
                        </div>
                        <FooterGroup
                            title="Platform"
                            links={['Our Agents', 'Careers']}
                        />
                        <FooterGroup
                            title="Support"
                            links={['Contact Us', 'Terms', 'Privacy']}
                        />
                        <div className="flex items-end text-sm text-[#6E7284] md:justify-end">
                            © 2024 EstatePro Brokerage. All rights reserved.
                        </div>
                    </div>
                </footer>
            </main>
        </>
    );
}

function PropertyCard({
    property,
    canSave,
    isSaved,
}: {
    property: PublicListingCard;
    canSave: boolean;
    isSaved: boolean;
}) {
    const image =
        property.image ??
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85';
    const meta = [
        property.bedrooms ? `${property.bedrooms} Beds` : 'Beds TBD',
        property.bathrooms ? `${property.bathrooms} Baths` : 'Baths TBD',
        property.areaSqft
            ? `${property.areaSqft.toLocaleString()} SqFt`
            : 'Area TBD',
    ];

    const toggleSaved = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!canSave) {
            router.visit('/login');

            return;
        }

        if (isSaved) {
            router.delete(`/saved-listings/${property.id}`, {
                preserveScroll: true,
            });

            return;
        }

        router.post(
            '/saved-listings',
            { listing_id: property.id },
            { preserveScroll: true },
        );
    };

    return (
        <Link
            href={property.href}
            className="overflow-hidden rounded-md border border-[#C9CEDF] bg-white"
        >
            <div className="relative aspect-[16/10]">
                <img src={image} alt="" className="size-full object-cover" />
                {property.status === 'Active' && (
                    <span className="absolute top-4 left-4 bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white">
                        New Listing
                    </span>
                )}
                <button
                    type="button"
                    onClick={toggleSaved}
                    className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/90 text-[#525769] shadow-sm"
                    aria-label={
                        isSaved ? 'Remove saved listing' : 'Save listing'
                    }
                >
                    <Heart
                        className={
                            isSaved
                                ? 'size-5 fill-blue-700 text-blue-700'
                                : 'size-5'
                        }
                    />
                </button>
            </div>
            <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-semibold">
                        {property.formattedPrice}
                    </div>
                    <span
                        className={
                            property.status === 'Under Offer'
                                ? 'rounded-sm border border-[#C9CEDF] bg-[#EEF0F6] px-3 py-1.5 text-xs font-medium text-[#525769]'
                                : 'rounded-sm border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700'
                        }
                    >
                        {property.status}
                    </span>
                </div>
                <div className="mt-4 text-sm text-[#6E7284]">
                    {property.address}
                </div>
                <div className="mt-7 flex flex-wrap gap-4 border-t border-[#D8DCE8] pt-4 text-sm font-medium text-[#525769]">
                    <Meta icon={<BedDouble />} label={meta[0]} />
                    <Meta icon={<Warehouse />} label={meta[1]} />
                    <Meta icon={<Ruler />} label={meta[2]} />
                </div>
            </div>
        </Link>
    );
}

function Meta({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className="text-[#6E7284] [&_svg]:size-4">{icon}</span>
            {label}
        </span>
    );
}

function EmptyState({ title, body }: { title: string; body: string }) {
    return (
        <div className="mt-8 rounded-md border border-dashed border-[#C9CEDF] bg-white p-10 text-center">
            <div className="text-lg font-semibold">{title}</div>
            <p className="mt-2 text-sm text-[#6E7284]">{body}</p>
        </div>
    );
}

function FooterGroup({ title, links }: { title: string; links: string[] }) {
    return (
        <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <div className="mt-5 grid gap-4 text-sm text-[#6E7284]">
                {links.map((link) => (
                    <span key={link}>{link}</span>
                ))}
            </div>
        </div>
    );
}
