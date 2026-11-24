import CardScreenModal from '@/components/librarian/card-screen-modal';
import ManuscriptPreviewDialog from '@/components/manuscript-preview/manuscript-preview-dialog';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MetadataValue {
    term: string;
    value: string;
    scheme?: string | null;
    sort_order?: number;
}

interface ResearchDetailsPayload {
    id: number;
    status: string | null;
    research_title: string;
    program: { id: number; name: string; code?: string | null } | null;
    completed_month: number | null;
    completed_year: number | null;
    research_abstract: string;
    hardbound_location?: string | null;
    physical_availability?: boolean;
    metadata_values: MetadataValue[];
    has_manuscript: boolean;
    manuscript_unavailable?: boolean;
    panelists_unavailable?: boolean;
    adviser: { id: number; name: string | null } | null;
    researchers: Array<{ id: number; name: string; is_lead_author: boolean }>;
    panelists: Array<{ id: number; name: string }>;
    keywords: Array<{ id: number; keyword_name: string }>;
    agendas: Array<{ id: number; name: string }>;
    sdgs: Array<{ id: number; name: string }>;
    srigs: Array<{ id: number; name: string }>;
    can_download_files: boolean;
    can_view_activity: boolean;
}

interface Props {
    id: number | null;
    onClose: () => void;
    searchTerm?: string;
}

const monthName = (month: number | null) => {
    if (!month) return '';
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
};

export default function ResearchCardScreenModal({ id, onClose, searchTerm }: Props) {
    const [data, setData] = useState<ResearchDetailsPayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const loggedRef = useRef<Record<number, number>>({});

    useEffect(() => {
        if (!id) return;

        let cancelled = false;
        setLoading(true);
        setError(null);
        setData(null);
        setPreviewOpen(false);

        fetch(`/research/${id}/details`, { headers: { Accept: 'application/json' } })
            .then((response) => {
                if (!response.ok) throw new Error('Failed to load details');
                return response.json();
            })
            .then((json) => {
                if (!cancelled) setData(json.data as ResearchDetailsPayload);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load details');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const now = Date.now();
        const last = loggedRef.current[id] ?? 0;
        if (now - last < 5 * 60 * 1000) return;

        const timer = setTimeout(() => {
            const currentLast = loggedRef.current[id] ?? 0;
            if (Date.now() - currentLast < 5 * 60 * 1000) return;
            loggedRef.current[id] = Date.now();
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
            fetch('/api/research-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
                body: JSON.stringify({ research_id: id, action: 'details_view' }),
                credentials: 'same-origin',
            }).catch(() => {
                // Access logging must not block viewing research details.
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [id]);

    const handleDownload = () => {
        if (!data?.can_download_files) return;
        window.location.href = `/research/${data.id}/manuscript`;
    };

    if (!id) return null;

    const researchers = data?.researchers ?? [];
    const completionDate = data ? [monthName(data.completed_month), data.completed_year].filter(Boolean).join(' ') : '';
    const program = data?.program ? [data.program.code, data.program.name].filter(Boolean).join(' – ') : '';
    return (
        <>
            <CardScreenModal
                open={id !== null}
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
                fallbackTitle={data?.research_title ?? ''}
                abstract={data?.research_abstract}
                metadata={data?.metadata_values ?? []}
                abstract={data?.research_abstract}
                creatorNames={researchers.map((researcher) => researcher.name)}
                hardboundLocation={data?.hardbound_location}
                physicalAvailability={data?.physical_availability}
                systemInfo={
                    data
                        ? {
                              completionDate,
                              adviser: data.adviser?.name ?? '',
                              status: data.status,
                              program,
                          }
                        : undefined
                }
                thematicTags={
                    data
                        ? {
                              keywords: data.keywords.map((item) => item.keyword_name),
                              agendas: data.agendas.map((item) => item.name),
                              sdgs: data.sdgs.map((item) => item.name),
                              srigs: data.srigs.map((item) => item.name),
                              panelists: data.panelists.map((item) => item.name),
                          }
                        : undefined
                }
                leadCreatorNames={researchers.filter((researcher) => researcher.is_lead_author).map((researcher) => researcher.name)}
                activity={data ? { researchId: data.id, canView: data.can_view_activity } : undefined}
                loading={loading || (!data && !error)}
                error={error}
                searchTerm={searchTerm}
                extraContent={
                    data ? (
                        <section className="space-y-3 border-t px-6 py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                                        <FileText className="size-4" aria-hidden="true" />
                                        Manuscript Preview
                                    </h3>
                                    {data.has_manuscript ? (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {data.can_download_files
                                                ? 'Preview or download the manuscript, or view the full copy in the library.'
                                                : 'For privacy, only a preview is available; visit the library for the full manuscript.'}
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-sm text-muted-foreground">No manuscript file is available.</p>
                                    )}
                                </div>
                                {data.has_manuscript && (
                                    <div className="flex flex-wrap gap-2">
                                        <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
                                            <Eye className="mr-2 size-4" aria-hidden="true" />
                                            Preview
                                        </Button>
                                        {data.can_download_files && (
                                            <Button type="button" onClick={handleDownload} aria-label="Download Research Manuscript">
                                                <Download className="mr-2 size-4" aria-hidden="true" />
                                                Download
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    ) : null
                }
            />
            {data && <ManuscriptPreviewDialog researchId={data.id} open={previewOpen} onOpenChange={setPreviewOpen} title={data.research_title} />}
        </>
    );
}
