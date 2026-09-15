<?php

namespace App\Mail;

use App\Models\GuestFileRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FileAccessRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public GuestFileRequest $request,
        public string $token,
        public string $recipientRole,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'File access request requires your review');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.file-access-request',
            with: [
                'researchTitle' => $this->request->research->research_title,
                'fileType' => $this->request->file_type,
                'recipientRole' => $this->recipientRole,
                'actionUrl' => route('file-access-requests.review', [
                    'guestFileRequest' => $this->request->id,
                    'token' => $this->token,
                ]),
            ],
        );
    }
}