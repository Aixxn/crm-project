import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { TaskForm } from './_components/task-form';
import type { TaskFormOptions } from './types';

export default function CreateTask(props: TaskFormOptions) {
    return (
        <>
            <Head title="New Task" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-neutral-950">
                        New task
                    </h1>
                </div>
                <TaskForm {...props} />
            </main>
        </>
    );
}

CreateTask.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Tasks', href: '/tasks' },
        { title: 'New task', href: '/tasks/create' },
    ],
};
