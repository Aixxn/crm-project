import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    Check,
    Circle,
    KeyRound,
    MailCheck,
    MapPin,
    MessageSquare,
    TicketCheck,
} from 'lucide-react';
import { PublicHeader } from './_components/public-header';

const activeOfferImage =
    'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1000&q=85';
const viewingImage =
    'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=280&q=85';
const inquiryImage =
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=280&q=85';

export default function DealTracker() {
    return (
        <>
            <Head title="Deal Tracker" />
            <main className="min-h-screen bg-[#FBFBFE] text-[#202230]">
                <PublicHeader active="Concierge" search />

                <section className="mx-auto max-w-7xl px-5 py-11">
                    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                            <h1 className="text-5xl font-semibold tracking-tight">Deal Tracker</h1>
                            <p className="mt-5 max-w-3xl text-base leading-7 text-[#4F5365]">
                                Monitor the progress of your active inquiries, scheduled viewings, and submitted offers in real-time.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Kpi label="Active Offers" value="1" />
                            <Kpi label="Inquiries" value="2" />
                        </div>
                    </div>

                    <section className="mt-8 grid overflow-hidden rounded-md border border-[#C8CDDA] bg-white lg:grid-cols-[26rem_1fr]">
                        <div className="relative min-h-[25.75rem] bg-neutral-900">
                            <img
                                src={activeOfferImage}
                                alt="1042 Montage Way exterior"
                                className="absolute inset-0 size-full object-cover"
                            />
                            <span className="absolute left-4 top-5 inline-flex items-center gap-1 rounded-full bg-[#FFE2D5] px-4 py-1.5 text-sm font-semibold text-[#9A3A15]">
                                <TicketCheck className="size-4" />
                                Offer Submitted
                            </span>
                        </div>

                        <div className="flex min-w-0 flex-col p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-semibold">1042 Montage Way</h2>
                                    <div className="mt-2 flex items-center gap-1 text-sm text-[#4F5365]">
                                        <MapPin className="size-4" />
                                        Los Angeles, CA 90210
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-semibold">$4,250,000</div>
                                    <Link
                                        href="/properties/featured"
                                        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
                                    >
                                        View Details
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-auto rounded-sm border border-[#CDD2E0] bg-[#F0F1FA] p-6">
                                <div className="grid grid-cols-4 items-start text-center text-sm">
                                    {progressSteps.map((step, index) => (
                                        <div key={step.label} className="relative">
                                            {index < progressSteps.length - 1 && (
                                                <div
                                                    className={`absolute left-1/2 top-3 h-1 w-full ${
                                                        index < 2 ? 'bg-blue-700' : 'bg-[#D8DCE8]'
                                                    }`}
                                                />
                                            )}
                                            <div
                                                className={`relative z-10 mx-auto flex size-7 items-center justify-center rounded-full border-2 ${
                                                    step.state === 'done'
                                                        ? 'border-blue-700 bg-blue-700 text-white'
                                                        : step.state === 'current'
                                                          ? 'border-blue-700 bg-white text-blue-700'
                                                          : 'border-[#C9CDDA] bg-[#F7F8FC] text-[#6E7284]'
                                                }`}
                                            >
                                                <step.icon className="size-4" />
                                            </div>
                                            <div className={`mt-2 font-semibold ${step.state === 'current' ? 'text-blue-700' : 'text-[#4F5365]'}`}>
                                                {step.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 border-t border-[#D8DCE8] pt-5">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <p className="text-sm text-[#5F6373]">
                                            Last update: Seller agent reviewing contingencies. (2 hours ago)
                                        </p>
                                        <button className="inline-flex h-9 items-center justify-center rounded-sm bg-blue-700 px-6 text-sm font-semibold text-white hover:bg-blue-800">
                                            Contact Agent
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <section className="rounded-md border border-[#C8CDDA] bg-white p-5">
                            <div className="flex items-start gap-4">
                                <img
                                    src={viewingImage}
                                    alt="742 Evergreen Terrace"
                                    className="size-24 rounded-sm object-cover"
                                />
                                <div>
                                    <span className="inline-flex items-center gap-1 bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                        <CalendarDays className="size-3.5" />
                                        Viewing Scheduled
                                    </span>
                                    <h2 className="mt-3 text-xl font-semibold">742 Evergreen Terrace</h2>
                                    <p className="mt-1 text-sm text-[#5F6373]">$1,150,000</p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-sm border border-[#CDD2E0] bg-[#F0F1FA] p-4">
                                <div className="flex items-center gap-4">
                                    <div className="rounded-sm border border-[#CDD2E0] bg-white px-4 py-3 text-center">
                                        <div className="text-xs font-semibold uppercase text-[#5F6373]">Oct</div>
                                        <div className="text-3xl font-semibold text-blue-700">24</div>
                                    </div>
                                    <div>
                                        <div className="font-semibold">In-Person Tour</div>
                                        <div className="mt-2 text-sm text-[#4F5365]">2:00 PM - 3:00 PM</div>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    <button className="h-9 rounded-sm border border-[#8C92A4] text-sm font-semibold">
                                        Reschedule
                                    </button>
                                    <Link
                                        href="/properties/featured"
                                        className="inline-flex h-9 items-center justify-center rounded-sm bg-[#F2F3FA] text-sm font-semibold text-blue-700"
                                    >
                                        Property Detail
                                    </Link>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-md border border-[#C8CDDA] bg-white p-5">
                            <div className="flex items-start gap-4">
                                <img
                                    src={inquiryImage}
                                    alt="1200 Riverfront Blvd"
                                    className="size-24 rounded-sm object-cover"
                                />
                                <div>
                                    <span className="inline-flex items-center gap-1 bg-[#E8E9F2] px-2 py-1 text-xs font-semibold text-[#4F5365]">
                                        <MessageSquare className="size-3.5" />
                                        Inquiry Sent
                                    </span>
                                    <h2 className="mt-3 text-xl font-semibold">1200 Riverfront Blvd, Unit 4B</h2>
                                    <p className="mt-1 text-sm text-[#5F6373]">$850,000</p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-sm border border-[#CDD2E0] bg-[#F0F1FA] p-5">
                                <div className="flex gap-4">
                                    <MailCheck className="mt-1 size-6 text-[#5F6373]" />
                                    <div>
                                        <div className="font-semibold">Message sent to listing agent</div>
                                        <div className="mt-2 text-sm text-[#5F6373]">Sent: Yesterday, 4:30 PM</div>
                                    </div>
                                </div>
                                <div className="mt-5 h-1 rounded-full bg-[#D8DCE8]">
                                    <div className="h-1 w-1/4 rounded-full bg-blue-700" />
                                </div>
                                <div className="mt-3 text-right text-sm text-[#5F6373]">Awaiting Response</div>
                            </div>
                        </section>
                    </div>
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

const progressSteps = [
    { label: 'Inquiry', state: 'done', icon: Check },
    { label: 'Viewing', state: 'done', icon: Check },
    { label: 'Offer Pending', state: 'current', icon: Circle },
    { label: 'Closing', state: 'upcoming', icon: KeyRound },
] as const;

function Kpi({ label, value }: { label: string; value: string }) {
    return (
        <div className="w-32 rounded-md border border-[#C8CDDA] bg-[#F0F1FA] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#4F5365]">{label}</div>
            <div className="mt-3 text-3xl font-semibold">{value}</div>
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
