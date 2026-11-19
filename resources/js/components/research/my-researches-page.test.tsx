import StudentMyResearches from '@/pages/research/my-researches';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    usePage: () => ({ props: {} }),
}));

vi.mock('@/layouts/app/app-layout', () => ({
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/research/status-badge', () => ({
    default: () => null,
}));

vi.mock('@/components/research/research-card-screen-modal', () => ({
    default: ({ id }: { id: number | null }) => (id ? <div data-testid="research-card-screen">{id}</div> : null),
}));

describe('StudentMyResearches', () => {
    it('opens the Card Screen for a linked research entry', () => {
        render(
            <StudentMyResearches
                researches={[
                    {
                        id: 42,
                        research_title: 'Linked posted research',
                        research_abstract: '',
                        status: 'posted',
                        capabilities: { canView: true },
                    },
                ]}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'View' }));

        expect(screen.getByTestId('research-card-screen')).toHaveTextContent('42');
    });
});
