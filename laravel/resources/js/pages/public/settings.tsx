import { Head, useForm } from '@inertiajs/react';
import { Lock, Search, UserRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from './_components/public-header';

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
        <>
            <Head title="Portal Settings" />
            <main className="min-h-screen bg-[#F7F8FC] text-neutral-950">
                <PublicHeader active="Concierge" />
                <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
                    <h1 className="text-3xl font-semibold">Settings</h1>
                    <p className="mt-2 text-sm text-neutral-600">
                        Profile, search preferences, and notification controls.
                    </p>
                    <div className="mt-6 grid gap-5 lg:grid-cols-[16rem_1fr]">
                        <aside className="rounded-md border border-[#D8DCE8] bg-white p-3">
                            {[
                                ['Profile', UserRound],
                                ['Saved searches', Search],
                                ['Security', Lock],
                            ].map(([label, Icon]) => (
                                <button
                                    key={String(label)}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-blue-50"
                                >
                                    <Icon className="size-4 text-blue-700" />
                                    {String(label)}
                                </button>
                            ))}
                        </aside>
                        <div className="space-y-5">
                            <form
                                className="rounded-md border border-[#D8DCE8] bg-white p-5"
                                onSubmit={submit}
                            >
                                <h2 className="font-semibold">
                                    Profile information
                                </h2>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <input
                                        className="rounded-md border border-[#D8DCE8] px-3 py-2 text-sm"
                                        placeholder="First name"
                                        value={form.data.first_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'first_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <input
                                        className="rounded-md border border-[#D8DCE8] px-3 py-2 text-sm"
                                        placeholder="Last name"
                                        value={form.data.last_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'last_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <input
                                        className="rounded-md border border-[#D8DCE8] px-3 py-2 text-sm md:col-span-2"
                                        placeholder="Email"
                                        value={profile?.email ?? ''}
                                        disabled
                                    />
                                    <input
                                        className="rounded-md border border-[#D8DCE8] px-3 py-2 text-sm md:col-span-2"
                                        placeholder="Phone"
                                        value={form.data.phone}
                                        onChange={(event) =>
                                            form.setData(
                                                'phone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <Button
                                    className="mt-4"
                                    disabled={form.processing}
                                >
                                    Save changes
                                </Button>
                            </form>
                            <section className="rounded-md border border-[#D8DCE8] bg-white p-5">
                                <h2 className="font-semibold">
                                    Saved searches
                                </h2>
                                {recentSearches.length > 0 ? (
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {recentSearches.map((search) => (
                                            <span
                                                key={search.id}
                                                className="rounded-md border border-[#D8DCE8] px-3 py-2 text-sm text-neutral-600"
                                            >
                                                {search.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-md border border-dashed border-[#D8DCE8] p-4 text-sm text-neutral-600">
                                        No saved searches yet.
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
