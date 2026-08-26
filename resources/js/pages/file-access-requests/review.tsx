import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Props {
    request: {
        id: number;
        status: string;
        file_type: string;
        role: string;
        research_title: string;
        lead_consent_received: boolean;
    };
}

export default function Review({ request }: Props) {
    const [reason, setReason] = useState('');
    const canAct = request.status !== 'approved' && request.status !== 'rejected' && request.status !== 'expired';

    return (
        <AppLayout>
            <Head title="Review File Access Request" />
            <main className="mx-auto max-w-2xl space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold">Review file access request</h1>
                    <p className="mt-2 text-sm text-muted-foreground">{request.research_title}</p>
                </div>
                <dl className="grid gap-3 text-sm">
                    <div><dt className="font-medium">File</dt><dd>{request.file_type}</dd></div>
                    <div><dt className="font-medium">Status</dt><dd>{request.status}</dd></div>
                    <div><dt className="font-medium">Lead Author consent</dt><dd>{request.lead_consent_received ? 'Received' : 'Not received'}</dd></div>
                </dl>
                {canAct && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <Button onClick={() => router.post(`/file-access-requests/${request.id}/approve`)}>Approve</Button>
                        <div className="flex flex-1 gap-2">
                            <input className="h-9 flex-1 rounded-md border px-3 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for rejection" />
                            <Button variant="outline" onClick={() => router.post(`/file-access-requests/${request.id}/reject`, { reason })}>Reject</Button>
                        </div>
                    </div>
                )}
            </main>
        </AppLayout>
    );
}