import { Badge } from "@/components/ui/badge";

interface Faculty {
    id: number;
    faculty_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    position?: string;
    designation?: string;
    email?: string;
    orcid?: string;
    contact_number?: string;
    educational_attainment?: string;
    field_of_specialization?: string;
    research_interest?: string;
    profile_photo?: string | null;
}

interface Props {
    faculty: Faculty;
    activeTab: string;
}

/** Splits a comma-separated field value into tag chips. */
function TagList({ value, emptyLabel }: { value?: string; emptyLabel: string }) {
    const tags = value
        ? value
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
        : [];

    if (tags.length === 0) {
        return <span className="text-sm text-gray-500 dark:text-gray-400 italic">{emptyLabel}</span>;
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
                <Badge key={`${tag}-${i}`} variant="secondary" className="font-normal">
                    {tag}
                </Badge>
            ))}
        </div>
    );
}

export default function FacultyDetails({ faculty, activeTab }: Props) {
    const Container = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="py-2">
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {title}
            </h4>
            {children}
        </div>
    );

    if (activeTab === 'education') {
        return (
            <Container title="Educational Attainment">
                <TagList value={faculty.educational_attainment} emptyLabel="Not specified" />
            </Container>
        );
    }

    if (activeTab === 'specialization') {
        return (
            <Container title="Field of Specialization">
                <TagList value={faculty.field_of_specialization} emptyLabel="No specialization listed." />
            </Container>
        );
    }

    if (activeTab === 'research_interest') {
        return (
            <Container title="Research Interests">
                <TagList value={faculty.research_interest} emptyLabel="No research interests listed." />
            </Container>
        );
    }

    return null;
}