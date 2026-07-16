<?php

namespace Tests\Feature\Api\V1;

use App\Enums\OrganizationRole;
use App\Models\Audience;
use App\Models\Contact;
use App\Models\ContactImport;
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

    public function test_marketing_can_build_audience_from_contacts(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Marketing);

        Contact::create([
            'organization_id' => $organization->id,
            'name' => 'Vip Active',
            'phone' => '+5511999990301',
            'team_name' => 'CRM',
            'status' => 'active',
            'tags' => ['VIP', 'Julho'],
        ]);
        Contact::create([
            'organization_id' => $organization->id,
            'name' => 'Vip Inactive',
            'phone' => '+5511999990302',
            'team_name' => 'CRM',
            'status' => 'inactive',
            'tags' => ['VIP'],
        ]);
        Contact::create([
            'organization_id' => $organization->id,
            'name' => 'Other Active',
            'phone' => '+5511999990303',
            'team_name' => 'CRM',
            'status' => 'active',
            'tags' => ['Regular'],
        ]);
        Contact::create([
            'organization_id' => $organization->id,
            'name' => 'Foreign Team',
            'phone' => '+5511999990304',
            'team_name' => 'Growth',
            'status' => 'active',
            'tags' => ['VIP'],
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/audiences', [
                'name' => 'VIP ativos',
                'team_name' => 'CRM',
                'status' => 'active',
                'tag' => 'VIP',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'VIP ativos')
            ->assertJsonPath('data.contact_count', 1)
            ->assertJsonPath('data.estimated_spend_amount', 30)
            ->assertJsonPath('data.rules.2', 'Tag: VIP');

        $this->assertDatabaseHas('audiences', [
            'organization_id' => $organization->id,
            'name' => 'VIP ativos',
            'team_name' => 'CRM',
            'contact_count' => 1,
            'estimated_spend_amount' => 30,
        ]);
    }

    public function test_analyst_cannot_build_audience(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/audiences', [
                'name' => 'Bloqueado',
                'team_name' => 'CRM',
                'status' => 'all',
            ])
            ->assertForbidden();
    }

    public function test_audience_builder_rejects_duplicate_name_in_same_tenant(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Marketing);

        Audience::create([
            'organization_id' => $organization->id,
            'name' => 'Clientes VIP',
            'team_name' => 'CRM',
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/audiences', [
                'name' => 'Clientes VIP',
                'team_name' => 'CRM',
                'status' => 'all',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_audience_builder_rejects_empty_segments(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Marketing);

        Contact::create([
            'organization_id' => $organization->id,
            'name' => 'Growth Active',
            'phone' => '+5511999990305',
            'team_name' => 'Growth',
            'status' => 'active',
            'tags' => ['VIP'],
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/audiences', [
                'name' => 'CRM vazio',
                'team_name' => 'CRM',
                'status' => 'active',
                'tag' => 'VIP',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('team_name');

        $this->assertDatabaseMissing('audiences', ['name' => 'CRM vazio']);
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

    public function test_marketing_can_sync_demo_templates(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Marketing);

        MessageTemplate::create([
            'organization_id' => $organization->id,
            'name' => 'Oferta relâmpago',
            'team_name' => 'CRM',
            'category' => 'marketing',
            'status' => 'draft',
            'language' => 'pt_BR',
            'body' => 'old',
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/templates/sync')
            ->assertOk()
            ->assertJsonPath('data.created', 4)
            ->assertJsonPath('data.updated', 1)
            ->assertJsonPath('data.approved', 4)
            ->assertJsonPath('data.rejected', 1);

        $this->assertDatabaseHas('message_templates', [
            'organization_id' => $organization->id,
            'name' => 'Oferta relâmpago',
            'status' => 'approved',
            'body' => 'Olá {{nome}}, sua oferta de inverno está pronta. Use o cupom {{cupom}} até hoje.',
        ]);
        $this->assertDatabaseHas('message_templates', [
            'organization_id' => $organization->id,
            'name' => 'Cupom aniversário',
            'status' => 'rejected',
        ]);
    }

    public function test_analyst_cannot_sync_demo_templates(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/templates/sync')
            ->assertForbidden();

        $this->assertDatabaseMissing('message_templates', ['name' => 'Confirmação de pedido']);
    }

    public function test_marketing_can_import_contacts_from_demo_csv(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Marketing);

        $csv = implode("\n", [
            'name,phone,email,status,tags',
            'Nova Cliente,+5511999990101,NOVA@EXAMPLE.TEST,active,VIP|Julho',
            ',+5511999990102,semnome@example.test,active,Erro',
            'Cliente Sem Email,+5511999990103,,inactive,Retenção',
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/contact-imports', [
                'source_name' => 'Planilha julho',
                'team_name' => 'Growth',
                'csv_text' => $csv,
            ])
            ->assertCreated()
            ->assertJsonPath('data.source_name', 'Planilha julho')
            ->assertJsonPath('data.team_name', 'Growth')
            ->assertJsonPath('data.total_rows', 3)
            ->assertJsonPath('data.accepted_rows', 2)
            ->assertJsonPath('data.failed_rows', 1)
            ->assertJsonPath('data.failure_samples.0.line', 3);

        $this->assertDatabaseHas('contacts', [
            'organization_id' => $organization->id,
            'phone' => '+5511999990101',
            'email' => 'nova@example.test',
            'team_name' => 'Growth',
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('contacts', [
            'organization_id' => $organization->id,
            'phone' => '+5511999990103',
            'team_name' => 'Growth',
            'status' => 'inactive',
        ]);
        $this->assertDatabaseHas('contact_imports', [
            'organization_id' => $organization->id,
            'source_name' => 'Planilha julho',
            'accepted_rows' => 2,
            'failed_rows' => 1,
        ]);
    }

    public function test_analyst_cannot_import_contacts(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/contact-imports', [
                'source_name' => 'Blocked',
                'team_name' => 'CRM',
                'csv_text' => "name,phone\nSem Permissão,+5511999990201",
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('contact_imports', ['source_name' => 'Blocked']);
    }

    public function test_contact_import_rejects_csv_without_contact_rows(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Marketing);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/contact-imports', [
                'source_name' => 'Empty',
                'team_name' => 'CRM',
                'csv_text' => 'name,phone,email',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('csv_text');

        $this->assertDatabaseMissing('contact_imports', ['source_name' => 'Empty']);
    }

    public function test_contact_imports_are_tenant_scoped(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);
        $foreign = Organization::factory()->create();

        ContactImport::create([
            'organization_id' => $organization->id,
            'source_name' => 'Owned import',
            'team_name' => 'CRM',
            'total_rows' => 1,
            'accepted_rows' => 1,
            'processed_at' => now(),
        ]);
        ContactImport::create([
            'organization_id' => $foreign->id,
            'source_name' => 'Foreign import',
            'team_name' => 'CRM',
            'total_rows' => 1,
            'accepted_rows' => 1,
            'processed_at' => now(),
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson('/api/v1/contact-imports')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.source_name', 'Owned import')
            ->assertJsonMissing(['source_name' => 'Foreign import']);
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
