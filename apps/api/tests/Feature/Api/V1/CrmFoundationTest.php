<?php

namespace Tests\Feature\Api\V1;

use App\Enums\OrganizationRole;
use App\Models\Audience;
use App\Models\Contact;
use App\Models\MessageTemplate;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmFoundationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:3000');
    }

    public function test_contacts_are_tenant_scoped_and_filterable_by_team(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);
        $foreign = Organization::factory()->create();

        Contact::create([
            'organization_id' => $organization->id,
            'name' => 'Owned Quality',
            'phone' => '+5511999990001',
            'team_name' => 'Quality',
        ]);
        Contact::create([
            'organization_id' => $organization->id,
            'name' => 'Owned Growth',
            'phone' => '+5511999990002',
            'team_name' => 'Growth',
        ]);
        Contact::create([
            'organization_id' => $foreign->id,
            'name' => 'Foreign Quality',
            'phone' => '+5511999990003',
            'team_name' => 'Quality',
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson('/api/v1/contacts?team=Quality')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Owned Quality')
            ->assertJsonMissing(['name' => 'Foreign Quality']);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson('/api/v1/contacts?team=all&status=all')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_audiences_are_tenant_scoped(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);
        $foreign = Organization::factory()->create();

        Audience::create([
            'organization_id' => $organization->id,
            'name' => 'Clientes ativos',
            'team_name' => 'Quality',
            'contact_count' => 120,
            'estimated_spend_amount' => 3600,
        ]);
        Audience::create([
            'organization_id' => $foreign->id,
            'name' => 'Foreign audience',
            'team_name' => 'Quality',
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson('/api/v1/audiences?team=Quality')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.estimated_spend_amount', 3600)
            ->assertJsonMissing(['name' => 'Foreign audience']);
    }

    public function test_message_templates_are_tenant_scoped(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);
        $foreign = Organization::factory()->create();

        MessageTemplate::create([
            'organization_id' => $organization->id,
            'name' => 'Oferta VIP',
            'team_name' => 'Quality',
            'category' => 'marketing',
            'status' => 'approved',
            'body' => 'Olá {{nome}}, sua oferta chegou.',
        ]);
        MessageTemplate::create([
            'organization_id' => $organization->id,
            'name' => 'Confirmação',
            'team_name' => 'Produto',
            'category' => 'utility',
            'status' => 'approved',
            'body' => 'Seu pedido foi confirmado.',
        ]);
        MessageTemplate::create([
            'organization_id' => $foreign->id,
            'name' => 'Foreign template',
            'team_name' => 'Quality',
            'body' => 'Hidden',
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson('/api/v1/templates?team=Quality&category=marketing')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Oferta VIP')
            ->assertJsonPath('data.0.status', 'approved')
            ->assertJsonMissing(['name' => 'Foreign template']);
    }

    /** @return array{Organization, User} */
    private function membership(OrganizationRole $role): array
    {
        $organization = Organization::factory()->create();
        $user = User::factory()->create();
        $organization->memberships()->create(['user_id' => $user->id, 'role' => $role]);

        return [$organization, $user];
    }
}
