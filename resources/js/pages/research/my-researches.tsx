import StatusBadge from '@/components/research/status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app/app-layout';
import type { Research } from '@/types';
import type { ResearchCapabilities, ResearchStatus } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';

type ResearchWithCapabilities = Research & {
    status?: ResearchStatus | null;
    revision_note?: string | null;
    capabilities?: Partial<ResearchCapabilities> | null;
};

type Props = {
    researches: Array<ResearchWithCapabilities>;
};

export default function StudentMyResearches({ researches = [] }: Props) {
    return (
        <AppLayout>
            <Head title="My Research" />
            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Research</h1>
                    <p className="text-muted-foreground">View research entries linked to your account. Research records are managed by faculty and staff.</p>
                </div>

                {researches.length === 0 && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            No research entries are linked to your account.
                        </AlertDescription>
                    </Alert>
                )}

                {researches.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {researches.map((research) => <ResearchCard key={research.id} research={research} />)}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function ResearchCard({ research }: { research: ResearchWithCapabilities }) {
    const caps = research.capabilities ?? {};
    const canView = Boolean(caps.canView ?? (caps as Record<string, unknown>).can_view);

    let primaryAction: { label: string; route: string; variant: 'default' | 'outline' } | null = null;

    if (canView) {
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
                {readOnlyReason && (
                    <Alert className="border-amber-200 bg-amber-50 py-2 text-amber-900">
                        <AlertDescription className="text-xs">{readOnlyReason}</AlertDescription>
                    </Alert>
                )}

                {research.status === 'returned' && research.revision_note && (
                    <Alert className="border-blue-200 bg-blue-50 py-2 text-blue-900">
                        <AlertDescription className="text-xs">Revision note: {research.revision_note}</AlertDescription>
                    </Alert>
                )}

                {primaryAction && (
                    <Button
                        onClick={() => router.visit(primaryAction.route)}
                        variant={primaryAction.variant}
                        className="w-full"
                        size="sm"
                    >
                        {primaryAction.label}
                    </Button>
                )}

                {!primaryAction && <div className="py-2 text-center text-xs text-muted-foreground">This research is not available for viewing.</div>}
            </CardContent>
        </Card>
    );
}
