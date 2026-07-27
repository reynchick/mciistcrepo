import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { type Faculty, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, usePage } from '@inertiajs/react';
import { Textarea } from '@/components/ui/textarea';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import SwitchRoleCard from '@/components/settings/switch-role-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

export default function Profile() {
    const { auth, faculty } = usePage<SharedData & { faculty?: Faculty | null }>().props;
    const isFacultyUser = (auth.user.roles ?? []).some((role) => (role.name ?? '').trim().toLowerCase() === 'faculty');

    const completionFields = [
        Boolean(auth.user.first_name?.trim()),
        Boolean(auth.user.last_name?.trim()),
        Boolean(auth.user.contact_number?.trim()),
        Boolean(faculty?.position?.trim()),
        Boolean(faculty?.designation?.trim()),
        Boolean(faculty?.orcid?.trim()),
        Boolean(faculty?.educational_attainment?.trim()),
        Boolean(faculty?.field_of_specialization?.trim()),
        Boolean(faculty?.research_interest?.trim()),
    ];
    const profileCompletion = isFacultyUser
        ? Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100)
        : 100;

    return (
        <AppLayout>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    {(auth.user.roles ?? []).length > 1 && (
                        <SwitchRoleCard roles={auth.user.roles ?? []} activeRole={auth.activeRole ?? auth.user.role} />
                    )}

                    <HeadingSmall title="Profile information" description="Update your profile information" />

                    {isFacultyUser && (
                        <div className="rounded-lg border border-muted bg-muted/20 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium">Profile completion</p>
                                    <p className="text-sm text-muted-foreground">Complete your faculty profile to unlock all features.</p>
                                </div>
                                <Badge variant="secondary">{profileCompletion}%</Badge>
                            </div>
                            <Progress value={profileCompletion} className="mt-3" />
                        </div>
                    )}

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                {/* Name Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">First Name *</Label>
                                        <Input
                                            id="first_name"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.first_name}
                                            name="first_name"
                                            required
                                            autoComplete="given-name"
                                            placeholder="First name"
                                        />
                                        <InputError className="mt-2" message={errors.first_name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="middle_name">Middle Name</Label>
                                        <Input
                                            id="middle_name"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.middle_name ?? ''}
                                            name="middle_name"
                                            autoComplete="additional-name"
                                            placeholder="Middle name"
                                        />
                                        <InputError className="mt-2" message={errors.middle_name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">Last Name *</Label>
                                        <Input
                                            id="last_name"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.last_name}
                                            name="last_name"
                                            required
                                            autoComplete="family-name"
                                            placeholder="Last name"
                                        />
                                        <InputError className="mt-2" message={errors.last_name} />
                                    </div>
                                </div>

                                {/* Identification Fields (read-only) */}
                                {(auth.user.roles ?? []).some((r) => (r.name ?? '').trim().toLowerCase() === 'student') && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="student_id">Student ID</Label>
                                        <Input
                                            id="student_id"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.student_id ?? ''}
                                            disabled
                                            readOnly
                                            placeholder="2023-00800"
                                        />
                                    </div>
                                )}
                                {(auth.user.roles ?? []).some((r) => (r.name ?? '').trim().toLowerCase() === 'faculty') && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="faculty_id">Faculty ID</Label>
                                        <Input
                                            id="faculty_id"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.faculty_id as string}
                                            disabled
                                            readOnly
                                            placeholder="e.g., USeP-XXXXX"
                                        />
                                    </div>
                                )}

                                {/* Contact Number */}
                                <div className="grid gap-2">
                                    <Label htmlFor="contact_number">Contact Number *</Label>
                                    <Input
                                        id="contact_number"
                                        type="tel"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.contact_number ?? ''}
                                        name="contact_number"
                                        required
                                        autoComplete="tel"
                                        placeholder="09XXXXXXXXX or +63 9XXXXXXXXX"
                                    />
                                    <InputError className="mt-2" message={errors.contact_number} />
                                </div>

                                {isFacultyUser && (
                                    <div className="space-y-6 rounded-lg border border-muted p-6">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-semibold">Professional information</h3>
                                            <p className="text-sm text-muted-foreground">Update your faculty profile details.</p>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="position">Position</Label>
                                                <Input
                                                    id="position"
                                                    className="mt-1 block w-full"
                                                    defaultValue={faculty?.position ?? ''}
                                                    name="position"
                                                    placeholder="e.g., Assistant Professor"
                                                />
                                                <InputError className="mt-2" message={errors.position} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="designation">Designation</Label>
                                                <Input
                                                    id="designation"
                                                    className="mt-1 block w-full"
                                                    defaultValue={faculty?.designation ?? ''}
                                                    name="designation"
                                                    placeholder="e.g., Department Chair"
                                                />
                                                <InputError className="mt-2" message={errors.designation} />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="orcid">ORCID</Label>
                                            <Input
                                                id="orcid"
                                                className="mt-1 block w-full"
                                                defaultValue={faculty?.orcid ?? ''}
                                                name="orcid"
                                                placeholder="0000-0002-1825-0097"
                                            />
                                            <InputError className="mt-2" message={errors.orcid} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="educational_attainment">Educational Attainment</Label>
                                            <Textarea
                                                id="educational_attainment"
                                                className="mt-1 block w-full"
                                                defaultValue={faculty?.educational_attainment ?? ''}
                                                name="educational_attainment"
                                                placeholder="e.g., PhD in Computer Science"
                                                rows={3}
                                            />
                                            <InputError className="mt-2" message={errors.educational_attainment} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="field_of_specialization">Field of Specialization</Label>
                                            <Textarea
                                                id="field_of_specialization"
                                                className="mt-1 block w-full"
                                                defaultValue={faculty?.field_of_specialization ?? ''}
                                                name="field_of_specialization"
                                                placeholder="e.g., Machine Learning, Data Science"
                                                rows={3}
                                            />
                                            <InputError className="mt-2" message={errors.field_of_specialization} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="research_interest">Research Interest</Label>
                                            <Textarea
                                                id="research_interest"
                                                className="mt-1 block w-full"
                                                defaultValue={faculty?.research_interest ?? ''}
                                                name="research_interest"
                                                placeholder="Describe your research interests"
                                                rows={4}
                                            />
                                            <InputError className="mt-2" message={errors.research_interest} />
                                        </div>
                                    </div>
                                )}

                                {/* Email (read-only) */}
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        disabled
                                        readOnly
                                        placeholder="email@usep.edu.ph"
                                    />
                                </div>

                                {/* Roles (read-only) */}
                                <div className="grid gap-2">
                                    <Label>Roles</Label>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {(() => {
                                            const roles = (auth.user.roles ?? []).map((r) => ({
                                                id: r.id,
                                                name: (r.name ?? '').trim(),
                                            }));
                                            if (!roles.length) {
                                                return <Badge variant="outline">No role assigned</Badge>;
                                            }
                                            const variantFor = (roleName: string) => {
                                                const n = roleName.toLowerCase();
                                                if (n === 'administrator') return 'default';
                                                if (n === 'mciis staff') return 'secondary';
                                                if (n === 'faculty') return 'secondary';
                                                if (n === 'student') return 'outline';
                                                return 'secondary';
                                            };
                                            return roles.map((role) => (
                                                <Badge key={role.id} variant={variantFor(role.name) as any}>
                                                    {role.name}
                                                </Badge>
                                            ));
                                        })()}
                                    </div>
                                </div>


                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Save</Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
