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
        action_token?: string | null;
        research_title: string;
        requester_name: string | null;
        requester_email: string | null;
        adviser_name: string | null;
        adviser_email: string | null;
        adviser_email_available: boolean;
        adviser_email_status: string | null;
        lead_name: string | null;
        lead_email: string | null;
        lead_email_available: boolean;
        lead_email_status: string | null;
        lead_consent_received: boolean;
        escalation_reason: string | null;
        contact_warning: string | null;
        notice?: string;
    };
}

export default function Review({ request }: Props) {
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState<'approve' | 'reject' | null>(null);
    const isLeadReviewer = request.role === 'lead';
    const canAct = request.status !== 'approved'
        && request.status !== 'rejected'
        && request.status !== 'expired'
        && !(isLeadReviewer && request.lead_consent_received);
    const isApproved = request.status === 'approved';
    const isRejected = request.status === 'rejected';
    const statusLabel = request.status.replaceAll('_', ' ');

    const submit = (action: 'approve' | 'reject') => {
        setProcessing(action);
        router.post(
            `/file-access-requests/${request.id}/${action}`,
            {
                ...(action === 'reject' ? { reason } : {}),
                ...(request.action_token ? { token: request.action_token } : {}),
            },
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
                    <div className="mb-4 flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-primary" />Approval contacts</div>
                    <div className="grid gap-4 text-sm sm:grid-cols-2">
                        <div><p className="font-medium">Adviser</p><p className="mt-1">{request.adviser_name || 'Not assigned'}</p><p className="text-muted-foreground">{request.adviser_email || 'No email recorded'}{request.adviser_email_status ? ` · ${request.adviser_email_status}` : ''}</p></div>
                        <div><p className="font-medium">Lead author</p><p className="mt-1">{request.lead_name || 'Not available'}</p><p className="text-muted-foreground">{request.lead_email || 'No email recorded'}{request.lead_email_status ? ` · ${request.lead_email_status}` : ''}</p></div>
                    </div>
                </section>

                {request.escalation_reason && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <Info className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>{request.escalation_reason}</span>
                    </div>
                )}

                {request.contact_warning && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                        <Info className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>{request.contact_warning}</span>
                    </div>
                )}

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-primary" />Approval requirements</div>
                    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                        {request.lead_consent_received ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <Info className="mt-0.5 h-5 w-5 text-amber-600" />}
                        <div>
                            <p className="font-medium">
                                                                {isLeadReviewer
                                                                        ? request.lead_consent_received
                                                                                ? 'Your consent: Recorded'
                                                                                : 'Your consent is requested'
                                                                        : request.lead_consent_received
                                                                            ? 'Lead author consent: Received'
                                                                            : request.lead_email_available
                                                                                ? request.lead_email_status === 'failed'
                                                                                        ? 'Lead author notification: Delivery failed'
                                                                                        : 'Lead author email: Delivery not confirmed'
                                                                                : 'Lead author notification: Unavailable'}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                                                {isLeadReviewer
                                                                        ? request.lead_consent_received
                                                                                ? 'You have provided consent. Adviser approval remains the final decision.'
                                                                                : 'Review the request and approve or reject it. Adviser approval remains the final decision.'
                                                                        : request.lead_consent_received
                                                                            ? 'The lead author has provided consent. Adviser approval remains the final decision.'
                                                                            : request.lead_email_available
                                                                                ? request.lead_email_status === 'failed'
                                                                                        ? 'The notification could not be delivered to the recorded lead-author email. Adviser approval remains the final decision.'
                                                                                        : 'The email may not reach the lead author because the address may no longer be active. Adviser approval is still the final decision.'
                                                                                : 'No usable lead-author email is recorded, so consent could not be requested by email. Adviser approval remains the final decision.'}
                            </p>
                        </div>
                    </div>
                </section>

                {canAct && (
                    <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                        <h2 className="font-semibold">{isLeadReviewer ? 'Record your consent' : 'Make a decision'}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{isLeadReviewer ? 'Your response will be recorded for the adviser. Adviser approval remains the final decision.' : 'Approve to grant the requester access after the workflow completes, or reject with an explanation.'}</p>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Button disabled={processing !== null} onClick={() => submit('approve')} className="gap-2">
                                <CheckCircle2 className="h-4 w-4" />{processing === 'approve' ? 'Approving...' : isLeadReviewer ? 'Give consent' : 'Approve request'}
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