<?php

namespace App\Services;

use App\Mail\AdviserMetadataRequestedMail;
use App\Mail\ResearchPostedMail;
use App\Models\Research;
use Illuminate\Support\Facades\Mail;

class ResearchMailService
{
    public function sendAdviserMetadataRequested(Research $research): void
    {
        foreach ($this->recipientEmails($research, ['adviser']) as $email) {
            Mail::to($email)->queue(new AdviserMetadataRequestedMail($research, $email));
        }
    }

    public function sendResearchPosted(Research $research): void
    {
        foreach ($this->recipientEmails($research, ['researchers']) as $email) {
            Mail::to($email)->queue(new ResearchPostedMail($research, $email));
        }
    }

    protected function recipientEmails(Research $research, array $roles): array
    {
        $emails = [];

        if (in_array('adviser', $roles, true) && $research->adviser?->email) {
            $emails[] = $research->adviser->email;
        }

        if (in_array('researchers', $roles, true)) {
            foreach ($research->researchers()->pluck('email')->filter() as $email) {
                $emails[] = $email;
            }
        }

        return array_values(array_unique($emails));
    }
}
