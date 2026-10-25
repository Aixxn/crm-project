import type { LifecycleOperation } from '@/types/lifecycle';
import type { TaskStatus } from '@/types/workflow';
export type { TaskStatus };
import type {
    AgentOption,
    Paginated,
    RelatedEntityOption,
} from '../workflow-support';

export type TaskSummary = {
    id: string;
    assignee_id: number;
    title: string;
    due_date: string | null;
    status: TaskStatus;
    related_entity_type: string;
    related_entity_id: string;
    assignee?: AgentOption | null;
    related_entity?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
};

export type PaginatedTasks = Paginated<TaskSummary>;

export type TaskFormData = {
    operation: LifecycleOperation;
    reason: string;
    assignee_id: number | string;
    title: string;
    due_date: string;
    status: TaskStatus;
    related_entity_type: string;
    related_entity_id: string;
};

export type TaskFormOptions = {
    assignees: AgentOption[];
    relatedEntities: RelatedEntityOption[];
};
