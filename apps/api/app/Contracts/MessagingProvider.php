<?php

namespace App\Contracts;

use App\Models\WhatsAppAccount;

interface MessagingProvider
{
    /** @return array{ok: bool, status: string, message: string, details: array<string, mixed>} */
    public function validateConnection(WhatsAppAccount $account): array;

    /** @return array{ok: bool, status: string, message: string, templates: list<array<string, mixed>>} */
    public function listTemplates(WhatsAppAccount $account): array;
}
