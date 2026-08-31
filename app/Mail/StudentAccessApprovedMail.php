<?php

namespace App\Mail;

use App\Mail\Traits\MailHelper;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentAccessApprovedMail extends Mailable
{
    use Queueable, SerializesModels, MailHelper;

    public function __construct(public User $user)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->user->email,
            subject: 'Your student account has been approved',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.student-access-approved',
            with: [
                'user' => $this->user,
                'approvalMessage' => $this->getApprovalMessage(),
            ],
        );
    }

    private function getApprovalMessage(): string
    {
        if ($this->user->created_by_admin) {
            return 'Your student account has been created and approved for system access by an administrator.';
        }

        return 'Your student account has been approved for system access.';
    }
}
