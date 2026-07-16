<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Audience;
use App\Models\Campaign;
use App\Models\MessageTemplate;
use App\Services\CampaignTransitionService;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CampaignController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $status = $request->query('status');

        $campaigns = Campaign::query()
            ->with(['audience', 'messageTemplate'])
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

        $organizationId = $context->organization()->id;

        $data = $request->validate([
            'name' => ['required', 'string', 'max:140'],
            'audience_id' => [
                'required',
                'uuid',
                Rule::exists('audiences', 'id')->where(fn ($query) => $query->where('organization_id', $organizationId)),
            ],
            'message_template_id' => [
                'required',
                'uuid',
                Rule::exists('message_templates', 'id')->where(fn ($query) => $query
                    ->where('organization_id', $organizationId)
                    ->where('status', 'approved')),
            ],
            'channel' => ['sometimes', 'string', Rule::in(['whatsapp'])],
            'status' => ['sometimes', 'string', Rule::in(['draft', 'scheduled'])],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        $audience = Audience::query()
            ->whereBelongsTo($context->organization())
            ->findOrFail($data['audience_id']);
        $template = MessageTemplate::query()
            ->whereBelongsTo($context->organization())
            ->where('status', 'approved')
            ->findOrFail($data['message_template_id']);
        if ($template->team_name !== $audience->team_name) {
            throw ValidationException::withMessages([
                'message_template_id' => ['O template precisa pertencer ao mesmo time da audiência.'],
            ]);
        }

        $campaign = Campaign::create([
            ...$data,
            'organization_id' => $organizationId,
            'audience_id' => $audience->id,
            'message_template_id' => $template->id,
            'audience_name' => $audience->name,
            'channel' => $data['channel'] ?? 'whatsapp',
            'status' => $data['status'] ?? 'draft',
            'team_name' => $audience->team_name,
            'message_count' => $audience->contact_count,
            'spend_amount' => $audience->estimated_spend_amount,
        ]);

        return response()->json(['data' => $this->serialize($campaign)], 201);
    }

    public function show(Campaign $campaign, TenantContext $context): JsonResponse
    {
        abort_unless($campaign->organization_id === $context->organization()->id, 404);

        $campaign->load(['audience', 'messageTemplate', 'recipients']);

        return response()->json(['data' => $this->serialize($campaign)]);
    }

    public function validateCampaign(Campaign $campaign, TenantContext $context, CampaignTransitionService $transitions): JsonResponse
    {
        $this->authorizeCampaignOperation($campaign, $context);

        return response()->json(['data' => $transitions->validate($campaign)]);
    }

    public function start(Campaign $campaign, TenantContext $context, CampaignTransitionService $transitions): JsonResponse
    {
        $this->authorizeCampaignOperation($campaign, $context);

        return response()->json(['data' => $this->serialize($transitions->start($campaign)->load(['audience', 'messageTemplate', 'recipients']))]);
    }

    public function pause(Campaign $campaign, TenantContext $context, CampaignTransitionService $transitions): JsonResponse
    {
        $this->authorizeCampaignOperation($campaign, $context);

        return response()->json(['data' => $this->serialize($transitions->pause($campaign)->load(['audience', 'messageTemplate']))]);
    }

    public function resume(Campaign $campaign, TenantContext $context, CampaignTransitionService $transitions): JsonResponse
    {
        $this->authorizeCampaignOperation($campaign, $context);

        return response()->json(['data' => $this->serialize($transitions->resume($campaign)->load(['audience', 'messageTemplate']))]);
    }

    public function cancel(Campaign $campaign, TenantContext $context, CampaignTransitionService $transitions): JsonResponse
    {
        $this->authorizeCampaignOperation($campaign, $context);

        return response()->json(['data' => $this->serialize($transitions->cancel($campaign)->load(['audience', 'messageTemplate']))]);
    }

    public function summary(TenantContext $context): JsonResponse
    {
        $campaigns = Campaign::query()
            ->with(['audience', 'messageTemplate'])
            ->whereBelongsTo($context->organization())
            ->get();
        $active = $campaigns->firstWhere('status', 'sending') ?? $campaigns->first();

        return response()->json([
            'data' => [
                'totals' => [
                    'campaigns' => $campaigns->count(),
                    'sent' => $campaigns->sum('message_count'),
                    'delivered' => $campaigns->sum('delivered_count'),
                    'read' => $campaigns->sum('read_count'),
                    'failed' => $campaigns->sum('failed_count'),
                    'spend' => $campaigns->sum('spend_amount'),
                ],
                'teams' => $campaigns
                    ->groupBy('team_name')
                    ->map(fn ($teamCampaigns, string $teamName): array => [
                        'name' => $teamName,
                        'campaigns' => $teamCampaigns->count(),
                        'spend' => $teamCampaigns->sum('spend_amount'),
                    ])
                    ->values(),
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
            'audience_id' => $campaign->audience_id,
            'message_template_id' => $campaign->message_template_id,
            'message_template_name' => $campaign->messageTemplate?->name,
            'audience' => $campaign->audience ? [
                'id' => $campaign->audience->id,
                'name' => $campaign->audience->name,
                'team_name' => $campaign->audience->team_name,
                'source' => $campaign->audience->source,
                'contact_count' => $campaign->audience->contact_count,
                'estimated_spend_amount' => $campaign->audience->estimated_spend_amount,
                'rules' => $campaign->audience->rules ?? [],
            ] : null,
            'message_template' => $campaign->messageTemplate ? [
                'id' => $campaign->messageTemplate->id,
                'name' => $campaign->messageTemplate->name,
                'team_name' => $campaign->messageTemplate->team_name,
                'category' => $campaign->messageTemplate->category,
                'language' => $campaign->messageTemplate->language,
                'body' => $campaign->messageTemplate->body,
            ] : null,
            'name' => $campaign->name,
            'audience_name' => $campaign->audience_name,
            'team_name' => $campaign->team_name,
            'channel' => $campaign->channel,
            'status' => $campaign->status,
            'message_count' => $campaign->message_count,
            'delivered_count' => $campaign->delivered_count,
            'read_count' => $campaign->read_count,
            'failed_count' => $campaign->failed_count,
            'spend_amount' => $campaign->spend_amount,
            'progress' => min(100, $progress),
            'scheduled_at' => $campaign->scheduled_at?->toISOString(),
            'started_at' => $campaign->started_at?->toISOString(),
            'completed_at' => $campaign->completed_at?->toISOString(),
            'recipients' => $campaign->relationLoaded('recipients')
                ? $campaign->recipients
                    ->sortByDesc(fn ($recipient) => $recipient->last_event_at?->getTimestamp() ?? $recipient->created_at->getTimestamp())
                    ->take(12)
                    ->values()
                    ->map(fn ($recipient): array => [
                        'id' => $recipient->id,
                        'name' => $recipient->recipient_name,
                        'phone' => $this->maskPhone($recipient->phone),
                        'status' => $recipient->status,
                        'last_event_at' => $recipient->last_event_at?->toISOString(),
                    ])
                : [],
            'timeline' => [
                ['label' => 'Criada', 'state' => 'done', 'value' => $campaign->created_at?->toISOString()],
                ['label' => 'Agendada', 'state' => $campaign->scheduled_at ? 'done' : 'pending', 'value' => $campaign->scheduled_at?->toISOString()],
                ['label' => 'Enviando', 'state' => $campaign->started_at ? 'done' : ($campaign->status === 'sending' ? 'current' : 'pending'), 'value' => $campaign->started_at?->toISOString()],
                ['label' => 'Concluída', 'state' => $campaign->completed_at ? 'done' : ($campaign->status === 'completed' ? 'current' : 'pending'), 'value' => $campaign->completed_at?->toISOString()],
            ],
        ];
    }

    private function maskPhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (strlen($digits) < 6) {
            return '••••';
        }

        return sprintf('+%s ••••-%s', substr($digits, 0, 2), substr($digits, -4));
    }

    private function authorizeCampaignOperation(Campaign $campaign, TenantContext $context): void
    {
        abort_unless($campaign->organization_id === $context->organization()->id, 404);
        abort_unless($context->membership()->role->canWriteMarketingData(), 403);
    }
}
