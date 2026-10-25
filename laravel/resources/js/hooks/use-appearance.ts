import { useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';
export type AppearanceSnapshot = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
};
export type UseAppearanceReturn = AppearanceSnapshot & {
    readonly updateAppearance: (mode: Appearance) => void;
};

const storageKey = 'appearance';
const mediaQueryText = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();
const serverSnapshot: AppearanceSnapshot = {
    appearance: 'system',
    resolvedAppearance: 'light',
};
let currentAppearance: Appearance = 'system';
let cachedSnapshot: AppearanceSnapshot = serverSnapshot;
let initialized = false;
let activeInitialization = 0;
let media: MediaQueryList | null = null;
let storageHandler: ((event: StorageEvent) => void) | null = null;

function isAppearance(value: string | null): value is Appearance {
    return value === 'light' || value === 'dark' || value === 'system';
}

function resolvedAppearance(mode: Appearance): ResolvedAppearance {
    return mode === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia(mediaQueryText).matches
        ? 'dark'
        : mode === 'dark'
          ? 'dark'
          : 'light';
}

function refreshSnapshot(): boolean {
    const next = {
        appearance: currentAppearance,
        resolvedAppearance: resolvedAppearance(currentAppearance),
    };

    if (
        next.appearance === cachedSnapshot.appearance &&
        next.resolvedAppearance === cachedSnapshot.resolvedAppearance
    ) {
        return false;
    }

    cachedSnapshot = next;

    return true;
}

function notifyIfChanged(): void {
    if (refreshSnapshot()) {
        listeners.forEach((listener) => listener());
    }
}

function applyTheme(): void {
    if (typeof document === 'undefined') {
        return;
    }

    const isDark = resolvedAppearance(currentAppearance) === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
}

function setCookie(value: Appearance): void {
    if (typeof document !== 'undefined') {
        document.cookie = `${storageKey}=${value};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
    }
}

function readStoredAppearance(): string | null {
    try {
        return window.localStorage.getItem(storageKey);
    } catch {
        return null;
    }
}

function storeAppearance(value: Appearance): void {
    try {
        window.localStorage.setItem(storageKey, value);
    } catch {
        return;
    }
}

export function getAppearanceSnapshot(): AppearanceSnapshot {
    return typeof window === 'undefined' ? serverSnapshot : cachedSnapshot;
}

export function subscribeAppearance(listener: () => void): () => void {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

function handleSystemThemeChange(): void {
    applyTheme();
    notifyIfChanged();
}

function handleStorageChange(event: StorageEvent): void {
    if (event.key !== storageKey && event.key !== null) {
        return;
    }

    currentAppearance = isAppearance(event.newValue)
        ? event.newValue
        : 'system';
    applyTheme();
    notifyIfChanged();
}

export function initializeTheme(): () => void {
    if (typeof window === 'undefined') {
        return () => undefined;
    }

    const stored = readStoredAppearance();
    currentAppearance = isAppearance(stored) ? stored : 'system';

    if (stored !== currentAppearance) {
        storeAppearance(currentAppearance);
    }

    if (!stored || !isAppearance(stored)) {
        setCookie(currentAppearance);
    }

    const changed = refreshSnapshot();
    applyTheme();

    if (changed) {
        listeners.forEach((listener) => listener());
    }

    if (initialized) {
        return () => undefined;
    }

    initialized = true;
    const initializationId = ++activeInitialization;
    const registeredMedia = window.matchMedia(mediaQueryText);
    const registeredStorageHandler = handleStorageChange;
    media = registeredMedia;
    storageHandler = registeredStorageHandler;
    registeredMedia.addEventListener('change', handleSystemThemeChange);
    window.addEventListener('storage', registeredStorageHandler);

    return () => {
        if (
            !initialized ||
            activeInitialization !== initializationId ||
            media !== registeredMedia ||
            storageHandler !== registeredStorageHandler
        ) {
            return;
        }

        registeredMedia.removeEventListener('change', handleSystemThemeChange);
        window.removeEventListener('storage', registeredStorageHandler);
        media = null;
        storageHandler = null;
        initialized = false;
    };
}

export function setAppearance(mode: Appearance): void {
    if (typeof window === 'undefined') {
        return;
    }

    currentAppearance = mode;
    storeAppearance(mode);
    setCookie(mode);
    applyTheme();
    notifyIfChanged();
}

export function useAppearance(): UseAppearanceReturn {
    const snapshot = useSyncExternalStore(
        subscribeAppearance,
        getAppearanceSnapshot,
        () => serverSnapshot,
    );

    return { ...snapshot, updateAppearance: setAppearance };
}
