import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { NoteForm } from './_components/note-form';
import type { NoteFormOptions } from './types';

export default function CreateNote(props: NoteFormOptions) {
    return (
        <>
            <Head title="New Note" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-neutral-950">
                        New note
                    </h1>
                </div>
                <NoteForm {...props} />
            </main>
        </>
    );
}

CreateNote.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Notes', href: '/notes' },
        { title: 'New note', href: '/notes/create' },
    ],
};
