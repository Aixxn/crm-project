import assert from 'node:assert/strict';
import test from 'node:test';
import {
    formatDate,
    formatDateTime,
    money,
} from '../../resources/js/lib/format.ts';
import {
    statusPresentation,
    workflowStatusValues,
} from '../../resources/js/lib/workflow-status.ts';

test('workflow status presentation covers each stored status with domain meaning', () => {
    const expected = {
        listing: ['Draft', 'Active', 'Under Offer', 'Closed', 'Closed Lost'],
        inquiry: ['New', 'Contacted', 'Qualified', 'Converted', 'Closed'],
        viewing: [
            'Requested',
            'Scheduled',
            'Completed',
            'No Show',
            'Cancelled',
        ],
        offer: ['Submitted', 'Accepted', 'Rejected', 'Withdrawn'],
        task: ['Open', 'In Progress', 'Done'],
    };

    for (const [domain, statuses] of Object.entries(expected)) {
        assert.deepEqual(workflowStatusValues(domain), statuses);

        for (const status of statuses) {
            assert.equal(statusPresentation(domain, status).label, status);
            assert.notEqual(statusPresentation(domain, status).tone, undefined);
        }
    }

    assert.equal(statusPresentation('listing', 'Closed').tone, 'success');
    assert.equal(statusPresentation('inquiry', 'Closed').tone, 'neutral');
    assert.equal(statusPresentation('viewing', 'Requested').tone, 'warning');
    assert.deepEqual(statusPresentation('offer', 'Legacy Value'), {
        label: 'Legacy Value',
        tone: 'neutral',
    });
    assert.deepEqual(statusPresentation('task', '   '), {
        label: 'Unknown status',
        tone: 'neutral',
    });
    assert.deepEqual(statusPresentation('listing', 'toString'), {
        label: 'toString',
        tone: 'neutral',
    });
    assert.deepEqual(statusPresentation('listing', 'constructor'), {
        label: 'constructor',
        tone: 'neutral',
    });
});

test('formatters handle Manila dates, date-only values, bad input, and PHP amounts', () => {
    assert.equal(formatDate('2026-10-25'), 'Oct 25, 2026');
    assert.equal(formatDate('2026-10-24T16:30:00Z'), 'Oct 25, 2026');
    assert.match(formatDateTime('2026-10-24T16:30:00Z'), /Oct 25, 2026/);
    assert.equal(formatDate('not-a-date'), '-');
    assert.equal(formatDateTime(''), '-');
    assert.equal(money('not-a-number'), '-');
    assert.equal(money(null), '-');
    assert.match(money(0), /₱\s?0/);
    assert.match(money(125000), /₱/);
});
