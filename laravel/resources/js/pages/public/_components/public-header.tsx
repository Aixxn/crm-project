import { Link, usePage } from '@inertiajs/react';
import { Building2, Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { login } from '@/routes';
import { dealTracker, myHome, browse } from '@/routes/public';
import { PublicNotificationBell } from './public-notification-bell';
import { PublicUserMenu } from './public-user-menu';

type PublicHeaderProps = {
    active?: 'Browse' | 'Saved' | 'Deal' | 'Concierge';
    sticky?: boolean;
};

const navItems = [
    { title: 'Browse', href: browse(), authOnly: false },
    { title: 'Saved', href: myHome(), authOnly: true },
    { title: 'Concierge', href: dealTracker(), authOnly: true },
] as const;

export function PublicHeader({ active, sticky = false }: PublicHeaderProps) {
    const { auth } = usePage().props;
    const [menuOpen, setMenuOpen] = useState(false);
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <header
            className={
                sticky
                    ? 'sticky top-0 z-40 border-b border-border bg-card'
                    : 'border-b border-border bg-card'
            }
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-5 sm:px-5">
                <div className="flex min-w-0 items-center gap-2 sm:gap-7">
                    <Link
                        href="/"
                        aria-label="EstatePro home"
                        className="flex shrink-0 items-center gap-2 text-xl font-semibold text-primary"
                    >
                        <Building2 className="size-6" aria-hidden="true" />
                        <span className="hidden sm:inline">EstatePro</span>
                    </Link>
                </div>
                <nav
                    aria-label="Main navigation"
                    className="hidden h-16 items-center gap-10 text-xs font-bold tracking-wide text-muted-foreground uppercase md:flex"
                >
                    {navItems
                        .filter((item) => !item.authOnly || auth.user)
                        .map((item) => {
                            const className =
                                active === item.title
                                    ? 'relative flex h-16 items-center text-primary after:absolute after:inset-x-0 after:bottom-3 after:h-0.5 after:bg-primary'
                                    : 'relative flex h-16 items-center';

                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    aria-current={
                                        active === item.title
                                            ? 'page'
                                            : undefined
                                    }
                                    className={className}
                                >
                                    {item.title}
                                </Link>
                            );
                        })}
                </nav>
                <div className="flex items-center gap-3 text-foreground">
                    <button
                        type="button"
                        aria-label={`Switch to ${resolvedAppearance === 'dark' ? 'light' : 'dark'} appearance`}
                        onClick={() =>
                            updateAppearance(
                                resolvedAppearance === 'dark'
                                    ? 'light'
                                    : 'dark',
                            )
                        }
                        className="inline-flex size-10 items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        {resolvedAppearance === 'dark' ? (
                            <Sun className="size-4" aria-hidden="true" />
                        ) : (
                            <Moon className="size-4" aria-hidden="true" />
                        )}
                    </button>
                    {auth.user && <PublicNotificationBell />}
                    {auth.user ? (
                        <PublicUserMenu user={auth.user} />
                    ) : (
                        <Link
                            href={login()}
                            className="inline-flex h-10 items-center justify-center rounded-sm bg-primary px-3 text-[10px] font-bold tracking-wide text-primary-foreground uppercase hover:bg-primary/90 sm:px-6 sm:text-xs"
                        >
                            Sign In
                        </Link>
                    )}
                    <button
                        type="button"
                        className="inline-flex size-10 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
                        aria-label={
                            menuOpen
                                ? 'Close navigation menu'
                                : 'Open navigation menu'
                        }
                        aria-expanded={menuOpen}
                        aria-controls="public-mobile-navigation"
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        {menuOpen ? (
                            <X className="size-5" aria-hidden="true" />
                        ) : (
                            <Menu className="size-5" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>
            {menuOpen && (
                <nav
                    id="public-mobile-navigation"
                    aria-label="Mobile navigation"
                    className="grid gap-1 border-t border-border px-5 py-3 md:hidden"
                >
                    {navItems
                        .filter((item) => !item.authOnly || auth.user)
                        .map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                aria-current={
                                    active === item.title ? 'page' : undefined
                                }
                                onClick={() => setMenuOpen(false)}
                                className={`rounded-md px-3 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${active === item.title ? 'bg-muted text-primary' : 'text-foreground hover:bg-muted'}`}
                            >
                                {item.title}
                            </Link>
                        ))}
                </nav>
            )}
        </header>
    );
}
