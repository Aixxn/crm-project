import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    BedDouble,
    Building2,
    DraftingCompass,
    Handshake,
    Mail,
    MapPin,
    Megaphone,
    Phone,
    Ruler,
    Share2,
    Warehouse,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from './public/_components/public-header';

const heroImage =
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85';
const poolImage =
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85';
const homeImage =
    'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=900&q=85';

export default function Welcome() {
    return (
        <>
            <Head title="EstatePro" />
            <main className="min-h-screen bg-[#F4F5FB] text-[#202230]">
                <PublicHeader active="Sell" sticky />

                <section className="relative min-h-[31rem] overflow-hidden bg-neutral-950">
                    <img
                        src={heroImage}
                        alt=""
                        className="absolute inset-0 size-full object-cover opacity-54"
                    />
                    <div className="absolute inset-0 bg-[#101826]/58" />
                    <div className="relative z-10 mx-auto flex min-h-[31rem] max-w-5xl flex-col items-center justify-center px-5 py-16 text-center text-white">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100">
                            Data-driven brokerage
                        </p>
                        <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
                            Discover the true market value of your property.
                        </h1>
                        <p className="mt-6 max-w-3xl text-base leading-7 text-white/72">
                            Leverage our institutional-grade pricing algorithm and
                            hyper-local market intelligence to position your asset
                            for maximum return.
                        </p>
                        <div className="mt-9 grid w-full max-w-3xl gap-3 rounded-md bg-white p-3 shadow-xl md:grid-cols-[1fr_auto]">
                            <label className="flex items-center gap-3 px-3 text-[#808497]">
                                <MapPin className="size-5" />
                                <input
                                    className="h-11 w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-[#9AA0B2]"
                                    placeholder="Enter your property address"
                                />
                            </label>
                            <Button className="h-11 px-8 text-xs font-bold uppercase tracking-wide">
                                Get estimate
                                <ArrowRight />
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="border-b border-[#D8DCE8] bg-[#F8F7FF] px-5 py-20">
                    <div className="mx-auto max-w-7xl">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-semibold">
                                A Precision Approach to Selling
                            </h2>
                            <p className="mt-5 text-sm leading-6 text-[#6E7284]">
                                We engineer the sales process to minimize days on
                                market while maximizing final yield. Every step is
                                executed with exacting standards.
                            </p>
                        </div>
                        <div className="mt-14 grid gap-10 md:grid-cols-4">
                            {processSteps.map((step) => (
                                <div
                                    key={step.title}
                                    className="text-center text-[#202230]"
                                >
                                    <div className="mx-auto flex size-16 items-center justify-center rounded-md border border-[#D8DCE8] bg-[#EEF2FF] text-blue-700 shadow-sm">
                                        <step.icon className="size-6" />
                                    </div>
                                    <h3 className="mt-7 text-lg font-semibold">
                                        {step.title}
                                    </h3>
                                    <p className="mt-4 text-sm leading-6 text-[#6E7284]">
                                        {step.copy}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-b border-[#D8DCE8] bg-[#EEF1FA] px-5 py-20">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-semibold">
                                    Recent Market Successes
                                </h2>
                                <p className="mt-4 text-sm text-[#6E7284]">
                                    A selection of recently transacted assets managed
                                    by EstatePro.
                                </p>
                            </div>
                            <Button asChild variant="outline" className="px-8">
                                <Link href="/browse">View full portfolio</Link>
                            </Button>
                        </div>

                        <div className="mt-10 grid gap-6 lg:grid-cols-[1.45fr_0.8fr]">
                            <Link
                                href="/properties/featured"
                                className="grid overflow-hidden rounded-md border border-[#CDD3E4] bg-white md:grid-cols-[1.05fr_1fr]"
                            >
                                <div className="relative min-h-80">
                                    <img
                                        src={poolImage}
                                        alt=""
                                        className="absolute inset-0 size-full object-cover"
                                    />
                                    <span className="absolute left-5 top-5 bg-[#111722] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
                                        Closed - 14 days
                                    </span>
                                </div>
                                <div className="flex min-h-80 flex-col p-7">
                                    <div className="text-3xl font-semibold">
                                        $4,250,000
                                    </div>
                                    <div className="mt-3 text-sm text-[#6E7284]">
                                        1420 Modernist Drive, Beverly Hills
                                    </div>
                                    <div className="mt-8 flex flex-wrap gap-8 border-y border-[#D8DCE8] py-5 text-sm text-[#525769]">
                                        <Metric icon={<BedDouble />} label="5 Beds" />
                                        <Metric icon={<Warehouse />} label="6 Baths" />
                                        <Metric icon={<Ruler />} label="6,200 SqFt" />
                                    </div>
                                    <div className="mt-auto flex items-center justify-between text-sm">
                                        <span className="font-semibold text-blue-700">
                                            102% of Asking Price
                                        </span>
                                        <span className="text-[#6E7284]">
                                            Represented Seller
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            <Link
                                href="/properties/featured"
                                className="overflow-hidden rounded-md border border-[#CDD3E4] bg-white"
                            >
                                <div className="relative aspect-[16/9]">
                                    <img
                                        src={homeImage}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                    <span className="absolute left-5 top-5 bg-[#111722] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
                                        Closed
                                    </span>
                                </div>
                                <div className="p-7">
                                    <div className="text-2xl font-semibold">
                                        $1,850,000
                                    </div>
                                    <div className="mt-3 text-sm text-[#6E7284]">
                                        88 Valley Ridge, Calabasas
                                    </div>
                                    <div className="mt-16 flex gap-5 text-sm text-[#525769]">
                                        <Metric icon={<BedDouble />} label="4" />
                                        <Metric icon={<Warehouse />} label="3.5" />
                                        <Metric icon={<Ruler />} label="3,800" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="bg-[#F8F7FF] px-5 py-24">
                    <div className="mx-auto grid max-w-7xl overflow-hidden rounded-lg border border-[#CDD3E4] bg-white lg:grid-cols-[0.72fr_1fr]">
                        <aside className="bg-[#171B26] p-10 text-white md:p-12">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">
                                Private consultation
                            </p>
                            <h2 className="mt-7 text-3xl font-semibold">
                                Ready to list your asset?
                            </h2>
                            <p className="mt-8 max-w-sm text-sm leading-7 text-white/68">
                                Connect with one of our senior brokerage partners
                                for a confidential, no-obligation valuation and
                                strategic market assessment.
                            </p>
                            <div className="mt-10 space-y-7">
                                <ContactLine
                                    icon={<Phone />}
                                    label="Direct line"
                                    value="+1 (800) 555-0199"
                                />
                                <ContactLine
                                    icon={<Mail />}
                                    label="Email"
                                    value="partners@estatepro.com"
                                />
                            </div>
                        </aside>
                        <form className="grid gap-6 p-8 md:grid-cols-2 md:p-12">
                            <Field label="First name" placeholder="John" />
                            <Field label="Last name" placeholder="Doe" />
                            <Field
                                label="Property address"
                                placeholder="123 Main St, City, State"
                                wide
                            />
                            <Field
                                label="Email address"
                                placeholder="john@example.com"
                            />
                            <Field label="Phone number" placeholder="(555) 000-0000" />
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold uppercase tracking-wide text-[#525769]">
                                    Additional details
                                </label>
                                <textarea
                                    className="mt-2 min-h-28 w-full rounded-sm border border-[#CDD3E4] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#9AA0B2] focus:border-blue-500"
                                    placeholder="Briefly describe your timeline and goals..."
                                />
                            </div>
                            <Button className="h-12 text-xs font-bold uppercase tracking-wide md:col-span-2">
                                Request assessment
                            </Button>
                        </form>
                    </div>
                </section>

                <footer className="border-t border-[#D8DCE8] bg-white">
                    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                        <div>
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-xl font-semibold text-blue-700"
                            >
                                <Building2 className="size-6" />
                                EstatePro
                            </Link>
                            <p className="mt-6 max-w-xs text-sm leading-6 text-[#525769]">
                                Institutional-grade real estate brokerage delivering
                                precision execution for high-value assets.
                            </p>
                        </div>
                        <FooterGroup title="Company" links={['Our Agents', 'Careers', 'Contact Us']} />
                        <FooterGroup title="Legal" links={['Terms', 'Privacy']} />
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wide text-[#525769]">
                                Connect
                            </h3>
                            <div className="mt-6 flex gap-5 text-[#525769]">
                                <Building2 className="size-5" />
                                <Share2 className="size-5" />
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-[#E5E8F1] px-5 py-6 text-sm text-[#6E7284]">
                        <div className="mx-auto max-w-7xl">
                            © 2024 EstatePro Brokerage. All rights reserved.
                        </div>
                    </div>
                </footer>
            </main>
        </>
    );
}

const processSteps = [
    {
        title: '1. Evaluation',
        copy: 'Comprehensive asset valuation using predictive analytics and comparative market benchmarking.',
        icon: BarChart3,
    },
    {
        title: '2. Preparation',
        copy: 'Strategic staging, high-end architectural photography, and targeted deferred maintenance remediation.',
        icon: DraftingCompass,
    },
    {
        title: '3. Listing',
        copy: 'Omnichannel marketing deployment targeting high-net-worth buyer syndicates globally.',
        icon: Megaphone,
    },
    {
        title: '4. Closing',
        copy: 'Aggressive contract negotiation and frictionless transaction management through to escrow.',
        icon: Handshake,
    },
];

function Metric({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <span className="inline-flex items-center gap-2">
            <span className="text-[#808497] [&_svg]:size-4">{icon}</span>
            {label}
        </span>
    );
}

function ContactLine({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-5">
            <span className="flex size-11 items-center justify-center rounded-md bg-blue-700/22 text-blue-200 [&_svg]:size-5">
                {icon}
            </span>
            <div>
                <div className="text-xs font-bold uppercase tracking-wide text-white/48">
                    {label}
                </div>
                <div className="mt-1 text-lg font-semibold">{value}</div>
            </div>
        </div>
    );
}

function Field({
    label,
    placeholder,
    wide = false,
}: {
    label: string;
    placeholder: string;
    wide?: boolean;
}) {
    return (
        <div className={wide ? 'md:col-span-2' : ''}>
            <label className="text-xs font-bold uppercase tracking-wide text-[#525769]">
                {label}
            </label>
            <input
                className="mt-2 h-12 w-full rounded-sm border border-[#CDD3E4] bg-white px-4 text-sm outline-none placeholder:text-[#9AA0B2] focus:border-blue-500"
                placeholder={placeholder}
            />
        </div>
    );
}

function FooterGroup({ title, links }: { title: string; links: string[] }) {
    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#525769]">
                {title}
            </h3>
            <div className="mt-6 grid gap-4 text-sm text-[#6E7284]">
                {links.map((link) => (
                    <span key={link}>{link}</span>
                ))}
            </div>
        </div>
    );
}
