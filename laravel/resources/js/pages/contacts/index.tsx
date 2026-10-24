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
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-950">
                                Contacts
                            </h1>
                            <p className="mt-1 text-sm text-neutral-600">
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
                    <section className="rounded-md border border-[#C3C6D7] bg-white">
                        <div className="grid gap-3 border-b border-[#C3C6D7]/70 p-3 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
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
                                <SelectTrigger className="w-full bg-white">
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
                                <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 uppercase">
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
                                <tbody className="divide-y divide-[#C3C6D7]/60">
                                    {paginated.data.map((contact) => (
                                        <tr
                                            key={contact.id}
                                            className="bg-white align-top hover:bg-[#FAF8FF]"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex gap-3">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#C3C6D7] bg-[#FAF8FF] text-neutral-700">
                                                        <ContactRound className="size-4" />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={contacts.show(
                                                                contact,
                                                            )}
                                                            className="font-medium text-neutral-950 hover:underline"
                                                        >
                                                            {contactName(
                                                                contact,
                                                            )}
                                                        </Link>
                                                        <div className="mt-1 text-xs text-neutral-500">
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
                                            <td className="px-4 py-4 text-neutral-700">
                                                {contact.email ?? '-'}
                                            </td>
                                            <td className="px-4 py-4 text-neutral-700">
                                                {contact.phone ?? '-'}
                                            </td>
                                            <td className="max-w-xs px-4 py-4 text-neutral-600">
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
                            <div className="px-4 py-14 text-center text-sm text-neutral-600">
                                No contacts match the current filters.
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C3C6D7]/70 px-4 py-3 text-sm text-neutral-600">
                            <span>
                                Showing {paginated.from ?? 0}-
                                {paginated.to ?? 0} of {paginated.total}
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {paginated.links.map((link) => (
                                    <Button
                                        key={`${link.label}-${link.url}`}
                                        size="sm"
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        disabled={!link.url}
                                        asChild={Boolean(link.url)}
                                    >
                                        {link.url ? (
                                            <Link href={link.url}>
                                                {paginationLabel(link.label)}
                                            </Link>
                                        ) : (
                                            <span>
                                                {paginationLabel(link.label)}
                                            </span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
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
        Owner: 'border-sky-200 bg-sky-50 text-sky-700',
        Buyer: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        Tenant: 'border-amber-200 bg-amber-50 text-amber-700',
    };

    return (
        <Badge variant="outline" className={classes[role]}>
            {role}
        </Badge>
    );
}

function contactName(contact: {
    first_name: string;
    last_name: string | null;
}) {
    return `${contact.first_name} ${contact.last_name ?? ''}`.trim();
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function paginationLabel(label: string) {
    return label.replace('&laquo;', 'Previous').replace('&raquo;', 'Next');
}
