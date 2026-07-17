<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\MessagingProvider;
use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use App\Models\WhatsAppAccount;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageTemplateController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $status = $request->query('status');
        $team = $request->query('team');
        $category = $request->query('category');

        $templates = MessageTemplate::query()
            ->whereBelongsTo($context->organization())
            ->when(is_string($status) && $status !== '' && $status !== 'all', fn ($query) => $query->where('status', $status))
            ->when(is_string($team) && $team !== '' && $team !== 'all', fn ($query) => $query->where('team_name', $team))
            ->when(is_string($category) && $category !== '' && $category !== 'all', fn ($query) => $query->where('category', $category))
            ->orderByRaw("status = 'approved' desc")
            ->orderBy('name')
            ->get()
            ->map(fn (MessageTemplate $template): array => $this->serialize($template));

        return response()->json(['data' => $templates]);
    }

    public function sync(TenantContext $context): JsonResponse
    {
        abort_unless($context->membership()->role->canWriteMarketingData(), 403);

        $catalog = [
            [
                'name' => 'Oferta relâmpago',
                'team_name' => 'CRM',
                'category' => 'marketing',
                'status' => 'approved',
                'language' => 'pt_BR',
                'body' => 'Olá {{nome}}, sua oferta de inverno está pronta. Use o cupom {{cupom}} até hoje.',
            ],
            [
                'name' => 'Boas-vindas pós-cadastro',
                'team_name' => 'Growth',
                'category' => 'onboarding',
                'status' => 'approved',
                'language' => 'pt_BR',
                'body' => 'Bem-vindo ao Acme Studio, {{nome}}. Veja seus próximos passos aqui: {{link}}',
            ],
            [
                'name' => 'Reativação 30 dias',
                'team_name' => 'Retenção',
                'category' => 'retention',
                'status' => 'approved',
                'language' => 'pt_BR',
                'body' => '{{nome}}, sentimos sua falta. Preparamos uma condição especial para voltar.',
            ],
            [
                'name' => 'Confirmação de pedido',
                'team_name' => 'Produto',
                'category' => 'utility',
                'status' => 'approved',
                'language' => 'pt_BR',
                'body' => 'Pedido {{pedido}} confirmado. Acompanhe a entrega por aqui: {{link}}',
            ],
            [
                'name' => 'Cupom aniversário',
                'team_name' => 'CRM',
                'category' => 'marketing',
                'status' => 'rejected',
                'language' => 'pt_BR',
                'body' => '{{nome}}, seu presente chegou: {{cupom}}.',
            ],
        ];

        $created = 0;
        $updated = 0;
        $templates = collect($catalog)->map(function (array $template) use ($context, &$created, &$updated): MessageTemplate {
            $model = MessageTemplate::updateOrCreate(
                [
                    'organization_id' => $context->organization()->id,
                    'name' => $template['name'],
                    'language' => $template['language'],
                ],
                [
                    ...$template,
                    'last_used_at' => $template['status'] === 'approved' ? now() : null,
                ],
            );

            $model->wasRecentlyCreated ? $created++ : $updated++;

            return $model;
        });

        return response()->json([
            'data' => [
                'created' => $created,
                'updated' => $updated,
                'approved' => $templates->where('status', 'approved')->count(),
                'rejected' => $templates->where('status', 'rejected')->count(),
                'synced_at' => now()->toISOString(),
                'templates' => $templates->map(fn (MessageTemplate $template): array => $this->serialize($template))->values(),
            ],
        ]);
    }

    public function syncFromMeta(WhatsAppAccount $account, TenantContext $context, MessagingProvider $provider): JsonResponse
    {
        abort_unless($context->membership()->role->canWriteMarketingData(), 403);

        abort_unless($account->organization_id === $context->organization()->id, 404);

        $result = $provider->listTemplates($account);
        if (! $result['ok']) {
            return response()->json(['message' => $result['message'], 'status' => $result['status']], 422);
        }

        $created = 0;
        $updated = 0;
        $templates = collect($result['templates'])->map(function (array $template) use ($context, &$created, &$updated): MessageTemplate {
            $model = MessageTemplate::updateOrCreate(
                [
                    'organization_id' => $context->organization()->id,
                    'provider_template_id' => $template['provider_template_id'],
                ],
                [
                    ...$template,
                    'team_name' => 'CRM',
                    'last_used_at' => $template['status'] === 'approved' ? now() : null,
                ],
            );

            $model->wasRecentlyCreated ? $created++ : $updated++;

            return $model;
        });

        return response()->json([
            'data' => [
                'created' => $created,
                'updated' => $updated,
                'approved' => $templates->where('status', 'approved')->count(),
                'rejected' => $templates->where('status', 'rejected')->count(),
                'synced_at' => now()->toISOString(),
                'templates' => $templates->map(fn (MessageTemplate $template): array => $this->serialize($template))->values(),
            ],
        ]);
    }

    private function serialize(MessageTemplate $template): array
    {
        return [
            'id' => $template->id,
            'provider_template_id' => $template->provider_template_id,
            'name' => $template->name,
            'team_name' => $template->team_name,
            'category' => $template->category,
            'status' => $template->status,
            'language' => $template->language,
            'body' => $template->body,
            'last_used_at' => $template->last_used_at?->toISOString(),
        ];
    }
}
