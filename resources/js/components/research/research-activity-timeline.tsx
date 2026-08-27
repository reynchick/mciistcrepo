import ActivityTimeline, { type ActivityEvent } from '@/components/user/activity-timeline';

type Props = {
    events: ActivityEvent[];
};

const ACTION_LABELS: Record<string, string> = {
    create_research_entry: 'Research created',
    update_research_entry: 'Research updated',
    submit_research_entry: 'Submitted for review',
    return_research_entry: 'Returned for revision',
    post_research_entry: 'Posted to repository',
    archive_research_entry: 'Archived',
    restore_research_entry: 'Restored',
    invite_researchers: 'Researchers invited',
};

export default function ResearchActivityTimeline({ events }: Props) {
    return (
        <ActivityTimeline
            events={events}
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
