import { Link } from '@inertiajs/react';
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
import { PublicLayout } from './public/_components/public-layout';

const heroImage =
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85';
const poolImage =
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85';
const homeImage =
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85';

export default function Welcome() {
    return (
        <PublicLayout title="EstatePro" sticky>
            <section className="relative min-h-[31rem] overflow-hidden bg-neutral-950">
                <img
                    src={heroImage}
                    alt=""
                    className="absolute inset-0 size-full object-cover opacity-54"
                />
                <div className="absolute inset-0 bg-[#101826]/58" />
                <div className="relative z-10 mx-auto flex min-h-[31rem] max-w-5xl flex-col items-center justify-center px-5 py-16 text-center text-white">
                    <p className="text-xs font-bold tracking-[0.22em] text-blue-100 uppercase">
                        Data-driven brokerage
                    </p>
                    <h1 className="mt-6 max-w-4xl text-4xl leading-tight font-semibold md:text-6xl">
                        Discover the true market value of your property.
                    </h1>
                    <p className="mt-6 max-w-3xl text-base leading-7 text-white/80">
                        Leverage our institutional-grade pricing algorithm and
                        hyper-local market intelligence to position your asset
                        for maximum return.
                    </p>
                    <div className="mt-9 grid w-full max-w-3xl gap-3 rounded-md bg-card p-3 shadow-xl md:grid-cols-[1fr_auto]">
                        <label className="flex items-center gap-3 px-3 text-muted-foreground">
                            <MapPin className="size-5" />
                            <input
                                className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-[#9AA0B2]"
                                aria-label="Property address for estimate"
                                disabled
                                placeholder="Online estimates are not available"
                            />
                        </label>
                        <Button
                            disabled
                            className="h-11 px-8 text-xs font-bold tracking-wide uppercase"
                        >
                            Estimates unavailable
                            <ArrowRight />
                        </Button>
                    </div>
                </div>
            </section>

            <section className="border-b border-border bg-background px-5 py-20">
                <div className="mx-auto max-w-7xl">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-semibold">
                            A Precision Approach to Selling
                        </h2>
                        <p className="mt-5 text-sm leading-6 text-muted-foreground">
                            We engineer the sales process to minimize days on
                            market while maximizing final yield. Every step is
                            executed with exacting standards.
                        </p>
                    </div>
                    <div className="mt-14 grid gap-10 md:grid-cols-4">
                        {processSteps.map((step) => (
                            <div
                                key={step.title}
                                className="text-center text-foreground"
                            >
                                <div className="mx-auto flex size-16 items-center justify-center rounded-md border border-border bg-accent text-accent-foreground shadow-sm">
                                    <step.icon className="size-6" />
                                </div>
                                <h3 className="mt-7 text-lg font-semibold">
                                    {step.title}
                                </h3>
                                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                    {step.copy}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-b border-border bg-muted px-5 py-20">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-semibold">
                                Example properties
                            </h2>
                            <p className="mt-4 text-sm text-muted-foreground">
                                Illustrative properties, not current listings or
                                verified sales.
                            </p>
                        </div>
                        <Button asChild variant="outline" className="px-8">
                            <Link href="/browse">View full portfolio</Link>
                        </Button>
                    </div>

                    <div className="mt-10 grid gap-6 lg:grid-cols-[1.45fr_0.8fr]">
                        <article className="grid overflow-hidden rounded-md border border-border bg-card md:grid-cols-[1.05fr_1fr]">
                            <div className="relative min-h-80">
                                <img
                                    src={poolImage}
                                    alt=""
                                    className="absolute inset-0 size-full object-cover"
                                />
                                <span className="absolute top-5 left-5 bg-[#111722] px-4 py-2 text-xs font-bold tracking-wide text-white uppercase">
                                    Closed - 14 days
                                </span>
                            </div>
                            <div className="flex min-h-80 flex-col p-7">
                                <div className="text-3xl font-semibold">
                                    ₱ 242,000,000
                                </div>
                                <div className="mt-3 text-sm text-muted-foreground">
                                    Palm Avenue, Forbes Park, Makati City
                                </div>
                                <div className="mt-8 flex flex-wrap gap-8 border-y border-border py-5 text-sm text-muted-foreground">
                                    <Metric
                                        icon={<BedDouble />}
                                        label="5 Beds"
                                    />
                                    <Metric
                                        icon={<Warehouse />}
                                        label="6 Baths"
                                    />
                                    <Metric icon={<Ruler />} label="576 SqM" />
                                </div>
                                <div className="mt-auto flex items-center justify-between text-sm">
                                    <span className="font-semibold text-primary">
                                        102% of Asking Price
                                    </span>
                                    <span className="text-muted-foreground">
                                        Represented Seller
                                    </span>
                                </div>
                            </div>
                        </article>

                        <article className="overflow-hidden rounded-md border border-border bg-card">
                            <div className="relative aspect-[16/9]">
                                <img
                                    src={homeImage}
                                    alt=""
                                    className="size-full object-cover"
                                />
                                <span className="absolute top-5 left-5 bg-[#111722] px-4 py-2 text-xs font-bold tracking-wide text-white uppercase">
                                    Closed
                                </span>
                            </div>
                            <div className="p-7">
                                <div className="text-2xl font-semibold">
                                    ₱ 104,000,000
                                </div>
                                <div className="mt-3 text-sm text-muted-foreground">
                                    Maria Luisa Estate Park, Cebu City
                                </div>
                                <div className="mt-16 flex gap-5 text-sm text-muted-foreground">
                                    <Metric icon={<BedDouble />} label="4" />
                                    <Metric icon={<Warehouse />} label="3.5" />
                                    <Metric icon={<Ruler />} label="353 SqM" />
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            <section className="bg-background px-5 py-24">
                <div className="mx-auto grid max-w-7xl overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[0.72fr_1fr]">
                    <aside className="bg-[#171B26] p-10 text-white md:p-12">
                        <p className="text-xs font-bold tracking-[0.22em] text-blue-200 uppercase">
                            Private consultation
                        </p>
                        <h2 className="mt-7 text-3xl font-semibold">
                            Ready to list your asset?
                        </h2>
                        <p className="mt-8 max-w-sm text-sm leading-7 text-white/80">
                            Connect with one of our senior brokerage partners
                            for a confidential, no-obligation valuation and
                            strategic market assessment.
                        </p>
                        <div className="mt-10 space-y-7">
                            <ContactLine
                                icon={<Phone />}
                                label="Direct line"
                                value="+63 2 8555 0199"
                            />
                            <ContactLine
                                icon={<Mail />}
                                label="Email"
                                value="partners@estatepro.com"
                            />
                        </div>
                    </aside>
                    <fieldset
                        disabled
                        className="grid gap-6 p-8 md:grid-cols-2 md:p-12"
                    >
                        <p className="text-sm text-muted-foreground md:col-span-2">
                            Online consultation requests are not available yet.
                        </p>
                        <Field label="First name" placeholder="John" />
                        <Field label="Last name" placeholder="Doe" />
                        <Field
                            label="Property address"
                            placeholder="123 Palm Avenue, Makati City"
                            wide
                        />
                        <Field
                            label="Email address"
                            placeholder="john@example.com"
                        />
                        <Field
                            label="Phone number"
                            placeholder="+63 917 000 0000"
                        />
                        <div className="md:col-span-2">
                            <label
                                htmlFor="consultation-details"
                                className="text-xs font-bold tracking-wide text-muted-foreground uppercase"
                            >
                                Additional details
                            </label>
                            <textarea
                                id="consultation-details"
                                className="mt-2 min-h-28 w-full rounded-sm border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-[#9AA0B2] focus:border-blue-500"
                                placeholder="Briefly describe your timeline and goals..."
                            />
                        </div>
                        <Button className="h-12 text-xs font-bold tracking-wide uppercase md:col-span-2">
                            Requests unavailable
                        </Button>
                    </fieldset>
                </div>
            </section>

            <footer className="border-t border-border bg-card">
                <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                    <div>
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-xl font-semibold text-primary"
                        >
                            <Building2 className="size-6" />
                            EstatePro
                        </Link>
                        <p className="mt-6 max-w-xs text-sm leading-6 text-muted-foreground">
                            Institutional-grade real estate brokerage delivering
                            precision execution for high-value assets.
                        </p>
                    </div>
                    <FooterGroup
                        title="Company"
                        links={['Our Agents', 'Careers', 'Contact Us']}
                    />
                    <FooterGroup title="Legal" links={['Terms', 'Privacy']} />
                    <div>
                        <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                            Connect
                        </h3>
                        <div className="mt-6 flex gap-5 text-muted-foreground">
                            <Building2 className="size-5" />
                            <Share2 className="size-5" />
                        </div>
                    </div>
                </div>
                <div className="border-t border-[#E5E8F1] px-5 py-6 text-sm text-muted-foreground">
                    <div className="mx-auto max-w-7xl">
                        © 2024 EstatePro Brokerage. All rights reserved.
                    </div>
                </div>
            </footer>
        </PublicLayout>
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
            <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
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
                <div className="text-xs font-bold tracking-wide text-white/80 uppercase">
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
            <label
                htmlFor={`consultation-${label.replaceAll(' ', '-').toLowerCase()}`}
                className="text-xs font-bold tracking-wide text-muted-foreground uppercase"
            >
                {label}
            </label>
            <input
                id={`consultation-${label.replaceAll(' ', '-').toLowerCase()}`}
                className="mt-2 h-12 w-full rounded-sm border border-border bg-card px-4 text-sm outline-none placeholder:text-[#9AA0B2] focus:border-blue-500"
                placeholder={placeholder}
            />
        </div>
    );
}

function FooterGroup({ title, links }: { title: string; links: string[] }) {
    return (
        <div>
            <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {title}
            </h3>
            <div className="mt-6 grid gap-4 text-sm text-muted-foreground">
                {links.map((link) => (
                    <span key={link}>{link}</span>
                ))}
            </div>
        </div>
    );
}
