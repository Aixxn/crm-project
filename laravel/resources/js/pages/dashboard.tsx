import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    CalendarClock,
    CheckSquare,
    CircleDollarSign,
    MessageSquareText,
    MoveRight,
    Trophy,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { formatDate, formatDateTime, money, StatusBadge } from './workflow-support';

type DashboardProps = {
    kpis: {
        activeListings: number;
        newInquiries: number;
        upcomingViewings: number;
        pendingOffers: number;
        closedThisMonth: number;
    };
    recentActivity: ActivityItem[];
    upcomingViewings: ViewingItem[];
    openTasks: TaskItem[];
    activeListings: ListingItem[];
};

type ActivityItem = {
    type: string;
    title: string;
    subtitle: string;
    status: string | null;
    href: string;
    occurred_at: string;
};

type ViewingItem = {
    id: string;
    status: string;
    scheduled_at: string;
    listing?: { address: string } | null;
    contact?: { first_name: string; last_name: string | null } | null;
    agent?: { name: string } | null;
};

type TaskItem = {
    id: string;
    title: string;
    status: string;
    due_date: string | null;
    assignee?: { name: string } | null;
};

type ListingItem = {
    id: string;
    address: string;
    status: string;
    price: string | number;
    inquiries_count: number;
    viewings_count: number;
    offers_count: number;
};

const kpiCards = [
    {
        key: 'activeListings',
        label: 'Active Listings',
        icon: Building2,
        href: '/listings',
    },
    {
        key: 'newInquiries',
        label: 'New Inquiries',
        icon: MessageSquareText,
        href: '/inquiries',
    },
    {
        key: 'upcomingViewings',
        label: 'Upcoming Viewings',
        icon: CalendarClock,
        href: '/viewings',
    },
    {
        key: 'pendingOffers',
        label: 'Pending Offers',
        icon: CircleDollarSign,
        href: '/offers',
    },
    {
        key: 'closedThisMonth',
        label: 'Closed This Month',
        icon: Trophy,
        href: '/listings',
    },
] as const;

