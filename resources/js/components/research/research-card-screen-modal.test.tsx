import ResearchCardScreenModal from '@/components/research/research-card-screen-modal';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Link: 'a',
    usePage: () => ({ props: { auth: { user: { role: 'Student' } } } }),
}));

function createDetails(canDownload: boolean, canViewActivity = false) {
    return {
        data: {
            id: 77,
            status: 'posted',
            research_title: 'Research manuscript title',
            program: { id: 1, name: 'Computer Science', code: 'BSCS' },
            completed_month: 5,
            completed_year: 2025,
            research_abstract: 'Research abstract',
            hardbound_location: 'Library shelf A',
            physical_availability: true,
            metadata_values: [
                { term: 'title', value: 'Research manuscript title', sort_order: 0 },
                { term: 'creator', value: 'Student Researcher', sort_order: 0 },
                { term: 'description', value: 'Research abstract', sort_order: 0 },
                { term: 'identifier', value: '77', scheme: 'local research ID', sort_order: 0 },
            ],
            has_manuscript: true,
            can_download_files: canDownload,
            can_view_activity: canViewActivity,
            adviser: { id: 2, name: 'Faculty Adviser' },
            researchers: [{ id: 3, name: 'Student Researcher', is_lead_author: true }],
            panelists: [],
            keywords: [{ id: 4, keyword_name: 'Machine Learning' }],
            agendas: [],
            sdgs: [],
            srigs: [],
        },
    };
}

describe('ResearchCardScreenModal', () => {
    let fetchMock: ReturnType<typeof vi.spyOn>;
    let details: ReturnType<typeof createDetails>;

    beforeEach(() => {
        details = createDetails(false);
        fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
            const url = String(input);
            if (url.endsWith('/details')) {
                return new Response(JSON.stringify(details), { status: 200 });
            }
            if (url.endsWith('/preview')) {
                return new Response(JSON.stringify({ page_count: 2 }), { status: 200 });
            }
            if (url.endsWith('/status-history')) {
                return new Response(JSON.stringify({ data: [] }), { status: 200 });
            }
            return new Response(null, { status: 404 });
        });
    });

    afterEach(() => {
        fetchMock.mockRestore();
    });

    it('leads with core title and creators, avoids duplicate core metadata, and lets guests preview', async () => {
        render(<ResearchCardScreenModal id={77} onClose={vi.fn()} />);

        expect(await screen.findByRole('heading', { name: 'Research manuscript title' })).toBeInTheDocument();
        expect(screen.getByText('Student Researcher')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Abstract' })).toBeInTheDocument();
        expect(screen.getByText('Research abstract')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Additional catalog metadata' })).not.toBeInTheDocument();
        expect(screen.queryByText('77')).not.toBeInTheDocument();
        const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
        expect(headings.indexOf('Research manuscript title')).toBeLessThan(headings.indexOf('Abstract'));
        expect(headings.indexOf('Abstract')).toBeLessThan(headings.indexOf('Research details'));
        expect(screen.getByText('Library shelf A')).toBeInTheDocument();
        expect(screen.getByText('Preview only.', { exact: false })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Download Research Manuscript' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'View Research Activity' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

        expect(await screen.findByAltText('Watermarked manuscript page 1 of 2')).toBeInTheDocument();
        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/research/77/preview', expect.objectContaining({ credentials: 'same-origin' }));
        });
    });

    it('offers manuscript download only when the details response allows it', async () => {
        details = createDetails(true);
        render(<ResearchCardScreenModal id={77} onClose={vi.fn()} />);

        expect(await screen.findByRole('button', { name: 'Download Research Manuscript' })).toBeInTheDocument();
    });

    it('opens the watermarked preview and allows page navigation', async () => {
        render(<ResearchCardScreenModal id={77} onClose={vi.fn()} />);

        fireEvent.click(await screen.findByRole('button', { name: 'Preview' }));

        expect(await screen.findByText('Watermarked preview. Download access depends on your active role.')).toBeInTheDocument();
        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/research/77/preview', expect.objectContaining({ credentials: 'same-origin' }));
        });
        expect(await screen.findByAltText('Watermarked manuscript page 1 of 2')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
        expect(await screen.findByAltText('Watermarked manuscript page 2 of 2')).toBeInTheDocument();
    });

    it('loads the read-only activity only after expanding the card screen section', async () => {
        details = createDetails(false, true);
        render(<ResearchCardScreenModal id={77} onClose={vi.fn()} />);

        const toggle = await screen.findByRole('button', { name: 'View Research Activity' });
        expect(fetchMock).not.toHaveBeenCalledWith('/research/77/status-history', expect.anything());

        fireEvent.click(toggle);

        await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/research/77/status-history', expect.any(Object)));
        expect(await screen.findByText('Research Activity — read-only')).toBeInTheDocument();
    });
});
