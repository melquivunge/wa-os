<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CampaignController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $status = $request->query('status');

        $campaigns = Campaign::query()
            ->whereBelongsTo($context->organization())
            ->when(is_string($status), fn ($query) => $query->where('status', $status))
            ->orderByRaw('scheduled_at IS NULL')
            ->orderByDesc('scheduled_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Campaign $campaign): array => $this->serialize($campaign));

        return response()->json(['data' => $campaigns]);
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        abort_unless($context->membership()->role->canWriteMarketingData(), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:140'],
            'audience_name' => ['required', 'string', 'max:120'],
            'channel' => ['sometimes', 'string', Rule::in(['whatsapp'])],
            'status' => ['sometimes', 'string', Rule::in(['draft', 'scheduled'])],
            'message_count' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        $campaign = Campaign::create([
            ...$data,
            'organization_id' => $context->organization()->id,
            'channel' => $data['channel'] ?? 'whatsapp',
            'status' => $data['status'] ?? 'draft',
        ]);

        return response()->json(['data' => $this->serialize($campaign)], 201);
    }

    public function show(Campaign $campaign, TenantContext $context): JsonResponse
    {
        abort_unless($campaign->organization_id === $context->organization()->id, 404);

        return response()->json(['data' => $this->serialize($campaign)]);
    }

    public function summary(TenantContext $context): JsonResponse
    {
        $campaigns = Campaign::query()->whereBelongsTo($context->organization())->get();
        $active = $campaigns->firstWhere('status', 'sending') ?? $campaigns->first();

        return response()->json([
            'data' => [
                'totals' => [
                    'campaigns' => $campaigns->count(),
                    'sent' => $campaigns->sum('message_count'),
                    'delivered' => $campaigns->sum('delivered_count'),
                    'read' => $campaigns->sum('read_count'),
                    'failed' => $campaigns->sum('failed_count'),
                ],
                'active_campaign' => $active ? $this->serialize($active) : null,
                'recent_campaigns' => $campaigns
                    ->sortByDesc(fn (Campaign $campaign) => $campaign->scheduled_at?->getTimestamp() ?? $campaign->created_at->getTimestamp())
                    ->take(5)
                    ->values()
                    ->map(fn (Campaign $campaign): array => $this->serialize($campaign)),
            ],
        ]);
    }

    private function serialize(Campaign $campaign): array
    {
        $progress = $campaign->message_count > 0
            ? round(($campaign->delivered_count / $campaign->message_count) * 100)
            : 0;

        return [
            'id' => $campaign->id,
            'name' => $campaign->name,
            'audience_name' => $campaign->audience_name,
            'channel' => $campaign->channel,
            'status' => $campaign->status,
            'message_count' => $campaign->message_count,
            'delivered_count' => $campaign->delivered_count,
            'read_count' => $campaign->read_count,
            'failed_count' => $campaign->failed_count,
            'progress' => min(100, $progress),
            'scheduled_at' => $campaign->scheduled_at?->toISOString(),
            'started_at' => $campaign->started_at?->toISOString(),
            'completed_at' => $campaign->completed_at?->toISOString(),
        ];
    }
}
