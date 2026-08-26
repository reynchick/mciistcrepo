import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock3, FileText, Info, ShieldCheck, UserRound, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    request: {
        id: number;
        status: string;
        file_type: string;
        role: string;
        research_title: string;
        requester_name: string | null;
        requester_email: string | null;
        lead_consent_received: boolean;
        notice?: string;
    };
}

export default function Review({ request }: Props) {
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState<'approve' | 'reject' | null>(null);
    const canAct = request.status !== 'approved' && request.status !== 'rejected' && request.status !== 'expired';
    const isApproved = request.status === 'approved';
    const isRejected = request.status === 'rejected';
    const statusLabel = request.status.replaceAll('_', ' ');

    const submit = (action: 'approve' | 'reject') => {
        setProcessing(action);
        router.post(
            `/file-access-requests/${request.id}/${action}`,
            action === 'reject' ? { reason } : {},
            { preserveScroll: true, onFinish: () => setProcessing(null) },
        );
    };

    return (
        <AppLayout>
            <Head title="Review File Access Request" />
            <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-2 text-sm font-medium text-muted-foreground">Access request #{request.id}</p>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Review file access request</h1>
                        <p className="mt-2 text-muted-foreground">{request.research_title}</p>
                    </div>
                    <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium capitalize ${isApproved ? 'bg-emerald-100 text-emerald-700' : isRejected ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                        {isApproved ? <CheckCircle2 className="h-4 w-4" /> : isRejected ? <XCircle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                        {statusLabel}
                    </span>
                </div>

                {request.notice && (
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span>{request.notice}</span>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <section className="rounded-xl border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 font-semibold"><FileText className="h-5 w-5 text-primary" />Requested file</div>
                        <p className="text-lg font-medium capitalize">{request.file_type.replaceAll('_', ' ')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">The requester is asking to access this research document.</p>
                    </section>
                    <section className="rounded-xl border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 font-semibold"><UserRound className="h-5 w-5 text-primary" />Requester</div>
                        <p className="text-lg font-medium">{request.requester_name || 'USeP user'}</p>
                        <p className="mt-1 break-all text-sm text-muted-foreground">{request.requester_email || 'Email unavailable'}</p>
                    </section>
                </div>

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-primary" />Approval requirements</div>
                    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                        {request.lead_consent_received ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <Info className="mt-0.5 h-5 w-5 text-amber-600" />}
                        <div>
                            <p className="font-medium">Lead author consent: {request.lead_consent_received ? 'Received' : 'Not received'}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Adviser approval is the final decision for this access request.</p>
                        </div>
                    </div>
                </section>

                {canAct && (
                    <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                        <h2 className="font-semibold">Make a decision</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Approve to grant the requester access after the workflow completes, or reject with an explanation.</p>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Button disabled={processing !== null} onClick={() => submit('approve')} className="gap-2">
                                <CheckCircle2 className="h-4 w-4" />{processing === 'approve' ? 'Approving...' : 'Approve request'}
                            </Button>
                            <div className="flex min-w-0 flex-1 gap-2">
                                <input aria-label="Reason for rejection" className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for rejection (optional)" />
                                <Button variant="outline" disabled={processing !== null} onClick={() => submit('reject')} className="gap-2">
                                    <XCircle className="h-4 w-4" />{processing === 'reject' ? 'Rejecting...' : 'Reject'}
                                </Button>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </AppLayout>
    );
}