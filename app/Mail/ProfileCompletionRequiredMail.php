<?php

namespace App\Mail;

use App\Mail\Traits\MailHelper;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProfileCompletionRequiredMail extends Mailable
{
    use Queueable, SerializesModels, MailHelper;

    public function __construct(public User $user)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->user->email,
            subject: 'Complete Your Profile to Continue Accessing the System',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.profile-completion-required',
            with: [
                'rolesFormatted' => $this->formatRolesWithEmojis(),
            ],
        );
    }
}
