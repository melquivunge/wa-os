<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'organization_id', 'name', 'business_account_id', 'phone_number_id',
    'display_phone_number', 'access_token', 'provider', 'status', 'metadata',
    'last_validated_at',
])]
class WhatsAppAccount extends Model
{
    use HasUuids;

    protected $table = 'whatsapp_accounts';

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'metadata' => 'array',
            'last_validated_at' => 'datetime',
        ];
    }
}
