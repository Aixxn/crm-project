import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, FileText, Pencil, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import {
    formatDateTime,
    relatedEntityKind,
    relatedEntityLabel,
} from '../workflow-support';
import type { NoteSummary } from './types';

export default function ShowNote({ note }: { note: NoteSummary }) {
    const destroy = () => {
        if (window.confirm('Delete this note?')) {
            router.delete(`/notes/${note.id}`);
        }
    };

    return (
        <>
            <Head title="Note Detail" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-950">
                                Note detail
                            </h1>
                            <p className="mt-1 text-sm text-neutral-600">
                                {formatDateTime(note.created_at)}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/notes">
                                    <ArrowLeft />
                                    Back
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={`/notes/${note.id}/edit`}>
                                    <Pencil />
                                    Edit
                                </Link>
                            </Button>
                            <Button variant="destructive" onClick={destroy}>
                                <Trash2 />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-[2fr_1fr] md:p-6">
                    <section className="rounded-md border border-[#C3C6D7] bg-white p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                            <FileText className="size-4" />
                            Note
                        </div>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-800">
                            {note.body}
                        </p>
                    </section>
                    <aside className="space-y-4">
                        <section className="rounded-md border border-[#C3C6D7] bg-white p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                                <UserRound className="size-4" />
                                Author
                            </div>
                            <div className="mt-3 text-lg font-semibold text-neutral-950">
                                {note.author?.name ?? '-'}
                            </div>
                        </section>
                        <section className="rounded-md border border-[#C3C6D7] bg-white p-4">
                            <div className="text-sm font-medium text-neutral-500">
                                Related {relatedEntityKind(note.related_entity_type)}
                            </div>
                            <div className="mt-3 text-lg font-semibold text-neutral-950">
                                {relatedEntityLabel(
                                    note.related_entity_type,
                                    note.related_entity_id,
                                    [],
                                    note.related_entity,
                                )}
                            </div>
                        </section>
                    </aside>
                </div>
            </main>
        </>
    );
}

ShowNote.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Notes', href: '/notes' },
        { title: 'Note detail', href: '#' },
    ],
};
