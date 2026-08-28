import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InputError from '@/components/input-error';
import { Head, useForm } from '@inertiajs/react';
import { ChevronLeft, Loader2, X } from 'lucide-react';

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

const STEPS = [
    {
        title: 'Confirm your details',
        description: 'Review your account information and add your personal details.',
    },
    {
        title: 'Your professional background',
        description: 'Your position, credentials, and areas of expertise.',
    },
    {
        title: "You're all set!",
        description: 'Review your information below and complete your profile.',
    },
] as const;

/**
 * Renders a value styled like a form input, but non-interactive.
 * Used on the review step so users can see what they entered
 * without being able to edit it there.
 */
function ReviewField({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
            <div
                className={`min-h-9 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm ${
                    value ? 'text-foreground' : 'text-muted-foreground italic'
                }`}
            >
                {value || placeholder || 'Not provided'}
            </div>
        </div>
    );
}

/**
 * Read-only counterpart to TagInput for the review step — renders the
 * comma-separated value as a set of badges instead of plain text.
 */
function ReviewTags({ label, value }: { label: string; value?: string }) {
    const tags = value
        ? value
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
        : [];

    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
            <div className="min-h-9 w-full rounded-md border border-border bg-muted/30 px-3 py-2">
                {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag, i) => (
                            <Badge key={`${tag}-${i}`} variant="secondary" className="font-normal">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground italic">Not provided</span>
                )}
            </div>
        </div>
    );
}

/**
 * A tag/chip input. Backed by a single comma-separated string so it can
 * plug directly into a useForm string field — press Enter or "," to
 * commit the current text as a tag, Backspace on an empty input pops
 * the last tag off.
 */
