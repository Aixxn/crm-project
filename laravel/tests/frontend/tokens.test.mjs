import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function declarations(block) {
    return Object.fromEntries(
        [...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [
            match[1],
            match[2].trim(),
        ]),
    );
}

function resolveColor(name, variables, visited = new Set()) {
    assert.ok(!visited.has(name), `Circular color token ${name}`);
    assert.ok(Object.hasOwn(variables, name), `Missing color token ${name}`);
    visited.add(name);
    const value = variables[name];
    const alias = /^var\((--[\w-]+)\)$/.exec(value);

    return alias ? resolveColor(alias[1], variables, visited) : value;
}

function luminance(color) {
    assert.match(
        color,
        /^#[\da-f]{6}$/i,
        `Expected an sRGB hex primitive, received ${color}`,
    );
    const channels = [1, 3, 5].map(
        (offset) => Number.parseInt(color.slice(offset, offset + 2), 16) / 255,
    );
    const linear = channels.map((channel) =>
        channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4,
    );

    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(first, second) {
    const [darker, lighter] = [luminance(first), luminance(second)].sort(
        (left, right) => left - right,
    );

    return (lighter + 0.05) / (darker + 0.05);
}

test('semantic text, input, and focus token pairs meet contrast targets in both appearances', () => {
    assert.equal(contrast('#000000', '#ffffff'), 21);
    assert.equal(contrast('#ffffff', '#ffffff'), 1);
    const css = readFileSync(
        new URL('../../resources/css/app.css', import.meta.url),
        'utf8',
    );
    const rootBlock = /^:root\s*\{(.*?)^\}/ms.exec(css);
    const darkBlock = /^\.dark\s*\{(.*?)^\}/ms.exec(css);
    assert.ok(rootBlock, 'Light appearance tokens must exist');
    assert.ok(darkBlock, 'Dark appearance tokens must exist');
    const light = declarations(rootBlock[1]);
    const dark = { ...light, ...declarations(darkBlock[1]) };

    for (const [appearance, variables] of Object.entries({ light, dark })) {
        const textPairs = [['--foreground', '--background']];

        for (const name of Object.keys(variables)) {
            const background = name.replace(/-foreground$/, '');

            if (
                name.endsWith('-foreground') &&
                Object.hasOwn(variables, background)
            ) {
textPairs.push([name, background]);
}
        }

        const pairs = textPairs.map(([foreground, background]) => [
            foreground,
            background,
            4.5,
        ]);

        for (const foreground of ['--input', '--ring']) {
            for (const background of ['--card', '--background']) {
pairs.push([foreground, background, 3]);
}
        }

        for (const [foreground, background, target] of pairs) {
            const ratio = contrast(
                resolveColor(foreground, variables),
                resolveColor(background, variables),
            );
            assert.ok(
                ratio >= target,
                `${appearance} ${foreground} on ${background} is ${ratio.toFixed(2)}:1; expected ${target}:1`,
            );
        }
    }
});
