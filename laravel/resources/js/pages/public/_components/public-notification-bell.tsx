import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { money } from '@/lib/format';

type PortalNotification = {
    id: string;
    title: string | null;
    message: string | null;
    href: string | null;
    status: string | null;
    price: number | null;
    createdAt: string | null;
};

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
                className="relative flex size-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-primary"
                aria-label="Notifications"
            >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute top-11 right-0 z-50 w-80 rounded-md border border-border bg-card shadow-lg">
                    <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">
                            Notifications
                        </p>
                    </div>
                    {recent.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                            {recent.map((notification) => {
                                const formattedPrice =
                                    notification.price === null
                                        ? null
                                        : money(notification.price);

                                return (
                                    <div
                                        key={notification.id}
                                        className="border-b border-border px-4 py-3 last:border-b-0"
                                    >
                                        <Link
                                            href={
                                                notification.href ?? '/browse'
                                            }
                                            className="block text-sm font-semibold text-foreground hover:text-primary"
                                        >
                                            {notification.title ??
                                                'New listing'}
                                        </Link>
                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            {notification.message ??
                                                'A new listing is available.'}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
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
                                            className="mt-3 text-xs font-semibold text-primary hover:text-status-info-foreground"
                                        >
                                            Mark as read
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No new listing notifications.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
