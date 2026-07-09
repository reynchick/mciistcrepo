import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import Heading from '@/components/heading';
import HeadingSmall from '@/components/heading-small';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import { Head, useForm } from '@inertiajs/react';
import { Lock, Loader2 } from 'lucide-react';

interface User {
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name: string;
    contact_number?: string;
    email: string;
    avatar?: string;
}

interface Faculty {
    id: number;
    faculty_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    position?: string;
    designation?: string;
    contact_number?: string;
    educational_attainment?: string;
    field_of_specialization?: string;
    research_interest?: string;
    orcid?: string;
}

interface Props {
    user: User;
    faculty: Faculty | null;
}

export default function CompleteFacultyProfile({ user, faculty }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
        position: faculty?.position || '',
        designation: faculty?.designation || '',
        orcid: faculty?.orcid || '',
        contact_number: user.contact_number || faculty?.contact_number || '',
        educational_attainment: faculty?.educational_attainment || '',
        field_of_specialization: faculty?.field_of_specialization || '',
        research_interest: faculty?.research_interest || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/faculty/profile/complete');
    };

    return (
        <AuthSimpleLayout title="Complete Your Faculty Profile" description="Please provide your complete information">
            <Head title="Complete Faculty Profile" />

            <div className="w-full max-w-7xl mx-auto">
                {/* Main Content Area - Two Column Layout */}
                <div className="flex flex-col lg:flex-row lg:gap-10">
                    {/* Left Column - Context & Progress */}
                    <aside className="w-full lg:w-1/3 mb-8 lg:mb-0">
                        <Card className="border-2 border-muted/50 bg-muted/20 dark:bg-slate-900/70 backdrop-blur lg:sticky lg:top-6">
                            <CardHeader className="pb-4 pt-8">
                                <div className="flex items-center gap-2 mb-1">
                                    <Lock className="h-4 w-4 text-muted-foreground/70" />
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Read-only Information</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pb-8">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-12 w-12 ring-2 ring-muted">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="text-base">{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-base mb-0.5">{user.full_name}</p>
                                        <p className="text-xs text-muted-foreground break-all mb-1.5">{user.email}</p>
                                        <Badge variant="secondary" className="text-xs">
                                            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                            </svg>
                                            Verified
                                        </Badge>
                                    </div>
                                </div>
                                
                                {faculty?.faculty_id && (
                                    <div className="pt-4 border-t border-muted/50">
                                        <p className="text-xs text-muted-foreground mb-1">Faculty ID</p>
                                        <p className="font-mono font-semibold text-sm">{faculty.faculty_id}</p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-muted/50">
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Complete your profile to access all features. You can update this information anytime from your profile settings.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Right Column - Main Form */}
                    <main className="w-full lg:w-2/3">
                        <form onSubmit={submit} className="space-y-8">
                            {/* Personal Information Section */}
                            <section className="bg-card rounded-lg border border-muted p-6">
                                <div className="mb-5">
                                    <h3 className="text-lg font-semibold mb-1">Personal Information</h3>
                                    <p className="text-sm text-muted-foreground">Basic details about yourself</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <Label htmlFor="first_name" className="text-sm font-medium">First Name *</Label>
                                        <Input 
                                            id="first_name"
                                            name="first_name"
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                            required
                                            disabled={processing}
                                            className="mt-1.5"
                                            aria-invalid={!!errors.first_name}
                                        />
                                        <InputError message={errors.first_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="middle_name" className="text-sm font-medium">Middle Name</Label>
                                        <Input 
                                            id="middle_name"
                                            name="middle_name"
                                            value={data.middle_name}
                                            onChange={(e) => setData('middle_name', e.target.value)}
                                            disabled={processing}
                                            className="mt-1.5"
                                            aria-invalid={!!errors.middle_name}
                                        />
                                        <InputError message={errors.middle_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="last_name" className="text-sm font-medium">Last Name *</Label>
                                        <Input 
                                            id="last_name"
                                            name="last_name"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}
                                            required
                                            disabled={processing}
                                            className="mt-1.5"
                                            aria-invalid={!!errors.last_name}
                                        />
                                        <InputError message={errors.last_name} />
                                    </div>
                                </div>
                            </section>

                            {/* Professional Information Section */}
                            <section className="bg-card rounded-lg border border-muted p-6">
                                <div className="mb-5">
                                    <h3 className="text-lg font-semibold mb-1">Professional Information</h3>
                                    <p className="text-sm text-muted-foreground">Your academic position and credentials</p>
                                </div>
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <Label htmlFor="position" className="text-sm font-medium">Position *</Label>
                                            <Input 
                                                id="position"
                                                name="position"
                                                value={data.position}
                                                onChange={(e) => setData('position', e.target.value)}
                                                placeholder="e.g., Assistant Professor"
                                                required
                                                disabled={processing}
                                                autoFocus
                                                className="mt-1.5"
                                                aria-invalid={!!errors.position}
                                            />
                                            <InputError message={errors.position} />
                                        </div>

                                        <div>
                                            <Label htmlFor="designation" className="text-sm font-medium">Designation *</Label>
                                            <Input 
                                                id="designation"
                                                name="designation"
                                                value={data.designation}
                                                onChange={(e) => setData('designation', e.target.value)}
                                                placeholder="e.g., Department Chair"
                                                required
                                                disabled={processing}
                                                className="mt-1.5"
                                                aria-invalid={!!errors.designation}
                                            />
                                            <InputError message={errors.designation} />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="orcid" className="text-sm font-medium">ORCID</Label>
                                        <Input 
                                            id="orcid"
                                            name="orcid"
                                            value={data.orcid}
                                            onChange={(e) => setData('orcid', e.target.value)}
                                            placeholder="0000-0002-1825-0097"
                                            disabled={processing}
                                            className="mt-1.5"
                                            aria-invalid={!!errors.orcid}
                                        />
                                        <InputError message={errors.orcid} />
                                    </div>

                                    <div>
                                        <Label htmlFor="educational_attainment" className="text-sm font-medium">Educational Attainment</Label>
                                        <Textarea 
                                            id="educational_attainment"
                                            name="educational_attainment"
                                            value={data.educational_attainment}
                                            onChange={(e) => setData('educational_attainment', e.target.value)}
                                            placeholder="e.g., PhD in Computer Science"
                                            rows={3}
                                            disabled={processing}
                                            className="resize-none max-h-24 overflow-y-auto mt-1.5"
                                            aria-invalid={!!errors.educational_attainment}
                                        />
                                        <InputError message={errors.educational_attainment} />
                                    </div>

                                    <div>
                                        <Label htmlFor="field_of_specialization" className="text-sm font-medium">Field of Specialization</Label>
                                        <Textarea 
                                            id="field_of_specialization"
                                            name="field_of_specialization"
                                            value={data.field_of_specialization}
                                            onChange={(e) => setData('field_of_specialization', e.target.value)}
                                            placeholder="e.g., Machine Learning, Data Science, Artificial Intelligence"
                                            rows={3}
                                            disabled={processing}
                                            className="resize-none max-h-24 overflow-y-auto"
                                            aria-invalid={!!errors.field_of_specialization}
                                        />
                                        <InputError message={errors.field_of_specialization} />
                                    </div>
                                </div>
                            </section>

                            {/* Research Interests Section */}
                            <section className="bg-card rounded-lg border border-muted p-6">
                                <div className="mb-5">
                                    <h3 className="text-lg font-semibold mb-1">Research Interests</h3>
                                    <p className="text-sm text-muted-foreground">Describe your areas of research focus</p>
                                </div>
                                <div>
                                    <Label htmlFor="research_interest" className="text-sm font-medium">Research Interests</Label>
                                    <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">List your research interests and areas of expertise</p>
                                    <Textarea 
                                        id="research_interest"
                                        name="research_interest"
                                        value={data.research_interest}
                                        onChange={(e) => setData('research_interest', e.target.value)}
                                        placeholder="Describe your research interests, focus areas, and expertise..."
                                        disabled={processing}
                                        rows={4}
                                        className="resize-none max-h-32 overflow-y-auto"
                                        aria-invalid={!!errors.research_interest}
                                    />
                                    <InputError message={errors.research_interest} />
                                </div>
                            </section>

                            {/* Contact Information Section */}
                            <section className="bg-card rounded-lg border border-muted p-6">
                                <div className="mb-5">
                                    <h3 className="text-lg font-semibold mb-1">Contact Information</h3>
                                    <p className="text-sm text-muted-foreground">How can we reach you?</p>
                                </div>
                                <div className="max-w-sm">
                                    <Label htmlFor="contact_number" className="text-sm font-medium">Contact Number</Label>
                                    <Input 
                                        id="contact_number"
                                        name="contact_number"
                                        value={data.contact_number}
                                        onChange={(e) => setData('contact_number', e.target.value)}
                                        placeholder="09123456789"
                                        disabled={processing}
                                        className="mt-1.5"
                                        aria-invalid={!!errors.contact_number}
                                    />
                                    <InputError message={errors.contact_number} />
                                </div>
                            </section>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={processing}
                                    size="lg"
                                    className="min-w-40"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Complete Profile'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </main>
                </div>
            </div>
        </AuthSimpleLayout>
    );
}