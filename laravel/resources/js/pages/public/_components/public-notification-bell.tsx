import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useState } from 'react';

type PortalNotification = {
    id: string;
    title: string | null;
    message: string | null;
    href: string | null;
    status: string | null;
    price: number | null;
    createdAt: string | null;
};

function formatPeso(value: number | null) {
    if (value === null) {
        return null;
    }

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(value);
}

export function PublicNotificationBell() {
    const { notifications } = usePage().props;
    const [open, setOpen] = useState(false);
    const recent = notifications.recent as PortalNotification[];
    const unreadCount = notifications.unreadCount;

    const markAsRead = (notification: PortalNotification) => {
        router.patch(
            `/portal/notifications/${notification.id}`,
            {},
            {
                preserveScroll: true,
                only: ['notifications'],
                onSuccess: () => {
                    if (recent.length <= 1) {
                        setOpen(false);
                    }
                },
            },
        );
    };

    return (
        <div className="relative hidden md:block">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="relative flex size-9 items-center justify-center rounded-sm text-[#4F5365] hover:bg-[#F0F2F8] hover:text-blue-700"
                aria-label="Notifications"
            >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute top-11 right-0 z-50 w-80 rounded-md border border-[#D8DCE8] bg-white shadow-lg">
                    <div className="border-b border-[#E4E7F0] px-4 py-3">
                        <p className="text-sm font-semibold text-[#151826]">
                            Notifications
                        </p>
                    </div>
                    {recent.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                            {recent.map((notification) => {
                                const formattedPrice = formatPeso(
                                    notification.price,
                                );

                                return (
                                    <div
                                        key={notification.id}
                                        className="border-b border-[#EEF0F6] px-4 py-3 last:border-b-0"
                                    >
                                        <Link
                                            href={
                                                notification.href ?? '/browse'
                                            }
                                            className="block text-sm font-semibold text-[#151826] hover:text-blue-700"
                                        >
                                            {notification.title ??
                                                'New listing'}
                                        </Link>
                                        <p className="mt-1 text-xs leading-5 text-[#626778]">
                                            {notification.message ??
                                                'A new listing is available.'}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold tracking-wide text-[#6E7284] uppercase">
                                            <span>
                                                {notification.status ??
                                                    'Available'}
                                                {formattedPrice
                                                    ? ` · ${formattedPrice}`
                                                    : ''}
                                            </span>
                                            <span>
                                                {notification.createdAt}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                markAsRead(notification)
                                            }
                                            className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-800"
                                        >
                                            Mark as read
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center text-sm text-[#626778]">
                            No new listing notifications.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
