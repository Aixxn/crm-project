import { Head, Link } from '@inertiajs/react';
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
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from './_components/public-header';

const properties = [
    {
        image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=900&q=85',
        price: '₱ 2,450,000',
        address: '1428 Elm Street, Westside District, CA 90210',
        meta: ['4 Beds', '3.5 Baths', '3,200 SqFt'],
        status: 'Active',
        flag: 'New Listing',
    },
    {
        image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85',
        price: '₱ 1,895,000',
        address: '880 Skyline Blvd, Hilltop Heights, CA 90212',
        meta: ['3 Beds', '2 Baths', '2,450 SqFt'],
        status: 'Active',
    },
    {
        image: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=900&q=85',
        price: '₱ 3,100,000',
        address: '400 Penthouse Way, Downtown Core, CA 90001',
        meta: ['2 Beds', '2.5 Baths', '1,800 SqFt'],
        status: 'Under Offer',
    },
];

const chips = [
    { label: 'Top Estate', icon: House },
    { label: 'Near Parks', icon: Trees },
    { label: 'Waterfront', icon: Waves },
    { label: 'Transit Hubs', icon: Landmark },
];

export default function Browse() {
    return (
        <>
            <Head title="Browse Properties" />
            <main className="min-h-screen bg-[#F7F6FE] text-[#202230]">
                <PublicHeader active="Browse" />
                <section className="mx-auto max-w-7xl px-5 py-11">
                    <h1 className="text-5xl font-semibold tracking-tight">
                        Discover properties
                    </h1>

                    <div className="mt-8 grid max-w-[56rem] gap-3 rounded-md border border-[#C9CEDF] bg-white p-3 md:grid-cols-[1fr_auto]">
                        <label className="flex h-12 items-center gap-4 px-2 text-[#6E7284]">
                            <Search className="size-5" />
                            <input
                                className="h-full w-full bg-transparent text-base outline-none placeholder:text-[#808497]"
                                placeholder="Search by neighborhood, ZIP, or address..."
                            />
                        </label>
                        <Button className="h-12 px-8 font-semibold">
                            <SlidersHorizontal />
                            Filters
                        </Button>
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
                            Showing 124 results in your area
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

                    <div className="mt-8 grid gap-6 md:grid-cols-3">
                        {properties.map((property) => (
                            <PropertyCard key={property.address} {...property} />
                        ))}
                    </div>

                    <div className="mt-12 flex justify-center">
                        <Button variant="outline" className="h-12 px-10">
                            Load More Properties
                        </Button>
                    </div>
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
                        <FooterGroup title="Platform" links={['Our Agents', 'Careers']} />
                        <FooterGroup title="Support" links={['Contact Us', 'Terms', 'Privacy']} />
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
    image,
    price,
    address,
    meta,
    status,
    flag,
}: {
    image: string;
    price: string;
    address: string;
    meta: string[];
    status: string;
    flag?: string;
}) {
    return (
        <Link
            href="/properties/featured"
            className="overflow-hidden rounded-md border border-[#C9CEDF] bg-white"
        >
            <div className="relative aspect-[16/10]">
                <img src={image} alt="" className="size-full object-cover" />
                {flag && (
                    <span className="absolute left-4 top-4 bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white">
                        {flag}
                    </span>
                )}
                <button className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/90 text-[#525769] shadow-sm">
                    <Heart className="size-5" />
                </button>
            </div>
            <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-semibold">{price}</div>
                    <span
                        className={
                            status === 'Under Offer'
                                ? 'rounded-sm border border-[#C9CEDF] bg-[#EEF0F6] px-3 py-1.5 text-xs font-medium text-[#525769]'
                                : 'rounded-sm border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700'
                        }
                    >
                        {status}
                    </span>
                </div>
                <div className="mt-4 text-sm text-[#6E7284]">{address}</div>
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
