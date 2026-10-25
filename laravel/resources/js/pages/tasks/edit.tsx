import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { TaskForm } from './_components/task-form';
import type { TaskFormOptions, TaskSummary } from './types';

type EditTaskProps = TaskFormOptions & {
    task: TaskSummary;
};

export default function EditTask({ task, ...options }: EditTaskProps) {
    return (
        <>
            <Head title={`Edit ${task.title}`} />
            <main className="min-h-full bg-muted">
                <div className="border-b border-border bg-card px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-foreground">
                        Edit task
                    </h1>
                </div>
                <TaskForm task={task} {...options} />
            </main>
        </>
    );
}

EditTask.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Tasks', href: '/tasks' },
        { title: 'Edit task', href: '#' },
    ],
};
