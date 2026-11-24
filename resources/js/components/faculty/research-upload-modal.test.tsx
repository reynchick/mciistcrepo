import ResearchUploadModal from '@/components/faculty/research-upload-modal';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Faculty ResearchUploadModal', () => {
    it('allows faculty to mark a manuscript unavailable', () => {
        render(
            <ResearchUploadModal
                open
                programs={[]}
                faculties={[]}
                keywordOptions={[]}
                agendas={[]}
                sdgs={[]}
                srigs={[]}
                currentFaculty={{ id: 1, first_name: 'Faculty', last_name: 'Member' }}
                onClose={() => {}}
                onCreated={() => {}}
            />,
        );

        expect(screen.getByLabelText('Mark as unavailable')).toBeInTheDocument();
    });
});
