import ActivityTimeline, { type ActivityEvent } from '@/components/user/activity-timeline';

type Props = {
    events: ActivityEvent[];
};

const ACTION_LABELS: Record<string, string> = {
    create_research_entry: 'Research created',
    update_research_entry: 'Research updated',
    post_research_entry: 'Post to Repository',
    archive_research_entry: 'Archived',
    restore_research_entry: 'Restored',
    invite_researchers: 'Legacy researcher invitations',
    reassign_research_adviser: 'Adviser reassigned',
    mark_legacy_unavailable: 'Marked legacy data unavailable',
    request_adviser_metadata: 'Adviser metadata requested',
    hard_delete_research_entry: 'Permanently deleted',
    change_status_research_entry: 'Status changed',
    research_notification_failed: 'Notification failed',
};

export default function ResearchActivityTimeline({ events }: Props) {
    const activeEvents = events.filter(
        (event) => !['submit_research_entry', 'return_research_entry', 'return_research_entry_'].includes(event.action_type),
    );

    return (
        <ActivityTimeline
            events={activeEvents}
            userId={0}
            title="Research Activity — read-only"
            emptyTitle="Research Activity"
            emptyDescription="No research activity recorded yet"
            formatTitle={(event) =>
                `${ACTION_LABELS[event.action_type] ?? event.action_type.replace(/_/g, ' ')} — ${event.research_title ?? 'Research'}`
            }
        />
    );
}
