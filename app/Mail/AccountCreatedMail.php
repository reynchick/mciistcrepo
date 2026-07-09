<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

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
        // Map roles to emoji icons
        $roleEmojis = [
            'Faculty' => '🎓',
            'Student' => '👨‍🎓',
            'Administrator' => '👤',
            'MCIIS Staff' => '👥',
        ];

        // Build formatted roles with emojis
        $rolesWithEmojis = $this->user->roles->map(function ($role) use ($roleEmojis) {
            $emoji = $roleEmojis[$role->name] ?? '•';
            return "{$emoji} {$role->name}";
        })->toArray();

        $primaryRole = $this->primaryRoleName();

        return new Content(
            markdown: 'emails.account-created',
            with: [
                'rolesWithEmojis' => $rolesWithEmojis,
                'primaryRole' => $primaryRole,
                'accountIntro' => $this->introForRole($primaryRole),
                'profileReminder' => $this->profileReminderForRole($primaryRole),
            ],
        );
    }

    protected function primaryRoleName(): ?string
    {
        $priority = ['Administrator', 'MCIIS Staff', 'Faculty', 'Student'];

        foreach ($priority as $roleName) {
            if ($this->user->roles->contains('name', $roleName)) {
                return $roleName;
            }
        }

        return $this->user->roles->first()?->name;
    }

    protected function subjectForPrimaryRole(): string
    {
        return match ($this->primaryRoleName()) {
            'Administrator' => 'Your Administrator Account Has Been Created',
            'MCIIS Staff' => 'Your MCIIS Staff Account Has Been Created',
            'Faculty' => 'Your Faculty Account Has Been Created',
            'Student' => 'Your Student Account Has Been Created',
            default => 'Your Account Has Been Created',
        };
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

    protected function profileReminderForRole(?string $role): ?string
    {
        return match ($role) {
            'Faculty' => 'After logging in for the first time, you will need to complete your profile before you can access the full system.',
            'Student' => 'After logging in for the first time, you will need to complete your profile before you can access the full system.',
            default => null,
        };
    }
}
