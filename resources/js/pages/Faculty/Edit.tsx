import { useState, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, User, Camera } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { usePermissions } from '@/hooks/use-permissions';
import FacultyPhoto from '@/components/faculty/faculty-photo'; // adjust path to your file

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
    profile_picture?: string | null;
}

interface Props {
    faculty: Faculty;
}

export default function FacultyEdit({ faculty }: Props) {
    const { isAdmin, isFaculty } = usePermissions();
    const { auth } = usePage<{ auth: { user: { faculty_id?: string | null } } }>().props;
    const isFacultySelfEdit = isFaculty() && !isAdmin() && auth.user.faculty_id === faculty.faculty_id;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const { data, setData, put, processing, errors, transform } = useForm({
        faculty_id: faculty.faculty_id,
        first_name: faculty.first_name,
        middle_name: faculty.middle_name || '',
        last_name: faculty.last_name,
        position: faculty.position || '',
        designation: faculty.designation || '',
        email: faculty.email || '',
        orcid: faculty.orcid || '',
        contact_number: faculty.contact_number || '',
        educational_attainment: faculty.educational_attainment || '',
        field_of_specialization: faculty.field_of_specialization || '',
        research_interest: faculty.research_interest || '',
        photo: null as File | null,
    });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic client-side validation
        const maxSizeMb = 2;
        if (!file.type.startsWith('image/')) {
            e.target.value = '';
            return;
        }
        if (file.size > maxSizeMb * 1024 * 1024) {
            e.target.value = '';
            return;
        }

        setData('photo', file);

        const reader = new FileReader();
        reader.onload = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((values) => {
            if (!isFacultySelfEdit) return values;

            const { faculty_id: facultyId, email, ...selfEditableValues } = values;
            void facultyId;
            void email;
            return selfEditableValues;
        });
        // Inertia automatically switches to multipart/form-data (POST + method spoofing)
        // when a File is present in the payload, so put() still works here.
        put(isFacultySelfEdit ? '/faculty/my-profile' : `/faculty/${faculty.id}`, {
            forceFormData: true,
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
        <AppLayout title={`Edit ${getFullName()} - Faculty`}>
            <Head title={`Edit ${getFullName()} - Faculty`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/faculty/${faculty.id}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Return to Faculty
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Faculty Member</h1>
                            <p className="text-muted-foreground">
                                Update information for {getFullName()}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Photo */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Camera className="mr-2 h-5 w-5" />
                                Profile Photo
                            </CardTitle>
                            <CardDescription>
                                Upload a profile photo (JPG or PNG, max 2MB)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                {photoPreview ? (
                                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                                        <img
                                            src={photoPreview}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <FacultyPhoto imageUrl={faculty.profile_picture} size="xl" />
                                )}

                                <div className="space-y-2">
                                    <input
                                        ref={fileInputRef}
                                        id="photo"
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg"
                                        className="hidden"
                                        onChange={handlePhotoChange}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        {photoPreview || faculty.profile_picture ? 'Change Photo' : 'Upload Photo'}
                                    </Button>
                                    {(photoPreview || faculty.profile_picture) && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="ml-2 text-red-500 hover:text-red-600"
                                            onClick={() => {
                                                setData('photo', null);
                                                setPhotoPreview(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                    {errors.photo && (
                                        <p className="text-sm text-red-500">{errors.photo}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="mr-2 h-5 w-5" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Update the basic details of the faculty member
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="faculty_id">Faculty ID *</Label>
                                    <Input
                                        id="faculty_id"
                                        value={data.faculty_id}
                                        onChange={(e) => setData('faculty_id', e.target.value)}
                                        disabled={isFacultySelfEdit}
                                        placeholder="e.g., F2024-001"
                                        className={errors.faculty_id ? 'border-red-500' : ''}
                                    />
                                    {errors.faculty_id && (
                                        <p className="text-sm text-red-500">{errors.faculty_id}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="position">Position</Label>
                                    <Input
                                        id="position"
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        placeholder="e.g., Professor, Instructor, Lecturer"
                                        className={errors.position ? 'border-red-500' : ''}
                                    />
                                    {errors.position && (
                                        <p className="text-sm text-red-500">{errors.position}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name *</Label>
                                    <Input
                                        id="first_name"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        placeholder="First name"
                                        className={errors.first_name ? 'border-red-500' : ''}
                                    />
                                    {errors.first_name && (
                                        <p className="text-sm text-red-500">{errors.first_name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="middle_name">Middle Name</Label>
                                    <Input
                                        id="middle_name"
                                        value={data.middle_name}
                                        onChange={(e) => setData('middle_name', e.target.value)}
                                        placeholder="Middle name (optional)"
                                    />
                                    {errors.middle_name && (
                                        <p className="text-sm text-red-500">{errors.middle_name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name *</Label>
                                    <Input
                                        id="last_name"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        placeholder="Last name"
                                        className={errors.last_name ? 'border-red-500' : ''}
                                    />
                                    {errors.last_name && (
                                        <p className="text-sm text-red-500">{errors.last_name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="designation">Designation</Label>
                                    <Input
                                        id="designation"
                                        value={data.designation}
                                        onChange={(e) => setData('designation', e.target.value)}
                                        placeholder="e.g., Department Head, Program Coordinator"
                                        className={errors.designation ? 'border-red-500' : ''}
                                    />
                                    {errors.designation && (
                                        <p className="text-sm text-red-500">{errors.designation}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="educational_attainment">Educational Attainment</Label>
                                    <Input
                                        id="educational_attainment"
                                        value={data.educational_attainment}
                                        onChange={(e) => setData('educational_attainment', e.target.value)}
                                        placeholder="e.g., PhD, Master of Science, Bachelor of Arts"
                                        className={errors.educational_attainment ? 'border-red-500' : ''}
                                    />
                                    {errors.educational_attainment && (
                                        <p className="text-sm text-red-500">{errors.educational_attainment}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>
                                Update contact details and professional identifiers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        disabled={isFacultySelfEdit}
                                        placeholder="faculty@usep.edu.ph"
                                        className={errors.email ? 'border-red-500' : ''}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-500">{errors.email}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {isFacultySelfEdit ? 'Email changes are managed by an administrator.' : 'Must be a valid USeP email address'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_number">Contact Number</Label>
                                    <Input
                                        id="contact_number"
                                        value={data.contact_number}
                                        onChange={(e) => setData('contact_number', e.target.value)}
                                        placeholder="09XXXXXXXXX or +63 9XXXXXXXXX"
                                        className={errors.contact_number ? 'border-red-500' : ''}
                                    />
                                    {errors.contact_number && (
                                        <p className="text-sm text-red-500">{errors.contact_number}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="orcid">ORCID ID</Label>
                                <Input
                                    id="orcid"
                                    value={data.orcid}
                                    onChange={(e) => setData('orcid', e.target.value)}
                                    placeholder="0000-0000-0000-0000"
                                    className={errors.orcid ? 'border-red-500' : ''}
                                />
                                {errors.orcid && (
                                    <p className="text-sm text-red-500">{errors.orcid}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Your unique ORCID identifier for research activities
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Academic Information</CardTitle>
                            <CardDescription>
                                Update specialization and research interests
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="field_of_specialization">Field of Specialization</Label>
                                <Input
                                    id="field_of_specialization"
                                    value={data.field_of_specialization}
                                    onChange={(e) => setData('field_of_specialization', e.target.value)}
                                    placeholder="e.g., Computer Science, Information Technology"
                                    className={errors.field_of_specialization ? 'border-red-500' : ''}
                                />
                                {errors.field_of_specialization && (
                                    <p className="text-sm text-red-500">{errors.field_of_specialization}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="research_interest">Research Interests</Label>
                                <Textarea
                                    id="research_interest"
                                    value={data.research_interest}
                                    onChange={(e) => setData('research_interest', e.target.value)}
                                    placeholder="Describe your research interests and areas of expertise..."
                                    rows={4}
                                    className={errors.research_interest ? 'border-red-500' : ''}
                                />
                                {errors.research_interest && (
                                    <p className="text-sm text-red-500">{errors.research_interest}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end space-x-4">
                        <Button variant="outline" asChild>
                            <Link href={`/faculty/${faculty.id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Updating...' : 'Update Faculty Member'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}