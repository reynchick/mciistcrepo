<?php

namespace App\Mail;

use App\Models\Research;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class ResearchReturnedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Research $research, public string $recipientEmail)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->recipientEmail,
            subject: 'Research requires revision',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.research-returned',
            with: [
                'researchTitle' => $this->research->research_title,
                'recipientEmail' => $this->recipientEmail,
            ],
        );
    }
}
