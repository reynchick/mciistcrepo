import ResearchReadOnlyBanner from '@/components/research/research-read-only-banner';
import StatusBadge from '@/components/research/status-badge';
import StatusHistory from '@/components/research/status-history';
import WorkflowActions from '@/components/research/workflow-actions';
import AppLayout from '@/layouts/app/app-layout';
import type { Research } from '@/types';
import type { ResearchCapabilities, ResearchWorkflow } from '@/types/models';
import { Head } from '@inertiajs/react';

type Props = {
    research: Research & { status?: string; updated_at?: string; capabilities?: Partial<ResearchCapabilities> };
    capabilities?: Partial<ResearchCapabilities> | null;
    workflow?: ResearchWorkflow | null;
    postingReadiness?: { ready: boolean; missing: string[] } | null;
};

export default function ResearchShowPage({ research, capabilities, workflow, postingReadiness }: Props) {
    const currentStatus = workflow?.status ?? research.status ?? 'draft';
    const researchers =
        (research as Research & { researchers?: Array<{ first_name?: string; middle_name?: string; last_name?: string; email?: string }> })
            .researchers ?? [];
    const keywords = (research as Research & { keywords?: Array<{ keyword_name?: string }> }).keywords ?? [];
    const panelists = research.panelists ?? [];
    const agendas = research.agendas ?? [];
    const sdgs = research.sdgs ?? [];
    const srigs = research.srigs ?? [];

    return (
        <AppLayout title="My Researches">
            <Head title={research.research_title} />
            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{research.research_title}</h1>
                        <p className="text-muted-foreground">Workflow overview and history</p>
                    </div>
                    <StatusBadge status={currentStatus} />
                </div>

                <ResearchReadOnlyBanner capabilities={capabilities} />
                <section className="grid gap-4 rounded-md border p-4 md:grid-cols-2">
                    <div>
                        <h2 className="font-semibold">Research details</h2>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div>
                                <dt className="text-muted-foreground">Title</dt>
                                <dd>{research.research_title}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Program</dt>
                                <dd>{research.program?.name || 'Not provided'}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Adviser</dt>
                                <dd>
                                    {research.adviser
                                        ? [research.adviser.first_name, research.adviser.middle_name, research.adviser.last_name]
                                              .filter(Boolean)
                                              .join(' ')
                                        : 'Not provided'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Abstract</dt>
                                <dd className="whitespace-pre-wrap">{research.research_abstract || 'Not provided'}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Completed</dt>
                                <dd>
                                    {research.completed_month ? `${research.completed_month}/` : ''}
                                    {research.completed_year || 'Not provided'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Documents</dt>
                                <dd className="mt-1 flex flex-wrap gap-3">
                                    {research.research_approval_sheet ? (
                                        <a
                                            className="text-primary underline"
                                            href={`/research/${research.id}/approval-sheet`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View Approval Sheet
                                        </a>
                                    ) : (
                                        <span>
                                            {research.approval_sheet_unavailable ? 'Approval sheet not available' : 'Approval sheet not provided'}
                                        </span>
                                    )}
                                    {research.research_manuscript ? (
                                        <a
                                            className="text-primary underline"
                                            href={`/research/${research.id}/manuscript`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View Manuscript
                                        </a>
                                    ) : (
                                        <span>{research.manuscript_unavailable ? 'Manuscript not available' : 'Manuscript not provided'}</span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <div>
                        <h2 className="font-semibold">Researchers</h2>
                        <ul className="mt-3 space-y-1 text-sm">
                            {researchers.map((researcher, index) => (
                                <li key={index}>{[researcher.first_name, researcher.middle_name, researcher.last_name].filter(Boolean).join(' ')}</li>
                            ))}
                        </ul>
                        <h2 className="mt-4 font-semibold">Keywords</h2>
                        <p className="mt-2 text-sm">
                            {keywords
                                .map((keyword) => keyword.keyword_name)
                                .filter(Boolean)
                                .join(', ') || (research.panelists_unavailable ? 'Not available' : 'None')}
                        </p>
                        <h2 className="mt-4 font-semibold">Panelists</h2>
                        <p className="mt-2 text-sm">
                            {panelists
                                .map((panelist) => [panelist.first_name, panelist.middle_name, panelist.last_name].filter(Boolean).join(' '))
                                .join(', ') || 'None'}
                        </p>
                        <h2 className="mt-4 font-semibold">Agenda, SDG, and SRIG</h2>
                        <p className="mt-2 text-sm">
                            {[...agendas, ...sdgs, ...srigs]
                                .map((item) => item.name)
                                .filter(Boolean)
                                .join(', ') || 'None'}
                        </p>
                    </div>
                </section>
                <WorkflowActions
                    researchId={research.id}
                    status={currentStatus}
                    capabilities={capabilities}
                    workflow={workflow}
                    postingReadiness={postingReadiness}
                />
                <StatusHistory researchId={research.id} capabilities={capabilities} />
            </div>
        </AppLayout>
    );
}
