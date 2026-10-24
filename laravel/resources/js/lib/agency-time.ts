export const agencyTimezone = 'Asia/Manila';

export function toAgencyDatetimeLocal(value?: string | null): string {
    if (!value) {
        return '';
    }

    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: agencyTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(new Date(value));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)?.value ?? '';

    return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}`;
}

export function agencyDatetimeToIso(value: string): string {
    return value ? new Date(`${value}+08:00`).toISOString() : '';
}
