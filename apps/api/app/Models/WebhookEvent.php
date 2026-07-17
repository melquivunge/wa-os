<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'organization_id', 'whatsapp_account_id', 'provider', 'provider_event_id',
    'payload', 'headers', 'status', 'processing_error', 'received_at', 'processed_at',
])]
class WebhookEvent extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'headers' => 'array',
            'received_at' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function whatsappAccount(): BelongsTo
    {
        return $this->belongsTo(WhatsAppAccount::class);
    }
}
