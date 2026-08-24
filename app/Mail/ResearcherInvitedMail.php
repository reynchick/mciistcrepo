<?php

namespace App\Mail;

use App\Mail\Traits\MailHelper;
use App\Models\Research;
use App\Models\Researcher;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResearcherInvitedMail extends Mailable
{
    use Queueable, SerializesModels, MailHelper;

    public function __construct(public Research $research, public Researcher $researcher, public string $token)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->researcher->email,
            subject: 'You have been invited to contribute to a research submission',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.researcher-invited',
            with: [
                'researchTitle' => $this->research->research_title,
                'recipientName' => $this->researcher->full_name,
                'adviserName' => $this->research->adviser?->full_name ?? 'the faculty adviser',
                'hasAccount' => $this->researcher->user_id !== null,
                'actionUrl' => $this->researcher->user_id !== null
                    ? route('student.my-researches')
                    : route('research.invitation', ['token' => $this->token]),
                'token' => $this->token,
            ],
        );
    }
}
