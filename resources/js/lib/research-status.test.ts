import { getStatusBadgeColor, getStatusFilterOptions, getStatusLabel } from '@/lib/research-status';
import { describe, expect, it } from 'vitest';

describe('Research Status Helpers', () => {
    describe('getStatusFilterOptions', () => {
        it('includes the supported statuses without the removed invited-draft workflow', () => {
            const options = getStatusFilterOptions();

            const statusValues = options.map((opt) => opt.value);
            expect(statusValues).toContain('draft');
            expect(statusValues).not.toContain('draft_invited');
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
            expect(statusMap.draft_invited).toBe('Draft (Invited)');
            expect(statusMap.submitted).toBe('Submitted for Review');
            expect(statusMap.returned).toBe('Returned for Revision');
            expect(statusMap.posted).toBe('Posted');
            expect(statusMap.archived).toBe('Archived');
        });
    });

    describe('getStatusLabel', () => {
        it('returns labels for the supported statuses without the removed invited-draft status', () => {
            expect(getStatusLabel('draft')).toBe('Draft');
            expect(getStatusLabel('draft_invited')).toBe('Unknown');
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
        it('returns badge colors for the supported statuses without the removed invited-draft status', () => {
            expect(getStatusBadgeColor('draft')).toBe('slate');
            expect(getStatusBadgeColor('draft_invited')).toBe('gray');
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
