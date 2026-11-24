import ResearchUploadModal from '@/components/staff/research-upload-modal';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const props = {
    open: true,
    programs: [],
    faculties: [],
    keywordOptions: [],
    agendas: [],
    sdgs: [],
    srigs: [],
    metadataTerms: ['subject', 'description', 'publisher'],
    onClose: () => {},
    onCreated: () => {},
};

describe('Staff ResearchUploadModal', () => {
    it('shows Dublin Core catalog fields only in librarian mode', () => {
        const { rerender } = render(<ResearchUploadModal {...props} />);

        expect(screen.queryByText('Librarian catalog metadata')).not.toBeInTheDocument();

        rerender(<ResearchUploadModal {...props} librarianMode />);

        expect(screen.getByText('Librarian catalog metadata')).toBeInTheDocument();
        expect(screen.getByText('Title', { exact: true })).toBeInTheDocument();
        expect(screen.getByText('Creator', { exact: true })).toBeInTheDocument();
        expect(screen.getByText('Date', { exact: true })).toBeInTheDocument();
        expect(screen.getByText('Research title')).toBeInTheDocument();
        expect(screen.getByText('Researchers')).toBeInTheDocument();
        expect(screen.getByText('Completion date')).toBeInTheDocument();
        expect(screen.getByText('Library information')).toBeInTheDocument();
    });
});
