import { Link } from '@inertiajs/react';
import {
    Building2,
    CalendarClock,
    CircleDollarSign,
    ContactRound,
    LayoutDashboard,
    ListChecks,
    MessageSquareText,
    Settings,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import contacts from '@/routes/contacts';
import inquiries from '@/routes/inquiries';
import listings from '@/routes/listings';
import offers from '@/routes/offers';
import profile from '@/routes/profile';
import viewings from '@/routes/viewings';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Listings',
        href: listings.index(),
        icon: Building2,
    },
    {
        title: 'Contacts',
        href: contacts.index(),
        icon: ContactRound,
    },
    {
        title: 'Inquiries',
        href: inquiries.index(),
        icon: MessageSquareText,
    },
    {
        title: 'Viewings',
        href: viewings.index(),
        icon: CalendarClock,
    },
    {
        title: 'Offers',
        href: offers.index(),
        icon: CircleDollarSign,
    },
    {
        title: 'Tasks / Notes',
        href: '/tasks',
        icon: ListChecks,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: profile.edit(),
        icon: Settings,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
