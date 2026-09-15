import { getStatusBadgeColor, getStatusFilterOptions, getStatusLabel } from '@/lib/research-status';
import { describe, expect, it } from 'vitest';

describe('Research Status Helpers', () => {
    describe('getStatusFilterOptions', () => {
        it('includes the supported statuses for the active workflow', () => {
            const options = getStatusFilterOptions();

            const statusValues = options.map((opt) => opt.value);
            expect(statusValues).toContain('draft');
            expect(statusValues).toContain('submitted');
            expect(statusValues).toContain('returned');
            expect(statusValues).toContain('posted');
            expect(statusValues).toContain('archived');
        });

        it('includes all option in filter', () => {
            const options = getStatusFilterOptions();
            expect(options.some((opt) => opt.value === 'all')).toBe(false);
        });

        it('returns proper labels for each status', () => {
            const options = getStatusFilterOptions();

            const statusMap = Object.fromEntries(options.map((opt) => [opt.value, opt.label]));

            expect(statusMap.draft).toBe('Draft');
            expect(statusMap.submitted).toBe('Submitted for Review');
            expect(statusMap.returned).toBe('Returned for Revision');
            expect(statusMap.posted).toBe('Posted');
            expect(statusMap.archived).toBe('Archived');
        });
    });

    describe('getStatusLabel', () => {
        it('returns labels for the supported statuses', () => {
            expect(getStatusLabel('draft')).toBe('Draft');
            expect(getStatusLabel('submitted')).toBe('Submitted for Review');
            expect(getStatusLabel('returned')).toBe('Returned for Revision');
            expect(getStatusLabel('posted')).toBe('Posted');
            expect(getStatusLabel('archived')).toBe('Archived');
        });

        it('does not let an unrelated context override the status label', () => {
            const label = getStatusLabel('posted', 'staff_metadata_request');
            expect(label).toBe('Posted');
        });

        it('returns Unknown for unrecognized statuses', () => {
            expect(getStatusLabel('unknown_status')).toBe('Unknown Status');
        });

        it('handles null status', () => {
            expect(getStatusLabel(null)).toBe('Unknown');
        });
    });

    describe('getStatusBadgeColor', () => {
        it('returns badge colors for the supported statuses', () => {
            expect(getStatusBadgeColor('draft')).toBe('slate');
            expect(getStatusBadgeColor('submitted')).toBe('amber');
            expect(getStatusBadgeColor('returned')).toBe('rose');
            expect(getStatusBadgeColor('posted')).toBe('green');
            expect(getStatusBadgeColor('archived')).toBe('slate');
        });

        it('returns gray as fallback for unknown status', () => {
            expect(getStatusBadgeColor('unknown')).toBe('gray');
        });

        it('handles null status', () => {
            expect(getStatusBadgeColor(null)).toBe('gray');
        });
    });
});