export default function Dashboard({
    kpis,
    recentActivity,
    upcomingViewings,
    openTasks,
    activeListings,
}: DashboardProps) {
    return (
        <>
            <Head title="Dashboard" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-950">
                                Overview
                            </h1>
                            <p className="mt-1 text-sm text-neutral-600">
                                Today&apos;s listing pipeline and follow-up queue.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href="/listings/create">New listing</Link>
                        </Button>
                    </div>
                </div>

                <div className="space-y-4 p-4 md:p-6">
                    <section className="grid gap-3 md:grid-cols-5">
                        {kpiCards.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className="rounded-md border border-[#C3C6D7] bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/40"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-medium text-neutral-600">
                                            {item.label}
                                        </div>
                                        <Icon className="size-4 text-blue-700" />
                                    </div>
                                    <div className="mt-3 text-2xl font-semibold text-neutral-950">
                                        {kpis[item.key]}
                                    </div>
                                </Link>
                            );
                        })}
                    </section>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
                        <section className="rounded-md border border-[#C3C6D7] bg-white">
                            <div className="flex items-center justify-between gap-3 border-b border-[#C3C6D7]/70 px-4 py-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-neutral-950">
                                        Active listing performance
                                    </h2>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        Current listings with workflow counts.
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/listings">
                                        View all
                                        <MoveRight />
                                    </Link>
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[780px] text-left text-sm">
                                    <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Listing</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Price</th>
                                            <th className="px-4 py-3">Inquiries</th>
                                            <th className="px-4 py-3">Viewings</th>
                                            <th className="px-4 py-3">Offers</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#C3C6D7]/60">
                                        {activeListings.map((listing) => (
                                            <tr
                                                key={listing.id}
                                                className="hover:bg-[#FAF8FF]"
                                            >
                                                <td className="px-4 py-4">
                                                    <Link
                                                        href={`/listings/${listing.id}`}
                                                        className="font-medium text-neutral-950 hover:underline"
                                                    >
                                                        {listing.address}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={listing.status} />
                                                </td>
                                                <td className="px-4 py-4 text-neutral-700">
                                                    {money(listing.price)}
                                                </td>
                                                <td className="px-4 py-4 text-neutral-700">
                                                    {listing.inquiries_count}
                                                </td>
                                                <td className="px-4 py-4 text-neutral-700">
                                                    {listing.viewings_count}
                                                </td>
                                                <td className="px-4 py-4 text-neutral-700">
                                                    {listing.offers_count}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {activeListings.length === 0 && (
                                <EmptyPanel message="No active listings are in scope." />
                            )}
                        </section>

                        <section className="rounded-md border border-[#C3C6D7] bg-white">
                            <div className="border-b border-[#C3C6D7]/70 px-4 py-3">
                                <h2 className="text-sm font-semibold text-neutral-950">
                                    Recent activity
                                </h2>
                                <p className="mt-1 text-xs text-neutral-500">
                                    Latest listing, inquiry, offer, and note updates.
                                </p>
                            </div>
                            <div className="divide-y divide-[#C3C6D7]/60">
                                {recentActivity.map((activity) => (
                                    <Link
                                        key={`${activity.type}-${activity.href}-${activity.occurred_at}`}
                                        href={activity.href}
                                        className="block px-4 py-3 hover:bg-[#FAF8FF]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="outline">
                                                        {activity.type}
                                                    </Badge>
                                                    {activity.status && (
                                                        <StatusBadge status={activity.status} />
                                                    )}
                                                </div>
                                                <div className="mt-2 truncate text-sm font-medium text-neutral-950">
                                                    {activity.title}
                                                </div>
                                                <div className="mt-1 text-xs text-neutral-500">
                                                    {activity.subtitle}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-xs text-neutral-500">
                                                {formatDate(activity.occurred_at)}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            {recentActivity.length === 0 && (
                                <EmptyPanel message="No recent activity yet." />
                            )}
                        </section>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <QueueSection
                            title="Upcoming viewings"
                            icon={<CalendarClock className="size-4" />}
                            href="/viewings"
                        >
                            {upcomingViewings.map((viewing) => (
                                <Link
                                    key={viewing.id}
                                    href={`/viewings/${viewing.id}`}
                                    className="grid gap-2 border-b border-[#C3C6D7]/60 px-4 py-3 last:border-b-0 hover:bg-[#FAF8FF] md:grid-cols-[1fr_auto]"
                                >
                                    <div>
                                        <div className="font-medium text-neutral-950">
                                            {viewing.listing?.address ?? 'Viewing'}
                                        </div>
                                        <div className="mt-1 text-xs text-neutral-500">
                                            {contactName(viewing.contact)} with {viewing.agent?.name ?? 'agent'}
                                        </div>
                                    </div>
                                    <div className="text-sm text-neutral-700">
                                        {formatDateTime(viewing.scheduled_at)}
                                    </div>
                                </Link>
                            ))}
                            {upcomingViewings.length === 0 && (
                                <EmptyPanel message="No scheduled viewings coming up." />
                            )}
                        </QueueSection>

                        <QueueSection
                            title="Open tasks"
                            icon={<CheckSquare className="size-4" />}
                            href="/tasks"
                        >
                            {openTasks.map((task) => (
                                <Link
                                    key={task.id}
                                    href={`/tasks/${task.id}`}
                                    className="grid gap-2 border-b border-[#C3C6D7]/60 px-4 py-3 last:border-b-0 hover:bg-[#FAF8FF] md:grid-cols-[1fr_auto]"
                                >
                                    <div>
                                        <div className="font-medium text-neutral-950">
                                            {task.title}
                                        </div>
                                        <div className="mt-1 text-xs text-neutral-500">
                                            {task.assignee?.name ?? 'Unassigned'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={task.status} />
                                        <span className="text-sm text-neutral-700">
                                            {task.due_date ? formatDate(task.due_date) : '-'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                            {openTasks.length === 0 && (
                                <EmptyPanel message="No open tasks in scope." />
                            )}
                        </QueueSection>
                    </div>
                </div>
            </main>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

function QueueSection({
    title,
    icon,
    href,
    children,
}: {
    title: string;
    icon: ReactNode;
    href: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-md border border-[#C3C6D7] bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-[#C3C6D7]/70 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
                    {icon}
                    {title}
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href={href}>Open</Link>
                </Button>
            </div>
            <div>{children}</div>
        </section>
    );
}

function EmptyPanel({ message }: { message: string }) {
    return (
        <div className="px-4 py-10 text-center text-sm text-neutral-600">
            {message}
        </div>
    );
}

function contactName(contact: ViewingItem['contact']) {
    if (!contact) {
        return 'Contact';
    }

    return `${contact.first_name} ${contact.last_name ?? ''}`.trim();
}
