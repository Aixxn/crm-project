import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { NoteForm } from './_components/note-form';
import type { NoteFormOptions, NoteSummary } from './types';

type EditNoteProps = NoteFormOptions & {
    note: NoteSummary;
};

export default function EditNote({ note, ...options }: EditNoteProps) {
    return (
        <>
            <Head title="Edit Note" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-neutral-950">
                        Edit note
                    </h1>
                </div>
                <NoteForm note={note} {...options} />
            </main>
        </>
    );
}

EditNote.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Notes', href: '/notes' },
        { title: 'Edit note', href: '#' },
    ],
};
