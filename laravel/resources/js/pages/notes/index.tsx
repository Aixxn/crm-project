import { Head, Link, router } from '@inertiajs/react';
import { Eye, FileText, Pencil, Plus, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import {
    formatDate,
    Pagination,
    relatedEntityKind,
    relatedEntityLabel,
} from '../workflow-support';
import type { RelatedEntityOption } from '../workflow-support';
import type { PaginatedNotes } from './types';

type NoteIndexProps = {
    notes: PaginatedNotes;
    filters: { related_entity_type?: string };
    relatedEntities: RelatedEntityOption[];
};

export default function NoteIndex({
    notes: paginated,
    filters,
    relatedEntities,
}: NoteIndexProps) {
    const [relatedType, setRelatedType] = useState<string>(
        filters.related_entity_type ?? 'All',
    );
    const relatedKinds = Array.from(
        new Map(relatedEntities.map((item) => [item.type, item.kind])).entries(),
    );
    const applyFilters = () =>
        router.get(
            '/notes',
            {
                related_entity_type:
                    relatedType === 'All' ? undefined : relatedType,
            },
            { preserveState: true, replace: true },
        );

    return (
        <>
            <Head title="Notes" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-950">
                                Notes
                            </h1>
                            <p className="mt-1 text-sm text-neutral-600">
                                {paginated.total} timeline notes linked to CRM records.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/tasks">Tasks</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/notes/create">
                                    <Plus />
                                    New note
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="p-4 md:p-6">
                    <section className="rounded-md border border-[#C3C6D7] bg-white">
                        <div className="grid gap-3 border-b border-[#C3C6D7]/70 p-3 md:grid-cols-[minmax(0,1fr)_auto]">
                            <Select
                                value={relatedType}
                                onValueChange={setRelatedType}
                            >
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Related type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">
                                        All related records
                                    </SelectItem>
                                    {relatedKinds.map(([type, kind]) => (
                                        <SelectItem key={type} value={type}>
                                            {kind}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={applyFilters}>
                                <SlidersHorizontal />
                                Apply
                            </Button>
                        </div>
                        <div className="divide-y divide-[#C3C6D7]/60">
                            {paginated.data.map((note) => (
                                <article
                                    key={note.id}
                                    className="grid gap-4 bg-white p-4 hover:bg-[#FAF8FF] md:grid-cols-[1fr_auto]"
                                >
                                    <div className="flex gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#C3C6D7] bg-[#FAF8FF]">
                                            <FileText className="size-4 text-neutral-700" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline">
                                                    {relatedEntityKind(note.related_entity_type)}
                                                </Badge>
                                                <span className="text-sm text-neutral-600">
                                                    {relatedEntityLabel(
                                                        note.related_entity_type,
                                                        note.related_entity_id,
                                                        relatedEntities,
                                                        note.related_entity,
                                                    )}
                                                </span>
                                            </div>
                                            <p className="mt-2 line-clamp-3 text-sm text-neutral-700">
                                                {note.body}
                                            </p>
                                            <div className="mt-2 text-xs text-neutral-500">
                                                {note.author?.name ?? 'Unknown'} on {formatDate(note.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            asChild
                                            aria-label="View note"
                                        >
                                            <Link href={`/notes/${note.id}`}>
                                                <Eye />
                                            </Link>
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            asChild
                                            aria-label="Edit note"
                                        >
                                            <Link href={`/notes/${note.id}/edit`}>
                                                <Pencil />
                                            </Link>
                                        </Button>
                                    </div>
                                </article>
                            ))}
                        </div>
                        {paginated.data.length === 0 && (
                            <div className="px-4 py-14 text-center text-sm text-neutral-600">
                                No notes match the current filters.
                            </div>
                        )}
                        <Pagination paginated={paginated} />
                    </section>
                </div>
            </main>
        </>
    );
}

NoteIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Notes', href: '/notes' },
    ],
};
