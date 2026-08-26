import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';

interface RequestRow {
    id: number;
    status: string;
    file_type: string;
    research_title: string;
    requester_name: string | null;
    requester_email: string | null;
    lead_consent_received: boolean;
    requested_at: string | null;
}

interface Props {
    queue: 'adviser' | 'staff';
    requests: RequestRow[];
}

export default function FileAccessRequests({ queue, requests }: Props) {
    return (
        <AppLayout>
            <Head title={queue === 'staff' ? 'Staff Access Requests' : 'Adviser Access Requests'} />
            <main className="space-y-6 p-6">
                <h1 className="text-xl font-semibold">{queue === 'staff' ? 'Escalated file access requests' : 'File access requests'}</h1>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-left text-sm">
                        <thead><tr className="border-b bg-muted/40"><th className="p-3">Request</th><th className="p-3">Research</th><th className="p-3">File</th><th className="p-3">Requester</th><th className="p-3">Status</th><th className="p-3">Lead consent</th><th className="p-3" /></tr></thead>
                        <tbody>
                            {requests.map((item) => (
                                <tr key={item.id} className="border-b last:border-0">
                                    <td className="p-3">#{item.id}</td><td className="p-3">{item.research_title}</td><td className="p-3">{item.file_type}</td>
                                    <td className="p-3">{item.requester_name || item.requester_email || 'Unknown'}</td><td className="p-3">{item.status}</td>
                                    <td className="p-3">{item.lead_consent_received ? 'Received' : 'Not received'}</td>
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