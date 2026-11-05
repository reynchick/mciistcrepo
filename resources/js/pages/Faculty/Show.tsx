import { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { facultyListRoute } from '@/lib/permissions';

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
    // Photo column: keep whichever name your model/edit form actually uses
    photo_url?: string;
    profile_photo?: string;
    profile_picture?: string;
    photo?: string;
    image?: string;
    avatar?: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    faculty: Faculty;
}

/* ---------- helpers ---------- */

const cardCls = '';

function Field({
    label,
    children,
    className = '',
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`min-w-0 ${className}`}>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="text-base">{children}</div>
        </div>
    );
}

const Empty = ({ text = 'Not provided' }: { text?: string }) => (
    <span className="text-muted-foreground">{text}</span>
);

export default function FacultyShow({ faculty }: Props) {
    // Resolve the session's active role (multi-role login), not the assigned-roles list.
    const { role, isAdmin: isAdminRole } = usePermissions();
    const isAdmin = isAdminRole();
    const canEdit = isAdmin;
    const backToFacultyHref = facultyListRoute(role);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this faculty member? This action cannot be undone.')) {
            router.delete(`/faculty/${faculty.id}`);
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

    const getFullName = () => {
        let name = faculty.first_name;
        if (faculty.middle_name) name += ` ${faculty.middle_name}`;
        name += ` ${faculty.last_name}`;
        return name;
    };

    const initials = `${faculty.first_name?.[0] ?? ''}${faculty.last_name?.[0] ?? ''}`.toUpperCase();

    // Resolve the photo from any likely column name and cache-bust with updated_at
    // so a newly uploaded picture shows immediately after editing.
    const rawPhoto =
        faculty.photo_url ??
        faculty.profile_photo ??
        faculty.profile_picture ??
        faculty.photo ??
        faculty.image ??
        faculty.avatar;

    const photoSrc = (() => {
        if (!rawPhoto) return null;
        const isAbsolute = /^(https?:)?\/\//.test(rawPhoto) || rawPhoto.startsWith('/');
        const base = isAbsolute ? rawPhoto : `/storage/${rawPhoto}`;
        const v = new Date(faculty.updated_at).getTime();
        return `${base}${base.includes('?') ? '&' : '?'}v=${v}`;
    })();

    const [imgFailed, setImgFailed] = useState(false);
    useEffect(() => setImgFailed(false), [photoSrc]);

    const academicTabs = [
        { key: 'education', label: 'Educational Attainment', value: faculty.educational_attainment },
        { key: 'specialization', label: 'Field of Specialization', value: faculty.field_of_specialization },
        { key: 'research', label: 'Research Interests', value: faculty.research_interest },
    ] as const;
    const [academicTab, setAcademicTab] = useState<(typeof academicTabs)[number]['key']>('education');
    const activeAcademic = academicTabs.find((t) => t.key === academicTab) ?? academicTabs[0];

    return (
        <AppLayout title={`${getFullName()} - Faculty Details`}>
            <Head title={`${getFullName()} - Faculty Details`} />

            <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={backToFacultyHref}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Return to Faculty
                        </Link>
                    </Button>
                    <div className="h-8 w-px bg-border" />
                    <h1 className="text-3xl font-bold tracking-tight">
                        Faculty Profile: <span className="text-blue-900 dark:text-blue-300">{getFullName()}</span>
                    </h1>
                </div>

                {/* Left rail: profile + record. Right: basic, contact, academic stacked */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[17rem_minmax(0,1fr)]">
                    {/* Profile picture */}
                    <Card className={`${cardCls} lg:col-start-1 lg:row-start-1 lg:row-span-2`}>
                        <CardContent className="flex h-full flex-col items-center justify-center gap-4 text-center">
                            <div className="h-36 w-36 rounded-full border-2 border-dashed border-muted-foreground/30 p-1.5">
                                {photoSrc && !imgFailed ? (
                                    <img
                                        key={photoSrc}
                                        src={photoSrc}
                                        alt={getFullName()}
                                        onError={() => setImgFailed(true)}
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-3xl font-semibold text-muted-foreground">
                                        {initials}
                                    </div>
                                )}
                            </div>
                            <p className="text-sm font-medium">Profile Picture</p>

                            {isAdmin && (
                                <div className="flex items-center justify-center gap-4">
                                    {canEdit && (
                                        <Button variant="ghost" size="icon" asChild title="Edit" aria-label="Edit faculty" className="hover:bg-transparent">
                                            <Link href={`/faculty/${faculty.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleDelete}
                                        title="Delete"
                                        aria-label="Delete faculty"
                                        className="text-red-600 hover:bg-transparent hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Basic Information */}
                    <Card className={`${cardCls} lg:col-start-2 lg:row-start-1`}>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Field label="Faculty ID">
                                <span className="font-bold">{faculty.faculty_id}</span>
                            </Field>
                            <Field label="Full Name">
                                <span className="font-bold">{getFullName()}</span>
                            </Field>
                            <Field label="Position">
                                {faculty.position ? <Badge variant="secondary">{faculty.position}</Badge> : <Empty text="Not specified" />}
                            </Field>
                            <Field label="Designation" className="sm:col-span-3">
                                {faculty.designation ? (
                                    <Badge variant="outline" className="max-w-full whitespace-normal break-words text-left">
                                        {faculty.designation}
                                    </Badge>
                                ) : (
                                    <Empty text="Not specified" />
                                )}
                            </Field>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card className={`${cardCls} lg:col-start-2 lg:row-start-2`}>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Field label="Email Address">
                                {faculty.email ? (
                                    <a href={`mailto:${faculty.email}`} className="break-all text-blue-600 hover:underline">
                                        {faculty.email}
                                    </a>
                                ) : (
                                    <Empty />
                                )}
                            </Field>
                            <div className="contents">
                                <Field label="Contact Number">
                                    {faculty.contact_number ? (
                                        <a href={`tel:${faculty.contact_number}`} className="hover:underline">
                                            {faculty.contact_number}
                                        </a>
                                    ) : (
                                        <Empty />
                                    )}
                                </Field>
                                <Field label="ORCID ID">
                                    {faculty.orcid ? (
                                        <a
                                            href={`https://orcid.org/${faculty.orcid}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="break-all text-blue-600 hover:underline"
                                        >
                                            {faculty.orcid}
                                        </a>
                                    ) : (
                                        <Empty />
                                    )}
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Information */}
                    <Card className={`${cardCls} lg:col-start-2 lg:row-start-3`}>
                        <CardHeader>
                            <CardTitle>Academic Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Tab bar: full-width baseline, active tab sits on it */}
                            <div role="tablist" className="flex gap-6 border-b">
                                {academicTabs.map((tab) => {
                                    const active = tab.key === academicTab;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setAcademicTab(tab.key)}
                                            className={`-mb-px border-b-2 pb-2 text-sm font-medium transition-colors ${
                                                active
                                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div role="tabpanel" className="pt-4 text-base">
                                {activeAcademic.value || <Empty text="Not specified" />}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Record Information */}
                    <Card className={`${cardCls} lg:col-start-1 lg:row-start-3`}>
                        <CardHeader>
                            <CardTitle>Record Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Field label="Created">
                                <span className="text-sm">{formatDate(faculty.created_at)}</span>
                            </Field>
                            <Field label="Last Updated">
                                <span className="text-sm">{formatDate(faculty.updated_at)}</span>
                            </Field>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}