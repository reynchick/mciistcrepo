<?php

namespace App\Events;

class KeywordSearched
{
    public int $keywordId;
    public ?int $userId;
    public ?string $ipAddress;
    public ?string $userAgent;

    public function __construct(int $keywordId, ?int $userId = null, ?string $ipAddress = null, ?string $userAgent = null)
    {
        $this->keywordId = $keywordId;
        $this->userId = $userId;
        $this->ipAddress = $ipAddress;
        $this->userAgent = $userAgent;
    }
}
