import { Head, Link, router } from '@inertiajs/react';
import { CheckSquare, Eye, Pencil, Plus, SlidersHorizontal } from 'lucide-react';
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
    StatusBadge,
} from '../workflow-support';
import type { AgentOption, RelatedEntityOption } from '../workflow-support';
import type { PaginatedTasks, TaskStatus } from './types';

type TaskIndexProps = {
    tasks: PaginatedTasks;
    filters: {
        status?: TaskStatus;
        assignee_id?: string;
        related_entity_type?: string;
    };
    assignees: AgentOption[];
    relatedEntities: RelatedEntityOption[];
};

const statuses: Array<TaskStatus | 'All'> = ['All', 'Open', 'In Progress', 'Done'];

export default function TaskIndex({
    tasks: paginated,
    filters,
    assignees,
    relatedEntities,
}: TaskIndexProps) {
    const [status, setStatus] = useState<string>(filters.status ?? 'All');
    const [assigneeId, setAssigneeId] = useState<string>(
        filters.assignee_id ?? 'All',
    );
    const [relatedType, setRelatedType] = useState<string>(
        filters.related_entity_type ?? 'All',
    );
    const relatedKinds = Array.from(
        new Map(relatedEntities.map((item) => [item.type, item.kind])).entries(),
    );
    const applyFilters = () =>
        router.get(
            '/tasks',
            {
                status: status === 'All' ? undefined : status,
                assignee_id: assigneeId === 'All' ? undefined : assigneeId,
                related_entity_type:
                    relatedType === 'All' ? undefined : relatedType,
            },
            { preserveState: true, replace: true },
        );

    return (
        <>
            <Head title="Tasks" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-950">
                                Tasks
                            </h1>
                            <p className="mt-1 text-sm text-neutral-600">
                                {paginated.total} action items linked to CRM records.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/notes">Notes</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/tasks/create">
                                    <Plus />
                                    New task
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="p-4 md:p-6">
                    <section className="rounded-md border border-[#C3C6D7] bg-white">
                        <div className="grid gap-3 border-b border-[#C3C6D7]/70 p-3 md:grid-cols-[11rem_12rem_minmax(0,1fr)_auto]">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={assigneeId}
                                onValueChange={setAssigneeId}
                            >
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">
                                        All assignees
                                    </SelectItem>
                                    {assignees.map((assignee) => (
                                        <SelectItem
                                            key={assignee.id}
                                            value={String(assignee.id)}
                                        >
                                            {assignee.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[880px] text-left text-sm">
                                <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Task</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Due</th>
                                        <th className="px-4 py-3">Assignee</th>
                                        <th className="px-4 py-3">Related</th>
                                        <th className="px-4 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#C3C6D7]/60">
                                    {paginated.data.map((task) => (
                                        <tr
                                            key={task.id}
                                            className="bg-white hover:bg-[#FAF8FF]"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex gap-3">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#C3C6D7] bg-[#FAF8FF]">
                                                        <CheckSquare className="size-4 text-neutral-700" />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={`/tasks/${task.id}`}
                                                            className="font-medium text-neutral-950 hover:underline"
                                                        >
                                                            {task.title}
                                                        </Link>
                                                        <div className="mt-1 text-xs text-neutral-500">
                                                            Created {formatDate(task.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <StatusBadge status={task.status} />
                                            </td>
                                            <td className="px-4 py-4 text-neutral-700">
                                                {task.due_date ? formatDate(task.due_date) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-neutral-700">
                                                {task.assignee?.name ?? '-'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    <Badge variant="outline">
                                                        {relatedEntityKind(task.related_entity_type)}
                                                    </Badge>
                                                    <div className="text-neutral-700">
                                                        {relatedEntityLabel(
                                                            task.related_entity_type,
                                                            task.related_entity_id,
                                                            relatedEntities,
                                                            task.related_entity,
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        asChild
                                                        aria-label="View task"
                                                    >
                                                        <Link href={`/tasks/${task.id}`}>
                                                            <Eye />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        asChild
                                                        aria-label="Edit task"
                                                    >
                                                        <Link href={`/tasks/${task.id}/edit`}>
                                                            <Pencil />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {paginated.data.length === 0 && (
                            <div className="px-4 py-14 text-center text-sm text-neutral-600">
                                No tasks match the current filters.
                            </div>
                        )}
                        <Pagination paginated={paginated} />
                    </section>
                </div>
            </main>
        </>
    );
}

TaskIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Tasks', href: '/tasks' },
    ],
};
