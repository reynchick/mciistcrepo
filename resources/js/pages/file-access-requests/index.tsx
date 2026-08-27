import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';

interface RequestRow {
    id: number;
    status: string;
    file_type: string;
    research_title: string;
    requester_name: string | null;
    requester_email: string | null;
    adviser_name: string | null;
    adviser_email: string | null;
    lead_name: string | null;
    lead_email: string | null;
    lead_consent_received: boolean;
    escalation_reason: string | null;
    requested_at: string | null;
}

interface Props {
    queue: 'adviser' | 'staff';
    requests: RequestRow[];
}

export default function FileAccessRequests({ queue, requests }: Props) {
    const isStaffQueue = queue === 'staff';
    return (
        <AppLayout>
            <Head title={queue === 'staff' ? 'Staff Access Requests' : 'Adviser Access Requests'} />
            <main className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold">{isStaffQueue ? 'Escalated file access requests' : 'File access requests'}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {isStaffQueue ? 'These requests were escalated because the adviser and lead author did not respond within 7 days.' : 'Review requests for research files assigned to you as adviser.'}
                    </p>
                </div>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-left text-sm">
                        <thead><tr className="border-b bg-muted/40"><th className="p-3">Request</th><th className="p-3">Research and adviser</th><th className="p-3">Lead author</th><th className="p-3">Requester</th><th className="p-3">File</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
                        <tbody>
                            {requests.map((item) => (
                                <tr key={item.id} className="border-b last:border-0">
                                    <td className="p-3">#{item.id}</td>
                                    <td className="p-3"><div className="font-medium">{item.research_title}</div><div className="text-xs text-muted-foreground">Adviser: {item.adviser_name || 'Not assigned'}</div></td>
                                    <td className="p-3"><div>{item.lead_name || 'Not available'}</div><div className="text-xs text-muted-foreground">{item.lead_email || 'No email recorded'}</div></td>
                                    <td className="p-3"><div>{item.requester_name || 'Unknown'}</div><div className="text-xs text-muted-foreground">{item.requester_email || 'No email recorded'}</div></td>
                                    <td className="p-3 capitalize">{item.file_type.replaceAll('_', ' ')}</td><td className="p-3 capitalize">{item.status.replaceAll('_', ' ')}</td>
                                    <td className="p-3"><Link className="underline" href={`/file-access-requests/${item.id}/review`}>Review</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </AppLayout>
    );
}