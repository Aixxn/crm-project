import { Head } from '@inertiajs/react';
import { Bell, Lock, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from './_components/public-header';

export default function PublicSettings() {
    return (
        <>
            <Head title="Portal Settings" />
            <main className="min-h-screen bg-[#F7F8FC] text-neutral-950">
                <PublicHeader active="Concierge" />
                <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
                    <h1 className="text-3xl font-semibold">Settings</h1>
                    <p className="mt-2 text-sm text-neutral-600">Profile, search preferences, and notification controls.</p>
                    <div className="mt-6 grid gap-5 lg:grid-cols-[16rem_1fr]">
                        <aside className="rounded-md border border-[#D8DCE8] bg-white p-3">
                            {[
                                ['Profile', UserRound],
                                ['Notifications', Bell],
                                ['Saved searches', Search],
                                ['Security', Lock],
                            ].map(([label, Icon]) => (
                                <button key={String(label)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-blue-50">
                                    <Icon className="size-4 text-blue-700" />
                                    {String(label)}
                                </button>
                            ))}
                        </aside>
                        <div className="space-y-5">
                            <section className="rounded-md border border-[#D8DCE8] bg-white p-5">
                                <h2 className="font-semibold">Profile information</h2>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <input className="rounded-md border border-[#D8DCE8] px-3 py-2 text-sm" placeholder="First name" defaultValue="Alex" />
                                    <input className="rounded-md border border-[#D8DCE8] px-3 py-2 text-sm" placeholder="Last name" defaultValue="Morgan" />
                                    <input className="rounded-md border border-[#D8DCE8] px-3 py-2 text-sm md:col-span-2" placeholder="Email" defaultValue="alex.morgan@example.com" />
                                    <input className="rounded-md border border-[#D8DCE8] px-3 py-2 text-sm md:col-span-2" placeholder="Phone" defaultValue="+63 900 123 4567" />
                                </div>
                                <Button className="mt-4">Save changes</Button>
                            </section>
                            <section className="rounded-md border border-[#D8DCE8] bg-white p-5">
                                <h2 className="font-semibold">Notifications</h2>
                                <div className="mt-4 space-y-3">
                                    {['New listing alerts', 'Price change alerts', 'Viewing reminders', 'Market updates'].map((item) => (
                                        <label key={item} className="flex items-center justify-between rounded-md border border-[#D8DCE8] p-3 text-sm">
                                            {item}
                                            <input type="checkbox" defaultChecked={item !== 'Market updates'} />
                                        </label>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
