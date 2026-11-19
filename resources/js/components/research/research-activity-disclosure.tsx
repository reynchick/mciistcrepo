import StatusHistory from '@/components/research/status-history';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

type Props = {
    researchId: number;
};

export default function ResearchActivityDisclosure({ researchId }: Props) {
    const [expanded, setExpanded] = useState(false);

    return (
        <section className="border-t bg-muted/20 px-6 py-4">
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-fit justify-end gap-2 px-2 py-2 text-sm font-semibold"
                    aria-expanded={expanded}
                    aria-controls={expanded ? `research-activity-${researchId}` : undefined}
                    onClick={() => setExpanded((value) => !value)}
                >
                    <ChevronDown className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                    {expanded ? 'Hide Research Activity' : 'View Research Activity'}
                </Button>
            </div>
            {expanded && (
                <div id={`research-activity-${researchId}`} className="mt-3">
                    <StatusHistory researchId={researchId} capabilities={{ canView: true }} />
                </div>
            )}
        </section>
    );
}
