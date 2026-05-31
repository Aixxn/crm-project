import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { RelatedEntityOption } from '../../workflow-support';
import type { NoteFormData, NoteFormOptions, NoteSummary } from '../types';

type NoteFormProps = NoteFormOptions & {
    note?: NoteSummary;
};

export function NoteForm({ note, relatedEntities }: NoteFormProps) {
    const initialRelated = findRelatedEntity(note, relatedEntities);
    const { data, setData, post, processing, errors } = useForm<NoteFormData>({
        body: note?.body ?? '',
        related_entity_type: note?.related_entity_type ?? initialRelated?.type ?? '',
        related_entity_id: note?.related_entity_id ?? initialRelated?.id ?? '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (note) {
            post(`/notes/${note.id}?_method=PUT`);

            return;
        }

        post('/notes');
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
            <div className="grid gap-4 border-b border-[#C3C6D7]/70 bg-white px-4 py-5 md:px-6">
                <Field
                    label="Related record"
                    error={errors.related_entity_id ?? errors.related_entity_type}
                >
                    <Select
                        value={relatedValue(data.related_entity_type, data.related_entity_id)}
                        onValueChange={setRelatedEntity}
                    >
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select related record" />
                        </SelectTrigger>
                        <SelectContent>
                            {relatedEntities.map((entity) => (
                                <SelectItem
                                    key={relatedValue(entity.type, entity.id)}
                                    value={relatedValue(entity.type, entity.id)}
                                >
                                    {entity.kind}: {entity.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label="Note" error={errors.body}>
                    <textarea
                        value={data.body}
                        onChange={(event) => setData('body', event.target.value)}
                        className="min-h-40 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                </Field>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C3C6D7]/70 bg-white px-4 py-4 md:px-6">
                <Button variant="outline" asChild>
                    <Link href={note ? `/notes/${note.id}` : '/notes'}>
                        <ArrowLeft />
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={processing}>
                    <Save />
                    {processing ? 'Saving' : 'Save note'}
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

function findRelatedEntity(note: NoteSummary | undefined, options: RelatedEntityOption[]) {
    if (!note) {
        return options[0];
    }

    return options.find(
        (option) => option.type === note.related_entity_type && option.id === note.related_entity_id,
    );
}
