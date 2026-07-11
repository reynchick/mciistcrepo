import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Mail, Phone, Globe, User, GraduationCap, BookOpen, Trash2 } from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';
import { SharedData } from '@/types';


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
    created_at: string;
    updated_at: string;
}


interface Props {
    faculty: Faculty;
}


export default function FacultyShow({ faculty }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth.user.roles?.some(role => role.name === 'Administrator') ?? false;
    const isOwnRecord = auth.user.faculty_id === faculty.faculty_id;
    const canEdit = isAdmin || isOwnRecord;
   
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this faculty member? This action cannot be undone.')) {
            router.delete(`/faculty/${faculty.id}`);
        }
    };


    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };


    const getFullName = () => {
        let name = faculty.first_name;
        if (faculty.middle_name) {
            name += ` ${faculty.middle_name}`;
        }
        name += ` ${faculty.last_name}`;
        return name;
    };


    return (
        <AppLayout title={`${getFullName()} - Faculty Details`}>
            <Head title={`${getFullName()} - Faculty Details`} />
           
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/faculty">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Faculty
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{getFullName()}</h1>
                            <p className="text-muted-foreground">
                                Faculty ID: {faculty.faculty_id}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {canEdit && (
                            <Button variant="outline" asChild>
                                <Link href={`/faculty/${faculty.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                        {isAdmin && (
                            <Button variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <User className="mr-2 h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Faculty ID</p>
                                        <p className="text-lg font-semibold">{faculty.faculty_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                                        <p className="text-lg font-semibold">{getFullName()}</p>
                                    </div>
                                </div>
                               
                                <Separator />
                               
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Position</p>
                                        <p className="text-base">
                                            {faculty.position ? (
                                                <Badge variant="secondary">{faculty.position}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">Not specified</span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Designation</p>
                                        <p className="text-base">
                                            {faculty.designation ? (
                                                <Badge variant="outline">{faculty.designation}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">Not specified</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>


                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Phone className="mr-2 h-5 w-5" />
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                                        {faculty.email ? (
                                            <a
                                                href={`mailto:${faculty.email}`}
                                                className="text-blue-600 hover:underline flex items-center"
                                            >
                                                <Mail className="mr-2 h-4 w-4" />
                                                {faculty.email}
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground">Not provided</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                                        {faculty.contact_number ? (
                                            <a
                                                href={`tel:${faculty.contact_number}`}
                                                className="text-blue-600 hover:underline flex items-center"
                                            >
                                                <Phone className="mr-2 h-4 w-4" />
                                                {faculty.contact_number}
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground">Not provided</span>
                                        )}
                                    </div>
                                </div>
                               
                                <Separator />
                               
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">ORCID ID</p>
                                    {faculty.orcid ? (
                                        <a
                                            href={`https://orcid.org/${faculty.orcid}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline flex items-center"
                                        >
                                            <Globe className="mr-2 h-4 w-4" />
                                            {faculty.orcid}
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">Not provided</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>


                        {/* Academic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <GraduationCap className="mr-2 h-5 w-5" />
                                    Academic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Educational Attainment</p>
                                        <p className="text-base">
                                            {faculty.educational_attainment || (
                                                <span className="text-muted-foreground">Not specified</span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Field of Specialization</p>
                                        <p className="text-base">
                                            {faculty.field_of_specialization || (
                                                <span className="text-muted-foreground">Not specified</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                               
                                <Separator />
                               
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Research Interests</p>
                                    <p className="text-base">
                                        {faculty.research_interest ? (
                                            <span className="flex items-start">
                                                <BookOpen className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                                                {faculty.research_interest}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">Not specified</span>
                                        )}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>


                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button className="w-full" asChild>
                                    <Link href={`/faculty/${faculty.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Faculty Member
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="/faculty">
                                        View All Faculty
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>


                        {/* Record Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Record Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                                    <p className="text-sm">{formatDate(faculty.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                    <p className="text-sm">{formatDate(faculty.updated_at)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
