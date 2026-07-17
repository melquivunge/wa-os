<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'organization_id',
    'provider_template_id',
    'name',
    'team_name',
    'category',
    'status',
    'language',
    'body',
    'last_used_at',
])]
class MessageTemplate extends Model
{
    use HasUuids;

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
        ];
    }
}
