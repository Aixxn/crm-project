import { Head, Link, usePage } from '@inertiajs/react';
import {
    Bath,
    BedDouble,
    Bell,
    Building2,
    CalendarClock,
    Car,
    Dumbbell,
    Film,
    Heart,
    Home,
    Mail,
    Map,
    Phone,
    Ruler,
    Search,
    Share2,
    Sparkles,
    Waves,
    Wine,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import { PublicUserMenu } from './_components/public-user-menu';

const heroImage =
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80';
const loungeImage =
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80';
const kitchenImage =
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80';
const brokerImage =
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&q=80';

const amenities = [
    { label: 'Infinity Pool', icon: <Waves /> },
    { label: '6-Car Garage', icon: <Car /> },
    { label: 'Wine Cellar', icon: <Wine /> },
    { label: 'Smart Home', icon: <Home /> },
    { label: 'Home Gym', icon: <Dumbbell /> },
    { label: 'Theater Room', icon: <Film /> },
];

const neighborhoodStats = [
    ['Walk Score', '85'],
    ['Transit Score', '42'],
    ['Schools', '10/10'],
    ['Crime Rate', 'Low'],
];

export default function Property() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="1420 Modernist Way" />
            <main className="min-h-screen bg-[#F5F4FA] text-[#151826]">
                <PropertyHeader user={auth.user} />

                <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
                        <div className="relative min-h-[33rem] overflow-hidden rounded-md bg-neutral-900 text-white">
                            <img
                                src={heroImage}
                                alt="Modern Beverly Hills residence exterior"
                                className="absolute inset-0 size-full object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-black/10" />
                            <div className="absolute left-5 top-5 rounded-sm bg-blue-700 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                                Featured
                            </div>
                            <div className="absolute bottom-6 left-5 right-5">
                                <div className="mb-3 text-sm font-semibold">Active Listing</div>
                                <div className="text-4xl font-semibold tracking-tight md:text-5xl">$8,450,000</div>
                                <p className="mt-3 max-w-2xl text-sm text-white/85">
                                    1420 Modernist Way, Beverly Hills, CA 90210
                                </p>
                                <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium text-white/90">
                                    <HeroMetric icon={<BedDouble />} label="5 Beds" />
                                    <HeroMetric icon={<Bath />} label="6.5 Baths" />
                                    <HeroMetric icon={<Ruler />} label="8,200 Sq Ft" />
                                    <HeroMetric icon={<Sparkles />} label="0.75 Acres" />
                                </div>
                            </div>
                            <div className="absolute bottom-6 right-5 hidden gap-3 md:flex">
                                <IconAction label="Share">
                                    <Share2 className="size-4" />
                                </IconAction>
                                {auth.user && (
                                    <IconAction label="Save">
                                        <Heart className="size-4" />
                                    </IconAction>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <img
                                src={loungeImage}
                                alt="Open living room"
                                className="h-56 w-full rounded-md object-cover lg:h-64"
                            />
                            <img
                                src={kitchenImage}
                                alt="Designer kitchen"
                                className="h-56 w-full rounded-md object-cover lg:h-64"
                            />
                            <ContactCard />
                        </div>
                    </div>

                    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
                        <div className="space-y-8">
                            <section className="rounded-md bg-white p-6 shadow-sm">
                                <h1 className="text-2xl font-semibold">Property Overview</h1>
                                <p className="mt-4 text-sm leading-7 text-[#626778]">
                                    This architectural masterpiece sits behind private gates in one of Beverly Hills'
                                    most coveted enclaves. Walls of glass open the main living areas to sweeping
                                    terraces, a resort-style pool, and mature landscaping designed for privacy. The
                                    residence combines gallery-scale entertaining rooms with quiet bedroom suites,
                                    wellness amenities, and fully integrated smart home systems.
                                </p>
                                <button className="mt-5 text-xs font-bold uppercase tracking-wide text-blue-700">
                                    Read Full Description
                                </button>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold">Key Amenities</h2>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {amenities.map((amenity) => (
                                        <Amenity key={amenity.label} icon={amenity.icon} label={amenity.label} />
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-md bg-white p-6 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <h2 className="text-xl font-semibold">Neighborhood Insights</h2>
                                    <Button variant="outline" className="rounded-sm">
                                        <Map className="size-4" />
                                        Interactive Map
                                    </Button>
                                </div>
                                <MapPreview />
                                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                                    {neighborhoodStats.map(([label, value]) => (
                                        <div key={label} className="rounded-md border border-[#E0E3EE] p-4 text-center">
                                            <div className="text-2xl font-semibold text-blue-700">{value}</div>
                                            <div className="mt-1 text-xs font-bold uppercase tracking-wide text-[#6D7282]">
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

                <footer className="border-t border-[#D8DCE8] bg-white">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[#626778] md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 font-semibold text-blue-700">
                            <Building2 className="size-5" />
                            EstatePro
                        </div>
                        <div>Copyright 2026 EstatePro. All rights reserved.</div>
                        <div className="flex flex-wrap gap-5">
                            {['Terms', 'Privacy', 'Contact Us', 'Our Agents', 'Careers'].map((item) => (
                                <Link key={item} href="#" className="hover:text-blue-700">
                                    {item}
                                </Link>
                            ))}
                        </div>
                    </div>
                </footer>
            </main>
        </>
    );
}

function PropertyHeader({ user }: { user?: User }) {
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
                    <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-semibold text-blue-700">
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

                <nav className="hidden h-16 items-center gap-9 text-xs font-bold uppercase tracking-wide text-[#6E7284] md:flex">
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
                            className="inline-flex h-10 items-center justify-center rounded-sm bg-blue-700 px-6 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-800"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

function ContactCard() {
    return (
        <aside className="rounded-md bg-white p-5 shadow-[0_18px_45px_rgba(25,32,56,0.16)] lg:-mt-20 lg:mx-5 lg:relative">
            <div className="flex items-center gap-3">
                <img src={brokerImage} alt="Jonathan Sterling" className="size-14 rounded-full object-cover" />
                <div>
                    <div className="font-semibold">Jonathan Sterling</div>
                    <div className="text-xs text-[#697083]">Senior Broker</div>
                    <div className="text-xs text-[#697083]">EstatePro</div>
                </div>
            </div>
            <Button className="mt-5 h-11 w-full rounded-sm bg-blue-700 text-white hover:bg-blue-800">
                <CalendarClock className="size-4" />
                Schedule a Viewing
            </Button>
            <div className="my-5 flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-wide text-[#8A8F9F]">
                <span className="h-px flex-1 bg-[#E0E3EE]" />
                Or Inquire Below
                <span className="h-px flex-1 bg-[#E0E3EE]" />
            </div>
            <form className="grid gap-3">
                <Field placeholder="Full Name" />
                <Field placeholder="Email Address" type="email" />
                <Field placeholder="Phone Number (Optional)" type="tel" />
                <textarea
                    className="min-h-28 rounded-sm border border-[#D8DCE8] px-3 py-2 text-sm outline-none focus:border-blue-700"
                    placeholder="Message"
                    defaultValue="I would like more information about 1420 Modernist Way."
                />
                <Button className="h-11 rounded-sm bg-[#151826] text-white hover:bg-[#262A3A]">
                    <Mail className="size-4" />
                    Send Message
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-[#697083]">
                    <Phone className="size-3.5" />
                    (310) 555-0184
                </div>
            </form>
        </aside>
    );
}

function Field({ placeholder, type = 'text' }: { placeholder: string; type?: string }) {
    return (
        <input
            type={type}
            className="h-11 rounded-sm border border-[#D8DCE8] px-3 text-sm outline-none focus:border-blue-700"
            placeholder={placeholder}
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

function Amenity({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <div className="flex min-h-24 flex-col justify-between rounded-md bg-white p-4 shadow-sm">
            <span className="text-blue-700 [&_svg]:size-5">{icon}</span>
            <span className="text-sm font-semibold">{label}</span>
        </div>
    );
}

function MapPreview() {
    return (
        <div className="relative mt-5 h-72 overflow-hidden rounded-md bg-[#E8E9ED]">
            <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_0_46%,rgba(255,255,255,0.82)_46%_50%,transparent_50%),linear-gradient(116deg,transparent_0_42%,rgba(255,255,255,0.7)_42%_46%,transparent_46%),repeating-linear-gradient(0deg,rgba(30,35,48,0.05)_0_1px,transparent_1px_42px),repeating-linear-gradient(90deg,rgba(30,35,48,0.05)_0_1px,transparent_1px_46px)]" />
            <div className="absolute left-[18%] top-0 h-full w-8 rotate-12 bg-white/80" />
            <div className="absolute left-0 top-[42%] h-7 w-full -rotate-6 bg-white/80" />
            <div className="absolute bottom-[18%] right-0 h-6 w-[68%] rotate-6 bg-white/70" />
            <div className="absolute left-[48%] top-[44%] flex size-12 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg">
                <Building2 className="size-5" />
            </div>
            <div className="absolute bottom-4 left-4 rounded-sm bg-white/90 px-3 py-2 text-xs font-semibold text-[#4F5365] shadow-sm">
                Beverly Hills Gateway
            </div>
        </div>
    );
}

function IconAction({ children, label }: { children: ReactNode; label: string }) {
    return (
        <button
            type="button"
            aria-label={label}
            className="flex size-10 items-center justify-center rounded-full bg-white/90 text-[#151826] shadow-sm hover:bg-white"
        >
            {children}
        </button>
    );
}
