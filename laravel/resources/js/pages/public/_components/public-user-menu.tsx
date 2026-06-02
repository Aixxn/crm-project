import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/routes';
import type { User } from '@/types';

type PublicUserMenuProps = {
    user: User;
};

export function PublicUserMenu({ user }: PublicUserMenuProps) {
    const initials = user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const handleLogout = () => {
        router.flushAll();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-full ring-1 ring-[#D8DCE8] transition hover:ring-blue-700"
                    aria-label="Open user menu"
                >
                    <Avatar className="size-10 overflow-hidden rounded-full">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-blue-700 text-xs font-bold text-white">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-md" align="end">
                <DropdownMenuLabel className="font-normal">
                    <div className="truncate text-sm font-semibold text-[#151826]">{user.name}</div>
                    <div className="truncate text-xs text-[#6E7284]">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/portal/settings" className="w-full cursor-pointer">
                        <Settings className="mr-2 size-4" />
                        Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href={logout()}
                        as="button"
                        className="w-full cursor-pointer"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 size-4" />
                        Log out
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
