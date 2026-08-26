import { Badge } from '@/components/ui/badge';

type ThematicTag = {
    id: number;
    name?: string | null;
};

type Props = {
    agendas?: ThematicTag[] | null;
    sdgs?: ThematicTag[] | null;
    srigs?: ThematicTag[] | null;
    className?: string;
};

const groups = [
    { key: 'agendas', label: 'Agenda', badgeClassName: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200' },
    { key: 'sdgs', label: 'SDG', badgeClassName: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200' },
    { key: 'srigs', label: 'SRIG', badgeClassName: 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-200' },
] as const;

/** Shared read-only rendering for research thematic classifications. */
export default function ThematicDetails({ agendas = [], sdgs = [], srigs = [], className }: Props) {
    const values = { agendas, sdgs, srigs };

    return (
        <section className={className} aria-label="Thematic classifications">
            <h3 className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">Thematic Classifications</h3>
            <dl className="mt-3 grid gap-4 md:grid-cols-3">
                {groups.map(({ key, label, badgeClassName }) => {
                    const tags = (values[key] ?? []).filter((tag) => tag.name?.trim());

                    return (
                        <div key={key}>
                            <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</dt>
                            <dd className="mt-2 flex flex-wrap gap-1.5">
                                {tags.length > 0 ? (
                                    tags.map((tag) => (
                                        <Badge key={tag.id} variant="outline" className={badgeClassName}>
                                            {tag.name}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground">Not set</span>
                                )}
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </section>
    );
}
