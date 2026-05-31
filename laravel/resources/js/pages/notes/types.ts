import type { AgentOption, Paginated, RelatedEntityOption } from '../workflow-support';

export type NoteSummary = {
    id: string;
    author_id: number;
    body: string;
    related_entity_type: string;
    related_entity_id: string;
    author?: AgentOption | null;
    related_entity?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
};

export type PaginatedNotes = Paginated<NoteSummary>;

export type NoteFormData = {
    body: string;
    related_entity_type: string;
    related_entity_id: string;
};

export type NoteFormOptions = {
    relatedEntities: RelatedEntityOption[];
};
