<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WhatsAppAccount;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WhatsAppAccountController extends Controller
{
    public function index(TenantContext $context): JsonResponse
    {
        return response()->json(['data' => $context->organization()->whatsappAccounts
            ->sortBy('name')->values()->map(fn (WhatsAppAccount $account): array => $this->serialize($account))]);
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        abort_unless($context->membership()->role->canManageOrganization(), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:140'],
            'business_account_id' => ['nullable', 'string', 'max:120'],
            'phone_number_id' => [
                'nullable', 'string', 'max:120',
                Rule::unique('whatsapp_accounts', 'phone_number_id')->where('organization_id', $context->organization()->id),
            ],
            'display_phone_number' => ['nullable', 'string', 'max:40'],
            'access_token' => ['nullable', 'string', 'max:4096'],
        ]);

        $account = $context->organization()->whatsappAccounts()->create([
            ...$data,
            'provider' => 'meta',
            'status' => empty($data['access_token']) ? 'pending' : 'ready_for_validation',
        ]);

        return response()->json(['data' => $this->serialize($account)], 201);
    }

    private function serialize(WhatsAppAccount $account): array
    {
        return [
            'id' => $account->id,
            'name' => $account->name,
            'provider' => $account->provider,
            'status' => $account->status,
            'business_account_id' => $account->business_account_id,
            'phone_number_id' => $account->phone_number_id,
            'display_phone_number' => $account->display_phone_number,
            'has_credentials' => filled($account->access_token),
            'last_validated_at' => $account->last_validated_at?->toISOString(),
        ];
    }
}
