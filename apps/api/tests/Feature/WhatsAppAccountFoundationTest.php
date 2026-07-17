<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WhatsAppAccountFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_register_meta_account_without_exposing_token(): void
    {
        [$organization, $user] = $this->member(OrganizationRole::Owner);
        Sanctum::actingAs($user);

        $response = $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/whatsapp-accounts', [
                'name' => 'Conta principal',
                'business_account_id' => 'business-123',
                'phone_number_id' => 'phone-123',
                'access_token' => 'secret-token',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'ready_for_validation')
            ->assertJsonPath('data.has_credentials', true)
            ->assertJsonMissingPath('data.access_token');

        $this->assertDatabaseHas('whatsapp_accounts', [
            'organization_id' => $organization->id,
            'phone_number_id' => 'phone-123',
        ]);
        $this->assertNotSame('secret-token', (string) $organization->whatsappAccounts()->first()->getRawOriginal('access_token'));
    }

    public function test_marketing_member_cannot_manage_whatsapp_credentials(): void
    {
        [$organization, $user] = $this->member(OrganizationRole::Marketing);
        Sanctum::actingAs($user);

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/whatsapp-accounts', ['name' => 'Sem permissão'])
            ->assertForbidden();
    }

    public function test_owner_can_validate_account_through_provider_contract(): void
    {
        [$organization, $user] = $this->member(OrganizationRole::Owner);
        $account = $organization->whatsappAccounts()->create([
            'name' => 'Conta Meta',
            'phone_number_id' => 'phone-456',
            'access_token' => 'secret-token',
            'status' => 'ready_for_validation',
        ]);
        Http::fake(['graph.facebook.com/*' => Http::response(['id' => 'phone-456', 'display_phone_number' => '+55 11 99999-0000'], 200)]);
        Sanctum::actingAs($user);

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/whatsapp-accounts/{$account->id}/validate")
            ->assertOk()
            ->assertJsonPath('data.ok', true)
            ->assertJsonPath('data.status', 'connected');

        $this->assertDatabaseHas('whatsapp_accounts', ['id' => $account->id, 'status' => 'connected']);
    }

    /** @return array{Organization, User} */
    private function member(OrganizationRole $role): array
    {
        $organization = Organization::factory()->create();
        $user = User::factory()->create();
        OrganizationUser::create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role' => $role->value,
        ]);

        return [$organization, $user];
    }
}
