import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Bookmark,
    CalendarDays,
    Clock3,
    Heart,
    History,
    Lightbulb,
    MapPin,
    Search,
} from 'lucide-react';
import { PublicHeader } from './_components/public-header';

const appointmentImage =
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=85';

const savedProperties = [
    {
        title: '888 Skyline Blvd, PH2',
        price: '$3,450,000',
        image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=700&q=85',
        badge: 'favorite',
    },
    {
        title: '12 Maple Leaf Way',
        price: '$1,200,000',
        image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=85',
        badge: 'new',
    },
    {
        title: '4500 Ridge Road',
        price: '$5,100,000',
        image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=85',
    },
    {
        title: '210 Forest Hill Ave',
        price: '$2,850,000',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=85',
    },
];

const recentSearches = [
    'Downtown Condos',
    'Waterfront < $2M',
    '3+ Beds, Pool',
    'New Construction',
];

export default function MyHome() {
    return (
        <>
            <Head title="My Home" />
            <main className="min-h-screen bg-[#F7F5FC] text-[#202230]">
                <PublicHeader active="Saved" />

                <section className="mx-auto max-w-7xl px-5 py-10">
                    <div className="flex flex-wrap items-end justify-between gap-5">
                        <div>
                            <h1 className="text-5xl font-semibold tracking-tight">My Home</h1>
                            <p className="mt-4 text-base text-[#5F6373]">
                                Welcome back, Alexander. Here is your personalized dashboard.
                            </p>
                        </div>
                        <Link
                            href="/browse"
                            className="inline-flex h-11 items-center justify-center gap-3 rounded-sm bg-blue-700 px-7 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                            <Search className="size-5" />
                            Resume Searching
                        </Link>
                    </div>

                    <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(21rem,1fr)]">
                        <section className="rounded-md border border-[#C9CDDA] bg-white p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <CalendarDays className="size-5 text-blue-700" />
                                    <h2 className="text-xl font-semibold">Next Appointment</h2>
                                </div>
                                <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-800">
                                    Confirmed
                                </span>
                            </div>

                            <div className="mt-6 grid gap-6 md:grid-cols-[16rem_1fr]">
                                <img
                                    src={appointmentImage}
                                    alt="Modern home exterior"
                                    className="h-48 w-full rounded-sm object-cover"
                                />
                                <div className="flex min-w-0 flex-col">
                                    <div>
                                        <h3 className="text-2xl font-semibold">1420 Ocean Avenue, Apt 4B</h3>
                                        <div className="mt-2 flex items-center gap-2 text-sm text-[#5F6373]">
                                            <MapPin className="size-4" />
                                            Santa Monica, CA
                                        </div>
                                    </div>

                                    <div className="mt-auto border-t border-[#D4D8E4] pt-5">
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <DashboardMeta label="Date & Time" value="Tomorrow, 10:00 AM" />
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wide text-[#6E7284]">
                                                    Agent
                                                </div>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <img
                                                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80"
                                                        alt="Sarah Jenkins"
                                                        className="size-7 rounded-full object-cover"
                                                    />
                                                    <span className="font-semibold">Sarah Jenkins</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-md border border-[#C9CDDA] bg-white p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <History className="size-5 text-[#5F6373]" />
                                    <h2 className="text-xl font-semibold">Recent Searches</h2>
                                </div>
                                <button className="text-xs font-semibold text-blue-700">Clear</button>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                {recentSearches.map((search) => (
                                    <span
                                        key={search}
                                        className="inline-flex items-center gap-2 rounded-md bg-[#F0EFF8] px-4 py-3 text-sm text-[#4E5364]"
                                    >
                                        <Search className="size-4" />
                                        {search}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-6 border-t border-[#D4D8E4] pt-4">
                                <div className="flex gap-4 rounded-sm bg-[#F0F1FA] p-5">
                                    <Lightbulb className="mt-1 size-5 shrink-0 text-blue-700" />
                                    <div>
                                        <div className="font-semibold">Market Alert</div>
                                        <p className="mt-1 text-sm leading-6 text-[#4E5364]">
                                            2 new properties matching "Downtown Condos" were listed today.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <section className="mt-4 rounded-md border border-[#C9CDDA] bg-white p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Bookmark className="size-5 fill-[#C83F09] text-[#C83F09]" />
                                <h2 className="text-xl font-semibold">Saved Properties</h2>
                            </div>
                            <Link
                                href="/browse"
                                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
                            >
                                View All (12)
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>

                        <div className="mt-5 border-t border-[#D4D8E4] pt-6">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {savedProperties.map((property) => (
                                    <Link key={property.title} href="/properties/featured" className="group">
                                        <div className="relative overflow-hidden rounded-sm border border-[#D4D8E4] bg-[#F7F8FC]">
                                            <img
                                                src={property.image}
                                                alt={property.title}
                                                className="aspect-[16/9] w-full object-cover transition group-hover:scale-105"
                                            />
                                            {property.badge === 'favorite' && (
                                                <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-blue-700 text-white">
                                                    <Heart className="size-4 fill-white" />
                                                </span>
                                            )}
                                            {property.badge === 'new' && (
                                                <span className="absolute left-3 top-3 bg-blue-700 px-3 py-1 text-xs font-bold uppercase text-white">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-3 text-sm font-semibold">{property.title}</div>
                                        <div className="mt-1 text-sm text-[#5F6373]">{property.price}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                </section>

                <footer className="border-t border-[#D8DCE8] bg-white">
                    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 text-sm text-[#5F6373] md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                        <div>
                            <div className="text-2xl font-semibold text-blue-700">EstatePro</div>
                            <p className="mt-6">Copyright 2026 EstatePro. All rights reserved.</p>
                        </div>
                        <FooterLinks links={['Terms', 'Privacy']} />
                        <FooterLinks links={['Contact Us', 'Our Agents']} />
                        <FooterLinks links={['Careers']} />
                    </div>
                </footer>
            </main>
        </>
    );
}

function DashboardMeta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs font-bold uppercase tracking-wide text-[#6E7284]">{label}</div>
            <div className="mt-2 flex items-center gap-2 font-semibold">
                <Clock3 className="size-4 text-[#6E7284]" />
                {value}
            </div>
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
