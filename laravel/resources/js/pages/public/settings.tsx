import { useForm } from '@inertiajs/react';
import { Search, UserRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { PublicLayout } from './_components/public-layout';

type PublicSettingsProps = {
    profile?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        phone?: string | null;
    };
    recentSearches?: {
        id: string;
        name: string;
    }[];
};

export default function PublicSettings({
    profile,
    recentSearches = [],
}: PublicSettingsProps) {
    const form = useForm({
        first_name: profile?.firstName ?? '',
        last_name: profile?.lastName ?? '',
        phone: profile?.phone ?? '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.put('/portal/settings', { preserveScroll: true });
    };

    return (
        <PublicLayout title="Portal Settings">
            <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
                <h1 className="text-3xl font-semibold">Settings</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Profile, search preferences, and notification controls.
                </p>
                <div className="mt-6 grid gap-5 lg:grid-cols-[16rem_1fr]">
                    <aside className="rounded-md border border-border bg-card p-3">
                        <a
                            href="#profile"
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            <UserRound
                                className="size-4 text-primary"
                                aria-hidden="true"
                            />
                            Profile
                        </a>
                        <a
                            href="#saved-searches"
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            <Search
                                className="size-4 text-primary"
                                aria-hidden="true"
                            />
                            Saved searches
                        </a>
                    </aside>
                    <div className="space-y-5">
                        <form
                            id="profile"
                            className="rounded-md border border-border bg-card p-5"
                            onSubmit={submit}
                        >
                            <h2 className="font-semibold">
                                Profile information
                            </h2>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <label
                                    htmlFor="portal-first_name"
                                    className="grid gap-1.5 text-sm font-medium"
                                >
                                    First name
                                    <input
                                        id="portal-first_name"
                                        aria-label="First name"
                                        className="rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                        placeholder="First name"
                                        value={form.data.first_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'first_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                                <label
                                    htmlFor="portal-last_name"
                                    className="grid gap-1.5 text-sm font-medium"
                                >
                                    Last name
                                    <input
                                        id="portal-last_name"
                                        aria-label="Last name"
                                        className="rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                        placeholder="Last name"
                                        value={form.data.last_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'last_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                                <label
                                    htmlFor="portal-email"
                                    className="grid gap-1.5 text-sm font-medium md:col-span-2"
                                >
                                    Email
                                    <input
                                        id="portal-email"
                                        aria-label="Email"
                                        className="rounded-md border border-input px-3 py-2 text-sm md:col-span-2"
                                        placeholder="Email"
                                        value={profile?.email ?? ''}
                                        disabled
                                    />
                                </label>
                                <label
                                    htmlFor="portal-phone"
                                    className="grid gap-1.5 text-sm font-medium md:col-span-2"
                                >
                                    Phone
                                    <input
                                        id="portal-phone"
                                        aria-label="Phone"
                                        className="rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:col-span-2"
                                        placeholder="Phone"
                                        value={form.data.phone}
                                        onChange={(event) =>
                                            form.setData(
                                                'phone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                            </div>
                            {Object.entries(form.errors).map(
                                ([field, message]) => (
                                    <p
                                        key={field}
                                        role="alert"
                                        className="mt-2 text-sm text-destructive"
                                    >
                                        {message}
                                    </p>
                                ),
                            )}
                            {form.wasSuccessful && (
                                <p
                                    role="status"
                                    className="mt-2 text-sm text-status-success-foreground"
                                >
                                    Profile saved.
                                </p>
                            )}
                            <Button className="mt-4" disabled={form.processing}>
                                Save changes
                            </Button>
                        </form>
                        <section
                            id="saved-searches"
                            className="rounded-md border border-border bg-card p-5"
                        >
                            <h2 className="font-semibold">Saved searches</h2>
                            {recentSearches.length > 0 ? (
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {recentSearches.map((search) => (
                                        <span
                                            key={search.id}
                                            className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
                                        >
                                            {search.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                                    No saved searches yet.
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
