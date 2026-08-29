import WorkflowNoteModal from '@/components/modals/workflow-note-modal';
import { Button } from '@/components/ui/button';
import { useResearchCapabilities } from '@/hooks/use-research-capabilities';
import { researchRoutes } from '@/lib/research-routes';
import type { ResearchCapabilities, ResearchWorkflow } from '@/types/models';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type Props = {
    researchId: number;
    status?: string | null;
    capabilities?: Partial<ResearchCapabilities> | null;
    workflow?: ResearchWorkflow | null;
    postingReadiness?: { ready: boolean; missing: string[] } | null;
};

type ModalAction = 'return' | 'archive' | 'restore' | 'requestMetadata' | 'hardDelete' | null;

export default function WorkflowActions({ researchId, status, capabilities, workflow, postingReadiness }: Props) {
    const [modalAction, setModalAction] = useState<ModalAction>(null);
    const [loading, setLoading] = useState(false);

    const can = capabilitiesState;

    const actions = useMemo(() => {
        const list: Array<{ key: string; label: string; variant?: 'default' | 'outline' | 'destructive'; onClick?: () => void; disabled?: boolean }> =
            [];

        // A returned submission belongs to the student until they submit it again.
        // Never fall through to the generic action set for this status.
        if (status === 'returned') {
            return list;
        }

        // Posted entries are view-only in the detail page.
        if (status === 'posted') {
            return list;
        }

        if (normalizedStatus === 'submitted') {
            if (can.canReturnForRevision) {
                list.push({ key: 'return', label: 'Return for Revision', variant: 'outline', onClick: () => setModalAction('return') });
            }
            if (can.canPost) {
                list.push({ key: 'post', label: 'Post to Repository', variant: 'default', onClick: () => submitAction('post') });
            }

            return list;
        }

        if (can.canSubmit && ['draft', 'returned'].includes(status ?? 'draft')) {
            list.push({ key: 'submit', label: 'Submit for review', variant: 'default', onClick: () => submitAction('submit') });
        }

        if (can.canEdit) {
            list.push({
                key: 'edit',
                label: normalizedStatus === 'draft' ? 'Save draft' : 'Save changes',
                variant: 'outline',
                onClick: () => router.visit(researchRoutes.edit(researchId)),
            });
        }

        if (can.canEdit && ['submitted', 'posted'].includes(status ?? 'draft')) {
            list.push({ key: 'view', label: 'View only', variant: 'outline', disabled: true });
        }

        if (status !== 'archived') {
            if (can.canReturnForRevision) {
                list.push({ key: 'return', label: 'Return', variant: 'outline', onClick: () => setModalAction('return') });
            }
            if (can.canPost && status !== 'posted') {
                list.push({ key: 'post', label: 'Post to repository', variant: 'default', onClick: () => submitAction('post') });
            }
            if (can.canArchive) {
                list.push({ key: 'archive', label: 'Archive', variant: 'destructive', onClick: () => setModalAction('archive') });
            }
        }

        if (can.canSendInitialInvitations && !workflow?.isRestoredDraft) {
            list.push({ key: 'invite', label: 'Invite researchers', variant: 'outline', onClick: () => submitAction('invite') });
        }

        if (can.canRestore) {
            list.push({ key: 'restore', label: 'Restore', variant: 'outline', onClick: () => setModalAction('restore') });
        }

        if (can.canHardDelete) {
            list.push({ key: 'hardDelete', label: 'Hard delete', variant: 'destructive', onClick: () => setModalAction('hardDelete') });
        }

        return list;
    }, [can, normalizedStatus, researchId, workflow?.isRestoredDraft]);

    const submitAction = async (action: string) => {
        if (!researchId) return;
        setLoading(true);
        const routeMap: Record<string, string> = {
            submit: researchRoutes.submit(researchId),
            post: researchRoutes.post(researchId),
            invite: researchRoutes.initialInvite(researchId),
        };

        router.post(routeMap[action], {}, { preserveScroll: true });
        setLoading(false);
    };

    const confirmAction = async (note: string, confirmation?: string) => {
        if (!modalAction) return;

        setLoading(true);
        const payload = note ? { note } : {};
        const routeMap: Record<string, string> = {
            return: researchRoutes.return(researchId),
            archive: researchRoutes.archive(researchId),
            restore: researchRoutes.restore(researchId),
            requestMetadata: researchRoutes.return(researchId),
            hardDelete: researchRoutes.hardDelete(researchId),
        };

        const finish = () => {
            setLoading(false);
            setModalAction(null);
        };

        if (modalAction === 'hardDelete') {
            router.delete(routeMap.hardDelete, { reason: note, confirmation: confirmation ?? 'DELETE' }, { preserveScroll: true, onFinish: finish });
        } else {
            router.post(routeMap[modalAction], payload, { preserveScroll: true, onFinish: finish });
        }
    };

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                    <Button
                        key={action.key}
                        type="button"
                        variant={action.variant ?? 'outline'}
                        onClick={action.onClick}
                        disabled={loading || action.disabled}
                    >
                        {action.label}
                    </Button>
                ))}
                {postingReadiness && !postingReadiness.ready && (
                    <div className="w-full text-sm text-muted-foreground">Missing: {postingReadiness.missing.join(', ')}</div>
                )}
            </div>
            <WorkflowNoteModal
                open={Boolean(modalAction)}
                onOpenChange={(open) => !open && setModalAction(null)}
                action={modalAction}
                onConfirm={confirmAction}
                isLoading={loading}
            />
        </>
    );
}
