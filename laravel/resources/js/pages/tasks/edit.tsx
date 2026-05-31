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
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-neutral-950">
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
