<?php

namespace App\Mail;

use App\Mail\Traits\MailHelper;
use App\Models\Research;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class ResearcherInvitedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels, MailHelper;

    public function __construct(public Research $research, public string $recipientEmail, public string $token)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->recipientEmail,
            subject: 'You have been invited to contribute to a research submission',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.researcher-invited',
            with: [
                'researchTitle' => $this->research->research_title,
                'recipientEmail' => $this->recipientEmail,
                'token' => $this->token,
            ],
        );
    }
}
