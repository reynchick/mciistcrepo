import ResearchEditModal from '@/components/staff/research-edit-modal';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchMock, routerPostMock } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    routerPostMock: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    router: {
        post: routerPostMock,
    },
}));

describe('ResearchEditModal', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        routerPostMock.mockReset();
        Object.defineProperty(globalThis, 'fetch', { writable: true, value: fetchMock });
    });

    it('shows staff-only Save and Post to Repository actions for a non-posted research', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 42,
                    status: 'draft',
                    research_title: 'Example Research',
                    program_id: 1,
                    research_adviser: 8,
                    completed_month: 1,
                    completed_year: 2026,
                    research_abstract: 'Abstract',
                    research_manuscript: null,
                    researchers: [],
                    keyword_names: [],
                    panelist_ids: [],
                    agenda_ids: [],
                    sdg_ids: [],
                    srig_ids: [],
                },
            }),
        });

        render(
            <ResearchEditModal
                researchId={42}
                programs={[{ id: 1, name: 'Information Systems' }]}
                faculties={[]}
                keywordOptions={[]}
                onClose={() => {}}
                onSaved={() => {}}
                staffMode
            />,
        );

        await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument());
        expect(screen.getByRole('button', { name: 'Post to Repository' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Post to Repository' })).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    });

    it('shows derived core values and saves catalog metadata in librarian mode', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 77,
                    status: 'draft',
                    research_title: 'Cataloged Research',
                    program_id: 1,
                    research_adviser: 8,
                    completed_month: 5,
                    completed_year: 2025,
                    research_abstract: 'Core abstract',
                    hardbound_location: 'Shelf A',
                    physical_availability: true,
                    metadata_values: [
                        { term: 'subject', value: 'Additional subject', scheme: 'Example vocabulary', sort_order: 0 },
                        { term: 'description', value: 'Additional note', scheme: null, sort_order: 0 },
                    ],
                    researchers: [{ id: 1, first_name: 'Ana', middle_name: '', last_name: 'Cruz', email: null }],
                    keyword_names: ['Repository'],
                    panelist_ids: [2],
                    agenda_ids: [1],
                    sdg_ids: [1],
                    srig_ids: [1],
                },
            }),
        });

        render(
            <ResearchEditModal
                researchId={77}
                programs={[{ id: 1, name: 'Information Systems' }]}
                faculties={[{ id: 2, first_name: 'Panel', last_name: 'Member' }]}
                keywordOptions={[]}
                agendas={[]}
                sdgs={[]}
                srigs={[]}
                metadataTerms={['subject', 'description', 'publisher']}
                onClose={() => {}}
                onSaved={() => {}}
                librarianMode
            />,
        );

        await waitFor(() => expect(screen.getByText('Librarian catalog metadata')).toBeInTheDocument());
        expect(screen.getByText('Ana Cruz')).toBeInTheDocument();
        expect(screen.getByText('2025-05')).toBeInTheDocument();
        expect(screen.getByText('Research title')).toBeInTheDocument();
        expect(screen.getByText('Researchers')).toBeInTheDocument();
        expect(screen.getByText('Completion date')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Additional subject')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Additional note')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: '+ Add another Subject value' }));
        expect(screen.getAllByPlaceholderText('Catalog value')).toHaveLength(3);

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(routerPostMock).toHaveBeenCalled());
        expect(routerPostMock).toHaveBeenCalledWith(
            '/research/77',
            expect.objectContaining({
                metadata: [
                    { term: 'subject', value: 'Additional subject', scheme: 'Example vocabulary', sort_order: 0 },
                    { term: 'description', value: 'Additional note', scheme: null, sort_order: 0 },
                    { term: 'subject', value: '', scheme: null, sort_order: 1 },
                ],
                hardbound_location: 'Shelf A',
                physical_availability: true,
            }),
            expect.any(Object),
        );
    });

    it('enables posting for a complete persisted Posted record with files', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 104,
                    status: 'posted',
                    research_title: 'Complete Staff Research',
                    program_id: 1,
                    research_adviser: 8,
                    completed_month: 1,
                    completed_year: 2026,
                    research_abstract: 'Abstract',
                    research_manuscript: 'research/manuscripts/complete.pdf',
                    researchers: [{ id: 1, first_name: 'Ana', middle_name: '', last_name: 'Researcher', email: null }],
                    keyword_names: ['Education'],
                    panelist_ids: [2],
                    agenda_ids: [1],
                    sdg_ids: [1],
                    srig_ids: [1],
                    posting_readiness: { ready: true, missing: [] },
                },
            }),
        });

        render(
            <ResearchEditModal
                researchId={104}
                programs={[{ id: 1, name: 'Information Systems' }]}
                faculties={[{ id: 2, first_name: 'Panel', middle_name: '', last_name: 'Member' }]}
                keywordOptions={[{ id: 1, keyword_name: 'Education' }]}
                agendas={[{ id: 1, name: 'Education' }]}
                sdgs={[{ id: 1, name: 'SDG 1' }]}
                srigs={[{ id: 1, name: 'SRIG 1' }]}
                onClose={() => {}}
                onSaved={() => {}}
                staffMode
            />,
        );

        await waitFor(() => expect(screen.getByRole('button', { name: 'Post to Repository' })).toBeEnabled());
    });

    it('enables posting for a complete persisted Posted record using legacy-unavailable markers', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 1,
                    status: 'posted',
                    research_title: 'Legacy Posted Research',
                    program_id: 1,
                    research_adviser: 8,
                    completed_month: 1,
                    completed_year: 2026,
                    research_abstract: 'Abstract',
                    research_manuscript: null,
                    manuscript_unavailable: true,
                    panelists_unavailable: true,
                    researchers: [{ id: 1, first_name: 'Ana', middle_name: '', last_name: 'Researcher', email: null }],
                    keyword_names: ['Education'],
                    panelist_ids: [],
                    agenda_ids: [1],
                    sdg_ids: [1],
                    srig_ids: [1],
                    posting_readiness: { ready: true, missing: [] },
                },
            }),
        });

        render(
            <ResearchEditModal
                researchId={1}
                programs={[{ id: 1, name: 'Information Systems' }]}
                faculties={[]}
                keywordOptions={[{ id: 1, keyword_name: 'Education' }]}
                agendas={[{ id: 1, name: 'Education' }]}
                sdgs={[{ id: 1, name: 'SDG 1' }]}
                srigs={[{ id: 1, name: 'SRIG 1' }]}
                onClose={() => {}}
                onSaved={() => {}}
                staffMode
            />,
        );

        await waitFor(() => expect(screen.getByRole('button', { name: 'Post to Repository' })).toBeEnabled());
    });

    it('re-enables posting when a legacy-unavailable manuscript is replaced by a real file', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 1,
                    status: 'posted',
                    research_title: 'Legacy Posted Research',
                    program_id: 1,
                    research_adviser: 8,
                    completed_month: 1,
                    completed_year: 2026,
                    research_abstract: 'Abstract',
                    research_manuscript: null,
                    manuscript_unavailable: true,
                    panelists_unavailable: true,
                    researchers: [{ id: 1, first_name: 'Ana', middle_name: '', last_name: 'Researcher', email: null }],
                    keyword_names: ['Education'],
                    panelist_ids: [],
                    agenda_ids: [1],
                    sdg_ids: [1],
                    srig_ids: [1],
                    posting_readiness: { ready: true, missing: [] },
                },
            }),
        });

        render(
            <ResearchEditModal
                researchId={1}
                programs={[{ id: 1, name: 'Information Systems' }]}
                faculties={[]}
                keywordOptions={[{ id: 1, keyword_name: 'Education' }]}
                agendas={[{ id: 1, name: 'Education' }]}
                sdgs={[{ id: 1, name: 'SDG 1' }]}
                srigs={[{ id: 1, name: 'SRIG 1' }]}
                onClose={() => {}}
                onSaved={() => {}}
                staffMode
            />,
        );

        await waitFor(() => expect(screen.getByRole('button', { name: 'Post to Repository' })).toBeEnabled());

        // Clear the legacy marker, then provide the real manuscript. This
        // must remain postable; choosing a file must not mark it as removed.
        fireEvent.click(screen.getAllByLabelText('Mark as unavailable')[1]);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Post to Repository' })).toBeDisabled());
        const file = new File(['pdf'], 'manuscript.pdf', { type: 'application/pdf' });
        const manuscriptInput = document.querySelector<HTMLInputElement>('input[type="file"]');
        if (!manuscriptInput) throw new Error('Manuscript file input was not rendered.');
        fireEvent.change(manuscriptInput, { target: { files: [file] } });

        await waitFor(() => expect(screen.getByRole('button', { name: 'Post to Repository' })).toBeEnabled());
    });

    it('requires confirmation before either staff action on a posted research', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 42,
                    status: 'posted',
                    research_title: 'Example Research',
                    program_id: 1,
                    research_adviser: 8,
                    completed_month: 1,
                    completed_year: 2026,
                    research_abstract: 'Abstract',
                    research_manuscript: null,
                    researchers: [],
                    keyword_names: [],
                    panelist_ids: [],
                    agenda_ids: [],
                    sdg_ids: [],
                    srig_ids: [],
                },
            }),
        });

        render(
            <ResearchEditModal
                researchId={42}
                programs={[{ id: 1, name: 'Information Systems' }]}
                faculties={[]}
                keywordOptions={[]}
                onClose={() => {}}
                onSaved={() => {}}
                staffMode
            />,
        );

        await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument());
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(screen.getByText(/Saving will change this research's status to Draft/i)).toBeInTheDocument();
        expect(routerPostMock).not.toHaveBeenCalled();
    });

    it('renders a posted research with legacy null researcher values instead of crashing', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 42,
                    status: 'posted',
                    research_title: 'Legacy Posted Research',
                    program_id: 1,
                    research_adviser: 8,
                    completed_month: 1,
                    completed_year: 2026,
                    research_abstract: 'Abstract',
                    research_manuscript: null,
                    researchers: [{ id: 4, first_name: 'Legacy', middle_name: null, last_name: 'Researcher', email: null }],
                    keyword_names: [],
                    panelist_ids: [],
                    agenda_ids: [],
                    sdg_ids: [],
                    srig_ids: [],
                },
            }),
        });

        render(
            <ResearchEditModal
                researchId={42}
                programs={[{ id: 1, name: 'Information Systems' }]}
                faculties={[]}
                keywordOptions={[]}
                onClose={() => {}}
                onSaved={() => {}}
                staffMode
            />,
        );

        await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument());
        expect(screen.getByDisplayValue('Legacy Posted Research')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Post to Repository' })).toBeDisabled();
    });
});
