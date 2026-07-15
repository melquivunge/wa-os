<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Audience;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AudienceController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $team = $request->query('team');

        $audiences = Audience::query()
            ->whereBelongsTo($context->organization())
            ->when(is_string($team) && $team !== '', fn ($query) => $query->where('team_name', $team))
            ->orderByDesc('contact_count')
            ->orderBy('name')
            ->get()
            ->map(fn (Audience $audience): array => [
                'id' => $audience->id,
                'name' => $audience->name,
                'team_name' => $audience->team_name,
                'source' => $audience->source,
                'contact_count' => $audience->contact_count,
                'estimated_spend_amount' => $audience->estimated_spend_amount,
                'rules' => $audience->rules ?? [],
                'refreshed_at' => $audience->refreshed_at?->toISOString(),
            ]);

        return response()->json(['data' => $audiences]);
    }
}