function TagInput({
    id,
    label,
    required,
    value,
    onChange,
    placeholder,
    disabled,
    error,
    rows = 1,
}: {
    id: string;
    label: string;
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    rows?: number;
}) {
    const [inputValue, setInputValue] = useState('');

    const tags = value
        ? value
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
        : [];

    const commitTag = (raw: string) => {
        const tag = raw.trim();
        setInputValue('');
        if (!tag || tags.includes(tag)) return;
        onChange([...tags, tag].join(', '));
    };

    const removeTag = (index: number) => {
        onChange(tags.filter((_, i) => i !== index).join(', '));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commitTag(inputValue);
        } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    return (
        <div>
            <Label htmlFor={id} className="text-sm font-medium">
                {label}
                {required ? ' *' : ''}
            </Label>
            <div
                className={`mt-1 w-full rounded-md border bg-transparent px-2 py-1.5 flex flex-wrap gap-1.5 items-center focus-within:ring-1 focus-within:ring-ring ${
                    error ? 'border-destructive' : 'border-input'
                } ${disabled ? 'opacity-60' : ''}`}
                style={{ minHeight: `${rows * 1.75 + 0.75}rem` }}
                onClick={() => document.getElementById(id)?.focus()}
            >
                {tags.map((tag, i) => (
                    <Badge key={`${tag}-${i}`} variant="secondary" className="gap-1 pr-1 font-normal">
                        {tag}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => removeTag(i)}
                                className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                                aria-label={`Remove ${tag}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </Badge>
                ))}
                <input
                    id={id}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => commitTag(inputValue)}
                    placeholder={tags.length === 0 ? placeholder : ''}
                    disabled={disabled}
                    aria-invalid={!!error}
                    className="flex-1 min-w-[140px] bg-transparent outline-none text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
                />
            </div>
            <InputError message={error} />
        </div>
    );
}

export default function CompleteFacultyProfile({ user, faculty }: Props) {
    const [step, setStep] = useState(0);
    const isLastStep = step === STEPS.length - 1;
    const current = STEPS[step];

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

    const goBack = () => setStep((s) => Math.max(0, s - 1));

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!isLastStep) {
            setStep((s) => Math.min(STEPS.length - 1, s + 1));
            return;
        }
        post('/faculty/profile/complete');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 sm:p-6">
            <Head title="Complete Faculty Profile" />

            <div className="w-full max-w-5xl mx-auto rounded-2xl border border-border bg-background overflow-hidden">
                <form onSubmit={submit} className="flex flex-col lg:flex-row lg:h-[560px]">
                    {/* Left panel — context, copy, progress */}
                    <aside className="w-full lg:w-[38%] bg-background p-8 lg:p-10 flex flex-col justify-between lg:border-r border-border">
                        <div>
                            {step > 0 && (
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 -ml-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Back
                                </button>
                            )}
                            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-3">{current.title}</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{current.description}</p>
                        </div>

                        <div className="mt-10 lg:mt-0 flex flex-col items-center">
                            <Button type="submit" disabled={processing} size="lg" className="w-full lg:w-auto min-w-40">
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : isLastStep ? (
                                    'Complete Profile'
                                ) : (
                                    'Next'
                                )}
                            </Button>
                            <div className="flex items-center justify-center gap-1.5 mt-5">
                                {STEPS.map((_, i) => (
                                    <span
                                        key={i}
                                        className={`h-1.5 rounded-full transition-all ${
                                            i === step ? 'w-6 bg-foreground' : 'w-1.5 bg-muted-foreground/30'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Right panel — step content */}
                    <main
                        className={`w-full lg:w-[62%] bg-background p-8 lg:p-10 flex ${
                            step === 2 ? 'items-stretch' : 'items-center'
                        } ${step === 0 || step === 2 ? 'overflow-y-auto' : 'overflow-hidden'}`}
                    >
                        <div className={`w-full ${step === 2 ? 'h-full' : ''}`}>
                            {/* Step 1: Confirm details (read-only) + Personal information */}
                            {step === 0 && (
                                <div className="space-y-8">
                                    <Card className="border-border bg-background shadow-none">
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between gap-4">
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

                                                {faculty?.faculty_id && (
                                                    <div className="text-center shrink-0 pl-4 border-l border-border">
                                                        <p className="text-xs text-muted-foreground mb-1">Faculty ID</p>
                                                        <p className="text-sm font-semibold">{faculty.faculty_id}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 mt-4 border-t border-border">
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    This information is managed by your institution and can't be edited here.
                                                    Contact your administrator if anything needs to change.
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
                                                    required
                                                    disabled={processing}
                                                    className="mt-1.5"
                                                    aria-invalid={!!errors.last_name}
                                                />
                                                <InputError message={errors.last_name} />
                                            </div>
                                        </div>

                                        <div className="max-w-sm">
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
                            )}

                            {/* Step 2: Professional information */}
                            {step === 1 && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="position" className="text-sm font-medium">
                                                Position *
                                            </Label>
                                            <Input
                                                id="position"
                                                name="position"
                                                value={data.position}
                                                onChange={(e) => setData('position', e.target.value)}
                                                placeholder="e.g., Assistant Professor"
                                                required
                                                disabled={processing}
                                                autoFocus
                                                className="mt-1"
                                                aria-invalid={!!errors.position}
                                            />
                                            <InputError message={errors.position} />
                                        </div>

                                        <div>
                                            <Label htmlFor="designation" className="text-sm font-medium">
                                                Designation *
                                            </Label>
                                            <Input
                                                id="designation"
                                                name="designation"
                                                value={data.designation}
                                                onChange={(e) => setData('designation', e.target.value)}
                                                placeholder="e.g., Department Chair"
                                                required
                                                disabled={processing}
                                                className="mt-1"
                                                aria-invalid={!!errors.designation}
                                            />
                                            <InputError message={errors.designation} />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="orcid" className="text-sm font-medium">
                                            ORCID
                                        </Label>
                                        <Input
                                            id="orcid"
                                            name="orcid"
                                            value={data.orcid}
                                            onChange={(e) => setData('orcid', e.target.value)}
                                            placeholder="0000-0002-1825-0097"
                                            disabled={processing}
                                            className="mt-1"
                                            aria-invalid={!!errors.orcid}
                                        />
                                        <InputError message={errors.orcid} />
                                    </div>

                                    <TagInput
                                        id="educational_attainment"
                                        label="Educational Attainment"
                                        value={data.educational_attainment}
                                        onChange={(value) => setData('educational_attainment', value)}
                                        placeholder="Type a degree and press Enter (e.g., PhD in Computer Science)"
                                        disabled={processing}
                                        error={errors.educational_attainment}
                                    />

                                    <TagInput
                                        id="field_of_specialization"
                                        label="Field of Specialization"
                                        value={data.field_of_specialization}
                                        onChange={(value) => setData('field_of_specialization', value)}
                                        placeholder="Type a field and press Enter (e.g., Machine Learning)"
                                        disabled={processing}
                                        error={errors.field_of_specialization}
                                    />

                                    <TagInput
                                        id="research_interest"
                                        label="Research Interests"
                                        value={data.research_interest}
                                        onChange={(value) => setData('research_interest', value)}
                                        placeholder="Type an interest and press Enter"
                                        disabled={processing}
                                        error={errors.research_interest}
                                        rows={2}
                                    />
                                </div>
                            )}

                            {/* Step 3: Review & confirm — tabbed, read-only snapshot split into
                                Personal Information and Professional Background */}
                            {step === 2 && (
                                <div className="h-full flex flex-col gap-5">
                                    <Tabs defaultValue="personal" className="w-full flex-1 flex flex-col">
                                        <TabsList className="mx-auto">
                                            <TabsTrigger value="personal">Personal Information</TabsTrigger>
                                            <TabsTrigger value="professional">Professional Background</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="personal" className="mt-5">
                                            <div className="space-y-4 max-w-lg mx-auto">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <ReviewField label="First name" value={data.first_name} />
                                                    <ReviewField label="Middle name" value={data.middle_name} />
                                                    <ReviewField label="Last name" value={data.last_name} />
                                                </div>
                                                <ReviewField label="Contact number" value={data.contact_number} />
                                                <ReviewField label="Email" value={user.email} />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="professional" className="mt-5">
                                            <div className="space-y-4 max-w-lg mx-auto">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <ReviewField label="Position" value={data.position} />
                                                    <ReviewField label="Designation" value={data.designation} />
                                                </div>
                                                <ReviewField label="ORCID" value={data.orcid} placeholder="Not provided" />
                                                <ReviewTags label="Educational Attainment" value={data.educational_attainment} />
                                                <ReviewTags label="Field of Specialization" value={data.field_of_specialization} />
                                                <ReviewTags label="Research Interests" value={data.research_interest} />
                                            </div>
                                        </TabsContent>
                                    </Tabs>

                                    <p className="text-xs text-muted-foreground shrink-0 mt-auto pt-2 text-center">
                                        Hit <span className="font-medium text-foreground">Complete Profile</span> to finish setting up
                                        your account. You can go <span className="font-medium text-foreground">Back</span> to make
                                        changes.
                                    </p>
                                </div>
                            )}
                        </div>
                    </main>
                </form>
            </div>
        </div>
    );
}