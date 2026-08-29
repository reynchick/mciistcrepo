import StatusBadge from '@/components/research/status-badge';
import ResearchEditModal from '@/components/staff/research-edit-modal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app/app-layout';
import type { Faculty as FacultyType, Research } from '@/types';
import type { ResearchCapabilities, ResearchStatus } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type ResearchWithCapabilities = Research & {
    status?: ResearchStatus | null;
    revision_note?: string | null;
    capabilities?: Partial<ResearchCapabilities> | null;
};

type Props = {
    researches: Array<ResearchWithCapabilities>;
    programs?: Array<{ id: number; name: string; code?: string | null }>;
    faculties?: FacultyType[];
    keywordOptions?: Array<{ id: number; keyword_name: string }>;
    agendas?: Array<{ id: number; name: string }>;
    sdgs?: Array<{ id: number; name: string }>;
    srigs?: Array<{ id: number; name: string }>;
};

export default function StudentMyResearches({
    researches = [],
    programs = [],
    faculties = [],
    keywordOptions = [],
    agendas = [],
    sdgs = [],
    srigs = [],
}: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [banner, setBanner] = useState<string | null>(null);

    const handleSaved = (title: string) => {
        setEditingId(null);
        setBanner(`"${title}" was updated successfully.`);
        router.reload({ only: ['researches'], preserveScroll: true });
    };

    useEffect(() => {
        if (!banner) return;
        const timer = window.setTimeout(() => setBanner(null), 4000);
        return () => window.clearTimeout(timer);
    }, [banner]);

    return (
        <AppLayout>
            <Head title="My Research" />
            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Research</h1>
                    <p className="text-muted-foreground">Manage your research entries. Archived research is no longer available.</p>
                </div>

                {banner && <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{banner}</div>}

                {/* No Results */}
                {researches.length === 0 && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            You have no research entries yet.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Research Cards */}
                {researches.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {researches.map((research) => (
                            <ResearchCard key={research.id} research={research} onOpenEdit={() => setEditingId(research.id)} />
                        ))}
                    </div>
                )}

            </div>

            <ResearchEditModal
                researchId={editingId}
                programs={programs}
                faculties={faculties}
                keywordOptions={keywordOptions}
                agendas={agendas}
                sdgs={sdgs}
                srigs={srigs}
                onClose={() => setEditingId(null)}
                onSaved={handleSaved}
                disableAdviser
                studentMode
            />
        </AppLayout>
    );
}

function ResearchCard({ research, onOpenEdit }: { research: ResearchWithCapabilities; onOpenEdit: () => void }) {
    const caps = research.capabilities ?? {};
    const canEdit = Boolean(caps.canEdit ?? (caps as Record<string, unknown>).can_edit);
    const canSubmit = Boolean(caps.canSubmit ?? (caps as Record<string, unknown>).can_submit);
    const canView = Boolean(caps.canView ?? (caps as Record<string, unknown>).can_view);
    const editableStudentStatus = research.status === 'returned';

    let primaryAction: { label: string; route?: string; variant: 'default' | 'outline' } | null = null;

    if (canEdit || editableStudentStatus) {
        primaryAction = { label: 'Edit', variant: 'default' };
    } else if (canSubmit) {
        primaryAction = { label: 'Submit for Review', variant: 'default' };
    } else if (canView) {
        primaryAction = {
            label: 'View',
            route: `/research/${research.id}`,
            variant: 'outline',
        };
    }

    const readOnlyReason = (caps.readOnlyReason ?? (caps as Record<string, unknown>).read_only_reason) as string | undefined;

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-2 text-base">{research.research_title}</CardTitle>
                        <CardDescription className="mt-1 text-xs">{research.program?.name ?? '—'}</CardDescription>
                    </div>
                    <StatusBadge status={research.status} className="whitespace-nowrap" />
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4 pb-4">
                {/* Read-only reason if applicable */}
                {readOnlyReason && !canEdit && (
                    <Alert className="border-amber-200 bg-amber-50 py-2 text-amber-900">
                        <AlertDescription className="text-xs">{readOnlyReason}</AlertDescription>
                    </Alert>
                )}

                {research.status === 'returned' && research.revision_note && (
                    <Alert className="border-blue-200 bg-blue-50 py-2 text-blue-900">
                        <AlertDescription className="text-xs">Revision note: {research.revision_note}</AlertDescription>
                    </Alert>
                )}

                {/* Primary action button */}
                {primaryAction && (
                    <Button
                        onClick={() => {
                            if (primaryAction.route) {
                                router.visit(primaryAction.route);
                                return;
                            }

                            onOpenEdit();
                        }}
                        variant={primaryAction.variant}
                        className="w-full"
                        size="sm"
                    >
                        {primaryAction.label}
                    </Button>
                )}

                {/* Fallback message if no action is available */}
                {!primaryAction && <div className="py-2 text-center text-xs text-muted-foreground">No actions available for this research.</div>}
            </CardContent>
        </Card>
    );
}
