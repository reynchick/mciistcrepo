<?php

namespace App\Mail;

use App\Mail\Traits\MailHelper;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountCreatedMail extends Mailable
{
    use Queueable, SerializesModels, MailHelper;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->user->email,
            subject: $this->subjectForPrimaryRole(),
        );
    }

    public function content(): Content
    {
        $hasMultipleRoles = $this->user->roles->count() > 1;
        $primaryRole = $this->primaryRoleName();

        return new Content(
            markdown: 'emails.account-created',
            with: [
                'rolesFormatted' => $this->formatRolesWithEmojis(),
                'primaryRole' => $primaryRole,
                'accountIntro' => $hasMultipleRoles ? $this->genericIntro() : $this->introForRole($primaryRole),
                'profileReminder' => $this->profileReminder(),
            ],
        );
    }

    protected function subjectForPrimaryRole(): string
    {
        $roleNames = $this->user->roles->pluck('name')->toArray();

        if (empty($roleNames)) {
            return 'Your Account Has Been Created';
        }

        // Format roles: "Administrator", "Administrator and Faculty", "Administrator, Faculty, and Student"
        if (count($roleNames) === 1) {
            return "Your {$roleNames[0]} Account Has Been Created";
        }

        if (count($roleNames) === 2) {
            return "Your {$roleNames[0]} and {$roleNames[1]} Account Has Been Created";
        }

        // 3+ roles: use Oxford comma
        $lastRole = array_pop($roleNames);
        $roleList = implode(', ', $roleNames) . ", and {$lastRole}";
        return "Your {$roleList} Account Has Been Created";
    }

    protected function genericIntro(): string
    {
        return 'Your account has been created successfully with the following role(s). You can sign in with your USeP email address to access the system.';
    }

    protected function introForRole(?string $role): string
    {
        return match ($role) {
            'Administrator' => 'Your administrator account is ready. You can sign in with your USeP email and begin managing the system.',
            'MCIIS Staff' => 'Your staff account is ready. You can sign in with your USeP email and access the tools assigned to your role.',
            'Faculty' => 'Your faculty account is ready and linked to your faculty record.',
            'Student' => 'Your student account is ready. You can sign in with your USeP email and complete your profile after first login.',
            default => 'Your account has been created successfully. You can now sign in with your USeP email address.',
        };
    }

    protected function profileReminder(): ?string
    {
        // Check if ANY role requires profile completion (Faculty or Student)
        $requiresProfileCompletion = $this->user->roles->whereIn('name', ['Faculty', 'Student'])->isNotEmpty();

        if ($requiresProfileCompletion) {
            return 'After logging in for the first time, you will need to complete your profile before you can access the full system.';
        }

        return null;
    }
}
