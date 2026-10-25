import { Head, Link, router } from '@inertiajs/react';
import {
    ContactRound,
    Eye,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { contactName, formatDate } from '@/lib/format';
import { dashboard } from '@/routes';
import contacts from '@/routes/contacts';
import type { ContactRole, PaginatedContacts } from './types';

type ContactIndexProps = {
    canCreateContact?: boolean;
    contacts: PaginatedContacts;
    filters: {
        search?: string;
        role?: ContactRole;
    };
};

const roles: Array<ContactRole | 'All'> = ['All', 'Owner', 'Buyer', 'Tenant'];

export default function ContactIndex({
    canCreateContact = false,
    contacts: paginated,
    filters,
}: ContactIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [role, setRole] = useState<string>(filters.role ?? 'All');

    const applyFilters = () => {
        router.get(
            contacts.index().url,
            {
                search: search || undefined,
                role: role === 'All' ? undefined : role,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <>
            <Head title="Contacts" />
            <main className="min-h-full bg-muted">
                <div className="border-b border-border bg-card px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">
                                Contacts
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {paginated.total} people linked to listings and
                                workflow activity.
                            </p>
                        </div>
                        {canCreateContact && (
                            <Button asChild>
                                <Link href={contacts.create()}>
                                    <Plus />
                                    New contact
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="space-y-4 p-4 md:p-6">
                    <section className="rounded-md border border-border bg-card">
                        <div className="grid gap-3 border-b border-border/70 p-3 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                    className="pl-9"
                                    placeholder="Search name, email, or phone"
                                />
                            </div>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={applyFilters}>
                                <SlidersHorizontal />
                                Apply
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-muted text-xs font-medium text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Phone</th>
                                        <th className="px-4 py-3">Notes</th>
                                        <th className="px-4 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {paginated.data.map((contact) => (
                                        <tr
                                            key={contact.id}
                                            className="bg-card align-top hover:bg-muted"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex gap-3">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                                                        <ContactRound className="size-4" />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={contacts.show(
                                                                contact,
                                                            )}
                                                            className="font-medium text-foreground hover:underline"
                                                        >
                                                            {contactName(
                                                                contact,
                                                            )}
                                                        </Link>
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Added{' '}
                                                            {formatDate(
                                                                contact.created_at,
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <RoleBadge
                                                    role={contact.role}
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-foreground">
                                                {contact.email ?? '-'}
                                            </td>
                                            <td className="px-4 py-4 text-foreground">
                                                {contact.phone ?? '-'}
                                            </td>
                                            <td className="max-w-xs px-4 py-4 text-muted-foreground">
                                                <span className="line-clamp-2">
                                                    {contact.notes || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        asChild
                                                        aria-label="View contact"
                                                    >
                                                        <Link
                                                            href={contacts.show(
                                                                contact,
                                                            )}
                                                        >
                                                            <Eye />
                                                        </Link>
                                                    </Button>
                                                    {contact.can_update && (
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            asChild
                                                            aria-label="Edit contact"
                                                        >
                                                            <Link
                                                                href={contacts.edit(
                                                                    contact,
                                                                )}
                                                            >
                                                                <Pencil />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {paginated.data.length === 0 && (
                            <EmptyState>
                                No contacts match the current filters.
                            </EmptyState>
                        )}
                        <Pagination paginated={paginated} />
                    </section>
                </div>
            </main>
        </>
    );
}

ContactIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Contacts',
            href: contacts.index(),
        },
    ],
};

function RoleBadge({ role }: { role: ContactRole }) {
    const classes: Record<ContactRole, string> = {
        Owner: 'border-status-info-border bg-status-info text-status-info-foreground',
        Buyer: 'border-status-success-border bg-status-success text-status-success-foreground',
        Tenant: 'border-status-warning-border bg-status-warning text-status-warning-foreground',
    };

    return (
        <Badge variant="outline" className={classes[role]}>
            {role}
        </Badge>
    );
}
