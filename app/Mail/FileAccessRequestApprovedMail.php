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
        $path = $this->request->file_type === 'approval_sheet'
            ? $this->request->research->research_approval_sheet
            : $this->request->research->research_manuscript;

        if (!$path || !Storage::disk('public')->exists($path)) {
            return [];
        }

        $filename = $this->request->file_type === 'approval_sheet'
            ? 'research-approval-sheet.pdf'
            : 'research-manuscript.pdf';

        return [
            Attachment::fromStorageDisk('public', $path)
                ->as($filename)
                ->withMime('application/pdf'),
        ];
    }
}
