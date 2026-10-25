import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getAppearanceSnapshot,
    initializeTheme,
    setAppearance,
    subscribeAppearance,
} from '../../resources/js/hooks/use-appearance.ts';

test('appearance normalizes storage and notifies when the system resolved theme changes', () => {
    let stored = 'invalid';
    const mediaListeners = new Set();
    const storageListeners = new Set();
    const classes = new Set();
    const media = {
        matches: false,
        addEventListener: (event, listener) => {
            if (event === 'change') {
                mediaListeners.add(listener);
            }
        },
        removeEventListener: (event, listener) => {
            if (event === 'change') {
                mediaListeners.delete(listener);
            }
        },
    };
    const root = {
        classList: {
            toggle(name, enabled) {
                if (enabled) {
                    classes.add(name);
                } else {
                    classes.delete(name);
                }
            },
        },
        style: {},
    };
    globalThis.window = {
        localStorage: {
            getItem: () => stored,
            setItem: (_key, value) => {
                stored = value;
            },
        },
        matchMedia: () => media,
        addEventListener: (event, listener) => {
            if (event === 'storage') {
                storageListeners.add(listener);
            }
        },
        removeEventListener: (event, listener) => {
            if (event === 'storage') {
                storageListeners.delete(listener);
            }
        },
    };
    globalThis.document = { documentElement: root, cookie: '' };

    const cleanup = initializeTheme();
    assert.equal(stored, 'system');
    assert.equal(getAppearanceSnapshot().appearance, 'system');
    assert.equal(getAppearanceSnapshot().resolvedAppearance, 'light');
    assert.equal(classes.has('dark'), false);
    assert.equal(getAppearanceSnapshot(), getAppearanceSnapshot());

    let notifications = 0;
    const unsubscribe = subscribeAppearance(() => {
        notifications += 1;
    });
    initializeTheme();
    assert.equal(mediaListeners.size, 1);
    assert.equal(storageListeners.size, 1);

    media.matches = true;

    for (const listener of mediaListeners) {
        listener();
    }

    assert.equal(getAppearanceSnapshot().resolvedAppearance, 'dark');
    assert.equal(classes.has('dark'), true);
    assert.equal(notifications, 1);

    media.matches = false;

    for (const listener of mediaListeners) {
        listener();
    }

    assert.equal(getAppearanceSnapshot().resolvedAppearance, 'light');
    assert.equal(classes.has('dark'), false);
    assert.equal(notifications, 2);

    setAppearance('dark');
    assert.equal(getAppearanceSnapshot().appearance, 'dark');
    assert.equal(notifications, 3);
    media.matches = false;

    for (const listener of mediaListeners) {
        listener();
    }

    assert.equal(getAppearanceSnapshot().resolvedAppearance, 'dark');
    assert.equal(notifications, 3);

    stored = 'light';

    for (const listener of storageListeners) {
        listener({ key: 'appearance', newValue: 'light' });
    }

    assert.equal(getAppearanceSnapshot().appearance, 'light');
    assert.equal(notifications, 4);
    stored = null;

    for (const listener of storageListeners) {
        listener({ key: 'appearance', newValue: null });
    }

    assert.equal(getAppearanceSnapshot().appearance, 'system');
    assert.equal(notifications, 5);

    unsubscribe();
    cleanup();
    assert.equal(mediaListeners.size, 0);
    assert.equal(storageListeners.size, 0);

    globalThis.window.localStorage = {
        getItem() {
            throw new Error('storage unavailable');
        },
        setItem() {
            throw new Error('storage unavailable');
        },
    };
    const cleanupAfterStorageFailure = initializeTheme();
    assert.equal(getAppearanceSnapshot().appearance, 'system');
    setAppearance('light');
    assert.equal(getAppearanceSnapshot().appearance, 'light');
    cleanupAfterStorageFailure();
    const cleanupAfterReinitialize = initializeTheme();
    assert.equal(mediaListeners.size, 1);
    assert.equal(storageListeners.size, 1);
    cleanup();
    assert.equal(mediaListeners.size, 1);
    assert.equal(storageListeners.size, 1);
    cleanupAfterReinitialize();
    assert.equal(mediaListeners.size, 0);
    assert.equal(storageListeners.size, 0);
});
