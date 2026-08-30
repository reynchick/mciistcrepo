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
        Object.defineProperty(global, 'fetch', { writable: true, value: fetchMock });
    });

    it('keeps Submit for Review disabled while the student form is incomplete', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 42,
                    research_title: 'Example Research',
                    program_id: 1,
                    research_adviser: 8,
                    completed_month: null,
                    completed_year: null,
                    research_abstract: '',
                    research_manuscript: null,
                    researchers: [{ id: 1, first_name: 'Ana', middle_name: '', last_name: 'Student', email: 'ana@student.edu' }],
                    keyword_names: ['Education'],
                    panelist_ids: [2],
                    agenda_ids: [1],
                    sdg_ids: [1],
                    srig_ids: [1],
                },
            }),
        });

        render(
            <ResearchEditModal
                researchId={42}
                programs={[{ id: 1, name: 'Information Systems' }]}
                faculties={[
                    { id: 8, first_name: 'Adviser', middle_name: '', last_name: 'Faculty' },
                    { id: 2, first_name: 'Panel', middle_name: '', last_name: 'Member' },
                ]}
                keywordOptions={[{ id: 1, keyword_name: 'Education' }]}
                agendas={[{ id: 1, name: 'Education' }]}
                sdgs={[{ id: 1, name: 'SDG 1' }]}
                srigs={[{ id: 1, name: 'SRIG 1' }]}
                onClose={() => {}}
                onSaved={() => {}}
                studentMode
            />,
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(screen.getByRole('button', { name: /submit for review/i })).toBeDisabled();
    });

    it('shows staff-only Save and Post to Repository actions for a non-posted research', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 42,
                    status: 'submitted',
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

        const { container } = render(
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
        fireEvent.click(screen.getAllByLabelText('Mark as unavailable')[2]);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Post to Repository' })).toBeDisabled());
        const file = new File(['pdf'], 'manuscript.pdf', { type: 'application/pdf' });
        fireEvent.change(container.querySelectorAll('input[type="file"]')[1], { target: { files: [file] } });

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
        expect(screen.getByText('Legacy Posted Research')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Post to Repository' })).toBeDisabled();
    });
});
