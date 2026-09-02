<?php

namespace App\Mail;

use App\Models\GuestFileRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FileAccessRequestExpiredMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public GuestFileRequest $request)
    {
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->request->guestUser->email,
            subject: 'File access request expired',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.file-access-request-expired',
            with: [
                'researchTitle' => $this->request->research->research_title,
                'fileType' => $this->request->file_type,
            ],
        );
    }
}