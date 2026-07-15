<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'organization_id',
    'name',
    'phone',
    'email',
    'team_name',
    'status',
    'tags',
    'last_seen_at',
])]
class Contact extends Model
{
    use HasUuids;

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'last_seen_at' => 'datetime',
        ];
    }
}
