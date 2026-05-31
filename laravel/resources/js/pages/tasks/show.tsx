import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Pencil, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import {
    formatDate,
    relatedEntityKind,
    relatedEntityLabel,
    StatusBadge,
} from '../workflow-support';
import type { TaskSummary } from './types';

export default function ShowTask({ task }: { task: TaskSummary }) {
    const destroy = () => {
        if (window.confirm('Delete this task?')) {
            router.delete(`/tasks/${task.id}`);
        }
    };

    return (
        <>
            <Head title={task.title} />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-950">
                                {task.title}
                            </h1>
                            <div className="mt-2">
                                <StatusBadge status={task.status} />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/tasks">
                                    <ArrowLeft />
                                    Back
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={`/tasks/${task.id}/edit`}>
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
                <div className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
                    <section className="rounded-md border border-[#C3C6D7] bg-white p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                            <Calendar className="size-4" />
                            Due date
                        </div>
                        <div className="mt-3 text-lg font-semibold text-neutral-950">
                            {task.due_date ? formatDate(task.due_date) : '-'}
                        </div>
                    </section>
                    <section className="rounded-md border border-[#C3C6D7] bg-white p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                            <UserRound className="size-4" />
                            Assignee
                        </div>
                        <div className="mt-3 text-lg font-semibold text-neutral-950">
                            {task.assignee?.name ?? '-'}
                        </div>
                    </section>
                    <section className="rounded-md border border-[#C3C6D7] bg-white p-4">
                        <div className="text-sm font-medium text-neutral-500">
                            Related {relatedEntityKind(task.related_entity_type)}
                        </div>
                        <div className="mt-3 text-lg font-semibold text-neutral-950">
                            {relatedEntityLabel(
                                task.related_entity_type,
                                task.related_entity_id,
                                [],
                                task.related_entity,
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}

ShowTask.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Tasks', href: '/tasks' },
        { title: 'Task detail', href: '#' },
    ],
};
