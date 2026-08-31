<?php

namespace App\Mail;

use App\Models\GuestFileRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class FileAccessRequestApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public GuestFileRequest $request) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your research file access request was approved');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.file-access-request-approved',
            with: [
                'researchTitle' => $this->request->research->research_title,
                'fileType' => $this->request->file_type,
            ],
        );
    }

    public function attachments(): array
    {
        $path = $this->request->research->research_manuscript;

        if (!$path || !Storage::disk('private')->exists($path)) {
            return [];
        }

        return [
            Attachment::fromStorageDisk('private', $path)
                ->as('research-manuscript.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
