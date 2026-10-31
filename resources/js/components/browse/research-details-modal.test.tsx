import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResearchDetailsModal from '@/components/browse/research-details-modal';

const mockUsePage = vi.hoisted(() => ({
    usePage: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    usePage: mockUsePage.usePage,
}));

const details = {
    data: {
        id: 77,
        status: 'posted',
        research_title: 'Research manuscript title',
        program: { id: 1, name: 'Computer Science', code: 'BSCS' },
        completed_month: 5,
        completed_year: 2025,
        research_abstract: 'Research abstract',
        has_manuscript: true,
        adviser: { id: 2, name: 'Faculty Adviser' },
        researchers: [{ id: 3, name: 'Student Researcher' }],
        panelists: [],
        keywords: [],
        agendas: [],
        sdgs: [],
        srigs: [],
    },
};

function mockPage(user: object | null) {
    mockUsePage.usePage.mockReturnValue({
        props: {
            auth: { user },
            researchStatuses: {
                posted: { label: 'Posted', badge: 'green' },
            },
        },
    });
}

describe('ResearchDetailsModal manuscript access', () => {
    let fetchMock: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
            const url = String(input);
            if (url.endsWith('/details')) {
                return new Response(JSON.stringify(details), { status: 200 });
            }
            if (url.endsWith('/preview')) {
                return new Response(JSON.stringify({ page_count: 2 }), { status: 200 });
            }
            return new Response(null, { status: 404 });
        });
    });

    afterEach(() => {
        fetchMock.mockRestore();
    });

    it('requires sign-in before offering a manuscript preview to a guest', async () => {
        mockPage(null);
        render(<ResearchDetailsModal id={77} onClose={vi.fn()} />);

        expect(await screen.findByText('Research manuscript title')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign in to preview' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Preview' })).not.toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalledWith('/research/77/preview', expect.anything());
    });

    it('opens the watermarked preview and allows page navigation for an authenticated user', async () => {
        mockPage({ id: 1 });
        render(<ResearchDetailsModal id={77} onClose={vi.fn()} />);

        fireEvent.click(await screen.findByRole('button', { name: 'Preview' }));

        expect(await screen.findByText('Watermarked preview. Manuscript downloads are disabled.')).toBeInTheDocument();
        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                '/research/77/preview',
                expect.objectContaining({ credentials: 'same-origin' }),
            );
        });
        expect(await screen.findByAltText('Watermarked manuscript page 1 of 2')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
        expect(await screen.findByAltText('Watermarked manuscript page 2 of 2')).toBeInTheDocument();
    });
});
