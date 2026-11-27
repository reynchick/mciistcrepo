import LogDetailsModal from '@/components/logs/log-details-modal';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('LogDetailsModal', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders Dublin Core values horizontally without repeating the term property label', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    data: {
                        id: 8,
                        log_type: 'research-entry',
                        created_at: '2026-11-23T08:00:00Z',
                        old_values: {
                            metadata_values: [
                                { term: 'subject', value: 'Old subject', scheme: null },
                                { term: 'publisher', value: 'Old publisher', scheme: 'Local' },
                            ],
                        },
                        new_values: {
                            metadata_values: [
                                { term: 'subject', value: 'New subject', scheme: null },
                                { term: 'publisher', value: 'New publisher', scheme: 'Local' },
                            ],
                        },
                    },
                }),
                { status: 200 },
            ),
        );

        render(<LogDetailsModal logType="research-entry" logId={8} onClose={() => {}} />);

        await screen.findByText('Changes Made');
        const metadataValues = screen.getAllByRole('listitem');
        expect(metadataValues).toHaveLength(4);
        expect(metadataValues[0]).toHaveTextContent('subject: Old subject, scheme: none');
        expect(metadataValues[1]).toHaveTextContent('publisher: Old publisher, scheme: Local');
        expect(metadataValues[2]).toHaveTextContent('subject: New subject, scheme: none');
        expect(metadataValues[3]).toHaveTextContent('publisher: New publisher, scheme: Local');
    });
});
