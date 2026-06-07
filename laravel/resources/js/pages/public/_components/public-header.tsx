import { Link, usePage } from '@inertiajs/react';
import { Building2, Heart, Search } from 'lucide-react';
import { PublicNotificationBell } from './public-notification-bell';
import { PublicUserMenu } from './public-user-menu';

type PublicHeaderProps = {
    active?: 'Browse' | 'Saved' | 'Sell' | 'Deal' | 'Concierge';
    search?: boolean;
    sticky?: boolean;
};

const navItems = [
    { title: 'Browse', href: '/browse', authOnly: false },
    { title: 'Saved', href: '/my-home', authOnly: true },
    { title: 'Sell', href: '/', authOnly: false },
    { title: 'Concierge', href: '/deal-tracker', authOnly: true },
] as const;

export function PublicHeader({ active, search = false, sticky = false }: PublicHeaderProps) {
    const { auth } = usePage().props;

    return (
        <header className={sticky ? 'sticky top-0 z-40 border-b border-[#D8DCE8] bg-white' : 'border-b border-[#D8DCE8] bg-white'}>
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-5">
                <div className="flex min-w-0 items-center gap-7">
                    <Link
                        href="/"
                        className="flex shrink-0 items-center gap-2 text-xl font-semibold text-blue-700"
                    >
                        <Building2 className="size-6" />
                        EstatePro
                    </Link>
                    {search && (
                        <label className="hidden h-10 w-64 items-center gap-3 rounded-xl border border-[#C9CDDA] bg-[#F7F8FC] px-4 text-sm text-[#5F6373] lg:flex">
                            <Search className="size-5" />
                            <input
                                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#5F6373]"
                                placeholder="Search properties..."
                            />
                        </label>
                    )}
                </div>
                <nav className="hidden h-16 items-center gap-10 text-xs font-bold uppercase tracking-wide text-[#6E7284] md:flex">
                    {navItems
                        .filter((item) => ! item.authOnly || auth.user)
                        .map((item) => {
                            const className =
                                active === item.title
                                    ? 'relative flex h-16 items-center text-blue-700 after:absolute after:inset-x-0 after:bottom-3 after:h-0.5 after:bg-blue-700'
                                    : 'relative flex h-16 items-center';

                            return active === 'Sell' && item.title === 'Sell' ? (
                                <span key={item.title} className={className}>
                                    {item.title}
                                </span>
                            ) : (
                                <Link key={item.title} href={item.href} className={className}>
                                    {item.title}
                                </Link>
                            );
                        })}
                </nav>
                <div className="flex items-center gap-6 text-[#4F5365]">
                    {auth.user && (
                        <>
                            <PublicNotificationBell />
                            <Heart className="hidden size-5 md:block" />
                        </>
                    )}
                    {auth.user ? (
                        <PublicUserMenu user={auth.user} />
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
