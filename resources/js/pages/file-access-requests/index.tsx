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
    queue: 'adviser' | 'staff' | 'student';
    tab: 'pending' | 'approved';
    requests: RequestRow[];
}

export default function FileAccessRequests({ queue, tab, requests }: Props) {
    const isStaffQueue = queue === 'staff';
    const isStudentQueue = queue === 'student';
    const basePath = isStaffQueue ? '/staff/access-requests' : isStudentQueue ? '/student/access-requests' : '/faculty/access-requests';
    return (
        <AppLayout>
            <Head title={isStaffQueue ? 'Staff Access Requests' : isStudentQueue ? 'Lead Author Requests' : 'Adviser Access Requests'} />
            <main className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold">{isStaffQueue ? 'Escalated file access requests' : isStudentQueue ? 'Lead author access requests' : 'File access requests'}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {isStaffQueue ? 'These requests were escalated because the adviser and lead author did not respond within 7 days.' : isStudentQueue ? 'Review requests for research files where you are the lead author.' : 'Review requests for research files assigned to you as adviser.'}
                    </p>
                </div>
                <nav className="flex w-fit gap-1 rounded-lg border bg-muted/40 p-1" aria-label="Access request status">
                    <Link href={`${basePath}?status=pending`} className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${tab === 'pending' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Pending</Link>
                    <Link href={`${basePath}?status=approved`} className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${tab === 'approved' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Approved</Link>
                </nav>
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
                    {requests.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No {tab} access requests found.</p>}
                </div>
            </main>
        </AppLayout>
    );
}