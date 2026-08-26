import { type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import { Head, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

interface User {
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name: string;
    email: string;
    avatar?: string;
    student_id?: string | null;
}

export default function CompleteProfile({ user }: { user: User }) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
        student_id: user.student_id || '',
        contact_number: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/student/profile/complete');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 sm:p-6">
            <Head title="Complete Profile" />

            <div className="w-full max-w-5xl mx-auto rounded-2xl border border-border bg-background overflow-hidden">
                <form onSubmit={submit} className="flex flex-col lg:flex-row lg:min-h-[560px]">
                    {/* Left panel — context, copy */}
                    <aside className="w-full lg:w-[38%] bg-background p-8 lg:p-10 flex flex-col justify-between lg:border-r border-border">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-3">Complete your profile</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                                Just a few more details to get started.
                            </p>
                        </div>

                        <div className="mt-10 lg:mt-0 flex flex-col items-center">
                            <Button type="submit" disabled={processing} size="lg" className="w-full lg:w-auto min-w-40">
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Complete profile'
                                )}
                            </Button>
                        </div>
                    </aside>

                    {/* Right panel — profile summary + form */}
                    <main className="w-full lg:w-[62%] bg-background p-8 lg:p-10 flex items-center overflow-y-auto">
                        <div className="w-full space-y-8">
                            <Card className="border-border bg-background shadow-none">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <Avatar className="h-14 w-14 ring-2 ring-border shrink-0">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="text-base">
                                                {user.first_name[0]}
                                                {user.last_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{user.email}</p>
                                            <Badge variant="secondary" className="text-xs mt-1.5">
                                                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Verified
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-border">
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            This information is managed by your Google account. Please verify and correct your
                                            name below if needed.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-5">
                                <h3 className="text-sm font-semibold text-foreground">Personal information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <Label htmlFor="first_name" className="text-sm font-medium">
                                            First name
                                        </Label>
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                            placeholder="Justine Mark"
                                            required
                                            disabled={processing}
                                            className="mt-1.5"
                                            aria-invalid={!!errors.first_name}
                                        />
                                        <InputError message={errors.first_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="middle_name" className="text-sm font-medium">
                                            Middle name
                                        </Label>
                                        <Input
                                            id="middle_name"
                                            name="middle_name"
                                            value={data.middle_name}
                                            onChange={(e) => setData('middle_name', e.target.value)}
                                            placeholder="M."
                                            disabled={processing}
                                            className="mt-1.5"
                                            aria-invalid={!!errors.middle_name}
                                        />
                                        <InputError message={errors.middle_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="last_name" className="text-sm font-medium">
                                            Last name
                                        </Label>
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}
                                            placeholder="Lurzano"
                                            required
                                            disabled={processing}
                                            className="mt-1.5"
                                            aria-invalid={!!errors.last_name}
                                        />
                                        <InputError message={errors.last_name} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <Label htmlFor="student_id" className="text-sm font-medium">
                                            Student ID
                                        </Label>
                                        <Input
                                            id="student_id"
                                            name="student_id"
                                            value={data.student_id}
                                            onChange={(e) => setData('student_id', e.target.value)}
                                            placeholder="2023-00800"
                                            pattern="\d{4}-\d{5}"
                                            required
                                            autoFocus
                                            disabled={processing}
                                            className="mt-1.5"
                                            aria-invalid={!!errors.student_id}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1.5">Format: YYYY-NNNNN (e.g., 2023-00800)</p>
                                        <InputError message={errors.student_id} />
                                    </div>

                                    <div>
                                        <Label htmlFor="contact_number" className="text-sm font-medium">
                                            Contact number
                                        </Label>
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
                                </div>
                            </div>
                        </div>
                    </main>
                </form>
            </div>
        </div>
    );
}