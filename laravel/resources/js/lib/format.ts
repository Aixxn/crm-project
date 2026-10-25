import type { ContactOption, RelatedEntityOption } from '@/types/workflow';

const agencyTimezone = 'Asia/Manila';

export function contactName(contact: ContactOption | null | undefined): string {
    if (!contact) {
        return '-';
    }

    return `${contact.first_name} ${contact.last_name ?? ''}`.trim();
}

export function money(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const amount = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(amount)) {
        return '-';
    }

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(amount);
}

function validDate(value: string | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const parsed = new Date(dateOnly ? `${value}T12:00:00+08:00` : value);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value: string | null | undefined): string {
    const date = validDate(value);

    if (!date) {
        return '-';
    }

    return new Intl.DateTimeFormat('en-PH', {
        timeZone: agencyTimezone,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
    const date = validDate(value);

    if (!date) {
        return '-';
    }

    return new Intl.DateTimeFormat('en-PH', {
        timeZone: agencyTimezone,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
    }).format(date);
}

export function toDatetimeLocal(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
    );

    return localDate.toISOString().slice(0, 16);
}

export function relatedEntityKind(type: string): string {
    return type.split('\\').pop() ?? type;
}

export function relatedEntityLabel(
    type: string,
    id: string,
    options: RelatedEntityOption[] = [],
    entity?: Record<string, unknown> | null,
): string {
    const option = options.find((item) => item.type === type && item.id === id);

    if (option) {
        return option.label;
    }

    if (entity) {
        if (typeof entity.address === 'string') {
            return entity.address;
        }

        if (typeof entity.first_name === 'string') {
            return `${entity.first_name} ${typeof entity.last_name === 'string' ? entity.last_name : ''}`.trim();
        }

        if (
            typeof entity.amount === 'string' ||
            typeof entity.amount === 'number'
        ) {
            return money(entity.amount);
        }
    }

    return id;
}
