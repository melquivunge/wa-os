<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
