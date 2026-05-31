import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { RelatedEntityOption } from '../../workflow-support';
import type { TaskFormData, TaskFormOptions, TaskStatus, TaskSummary } from '../types';

const statuses: TaskStatus[] = ['Open', 'In Progress', 'Done'];

type TaskFormProps = TaskFormOptions & {
    task?: TaskSummary;
};

export function TaskForm({ task, assignees, relatedEntities }: TaskFormProps) {
    const initialRelated = findRelatedEntity(task, relatedEntities);
    const { data, setData, post, processing, errors } = useForm<TaskFormData>({
        assignee_id: task?.assignee_id ?? assignees[0]?.id ?? '',
        title: task?.title ?? '',
        due_date: task?.due_date ?? '',
        status: task?.status ?? 'Open',
        related_entity_type: task?.related_entity_type ?? initialRelated?.type ?? '',
        related_entity_id: task?.related_entity_id ?? initialRelated?.id ?? '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (task) {
            post(`/tasks/${task.id}?_method=PUT`);

            return;
        }

        post('/tasks');
    };

    const setRelatedEntity = (value: string) => {
        const [type, id] = value.split('|');

        setData((current) => ({
            ...current,
            related_entity_type: type,
            related_entity_id: id,
        }));
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 border-b border-[#C3C6D7]/70 bg-white px-4 py-5 md:grid-cols-2 md:px-6">
                <Field label="Title" error={errors.title}>
                    <Input
                        value={data.title}
                        onChange={(event) => setData('title', event.target.value)}
                    />
                </Field>
                <Field label="Status" error={errors.status}>
                    <Select
                        value={data.status}
                        onValueChange={(value) => setData('status', value as TaskStatus)}
                    >
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label="Assignee" error={errors.assignee_id}>
                    <Select
                        value={String(data.assignee_id)}
                        onValueChange={(value) => setData('assignee_id', Number(value))}
                    >
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                            {assignees.map((assignee) => (
                                <SelectItem key={assignee.id} value={String(assignee.id)}>
                                    {assignee.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label="Due date" error={errors.due_date}>
                    <Input
                        type="date"
                        value={data.due_date}
                        onChange={(event) => setData('due_date', event.target.value)}
                    />
                </Field>
            </div>
            <div className="px-4 md:px-6">
                <Field label="Related record" error={errors.related_entity_id ?? errors.related_entity_type}>
                    <Select
                        value={relatedValue(data.related_entity_type, data.related_entity_id)}
                        onValueChange={setRelatedEntity}
                    >
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select related record" />
                        </SelectTrigger>
                        <SelectContent>
                            {relatedEntities.map((entity) => (
                                <SelectItem key={relatedValue(entity.type, entity.id)} value={relatedValue(entity.type, entity.id)}>
                                    {entity.kind}: {entity.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C3C6D7]/70 bg-white px-4 py-4 md:px-6">
                <Button variant="outline" asChild>
                    <Link href={task ? `/tasks/${task.id}` : '/tasks'}>
                        <ArrowLeft />
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={processing}>
                    <Save />
                    {processing ? 'Saving' : 'Save task'}
                </Button>
            </div>
        </form>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        </div>
    );
}

function relatedValue(type: string, id: string) {
    return `${type}|${id}`;
}

function findRelatedEntity(task: TaskSummary | undefined, options: RelatedEntityOption[]) {
    if (!task) {
        return options[0];
    }

    return options.find(
        (option) => option.type === task.related_entity_type && option.id === task.related_entity_id,
    );
}
