<?php

namespace Tests\Feature\Api\V1;

use App\Enums\OrganizationRole;
use App\Models\Audience;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\MessageTemplate;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:3000');
    }

    public function test_campaigns_are_scoped_to_active_organization(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);
        $foreign = Organization::factory()->create();
        Campaign::create([
            'organization_id' => $organization->id,
            'name' => 'Owned campaign',
            'audience_name' => 'Customers',
            'message_count' => 100,
            'delivered_count' => 80,
        ]);
        Campaign::create([
            'organization_id' => $foreign->id,
            'name' => 'Foreign campaign',
            'audience_name' => 'Customers',
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson('/api/v1/campaigns')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Owned campaign')
            ->assertJsonMissing(['name' => 'Foreign campaign']);
    }

    public function test_marketing_can_create_campaign_and_analyst_cannot(): void
    {
        [$organization, $marketing] = $this->membership(OrganizationRole::Marketing);
        [, $analyst] = $this->membership(OrganizationRole::Analyst, $organization);
        [$audience, $template] = $this->campaignResources($organization);

        $this->actingAs($analyst)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/campaigns', [
                'name' => 'Read only attempt',
                'audience_id' => $audience->id,
                'message_template_id' => $template->id,
            ])->assertForbidden();

        $this->actingAs($marketing)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/campaigns', [
                'name' => 'Weekend promo',
                'audience_id' => $audience->id,
                'message_template_id' => $template->id,
                'status' => 'scheduled',
            ])->assertCreated()
            ->assertJsonPath('data.name', 'Weekend promo')
            ->assertJsonPath('data.audience_name', 'VIP customers')
            ->assertJsonPath('data.audience_id', $audience->id)
            ->assertJsonPath('data.message_template_id', $template->id)
            ->assertJsonPath('data.message_template_name', 'Weekend offer')
            ->assertJsonPath('data.status', 'scheduled')
            ->assertJsonPath('data.team_name', 'CRM')
            ->assertJsonPath('data.message_count', 450)
            ->assertJsonPath('data.spend_amount', 13500);
    }

    public function test_campaign_creation_rejects_resources_from_another_organization_and_unapproved_templates(): void
    {
        [$organization, $marketing] = $this->membership(OrganizationRole::Marketing);
        $foreign = Organization::factory()->create();
        [$audience] = $this->campaignResources($organization);
        $foreignAudience = Audience::create([
            'organization_id' => $foreign->id,
            'name' => 'Foreign audience',
            'team_name' => 'CRM',
        ]);
        $draftTemplate = MessageTemplate::create([
            'organization_id' => $organization->id,
            'name' => 'Draft template',
            'team_name' => 'CRM',
            'status' => 'draft',
            'body' => 'Draft',
        ]);
        $growthTemplate = MessageTemplate::create([
            'organization_id' => $organization->id,
            'name' => 'Growth template',
            'team_name' => 'Growth',
            'status' => 'approved',
            'body' => 'Growth',
        ]);

        $this->actingAs($marketing)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/campaigns', [
                'name' => 'Foreign resource attempt',
                'audience_id' => $foreignAudience->id,
                'message_template_id' => $draftTemplate->id,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors(['audience_id', 'message_template_id']);

        $this->actingAs($marketing)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/campaigns', [
                'name' => 'Draft template attempt',
                'audience_id' => $audience->id,
                'message_template_id' => $draftTemplate->id,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors(['message_template_id']);

        $this->actingAs($marketing)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/campaigns', [
                'name' => 'Wrong team template attempt',
                'audience_id' => $audience->id,
                'message_template_id' => $growthTemplate->id,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors(['message_template_id']);
    }

    public function test_summary_returns_totals_and_active_campaign(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);
        Campaign::create([
            'organization_id' => $organization->id,
            'name' => 'Running',
            'audience_name' => 'Active customers',
            'status' => 'sending',
            'message_count' => 1000,
            'delivered_count' => 640,
            'read_count' => 320,
            'failed_count' => 12,
            'team_name' => 'CRM',
            'spend_amount' => 30000,
        ]);
        Campaign::create([
            'organization_id' => $organization->id,
            'name' => 'Done',
            'audience_name' => 'New customers',
            'status' => 'completed',
            'message_count' => 500,
            'delivered_count' => 490,
            'read_count' => 410,
            'failed_count' => 10,
            'team_name' => 'Growth',
            'spend_amount' => 18000,
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson('/api/v1/campaigns/summary')
            ->assertOk()
            ->assertJsonPath('data.totals.sent', 1500)
            ->assertJsonPath('data.totals.delivered', 1130)
            ->assertJsonPath('data.totals.spend', 48000)
            ->assertJsonPath('data.active_campaign.name', 'Running')
            ->assertJsonPath('data.active_campaign.progress', 64)
            ->assertJsonPath('data.teams.0.name', 'CRM');
    }

    public function test_analytics_returns_team_and_campaign_performance(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);
        Campaign::create([
            'organization_id' => $organization->id,
            'name' => 'CRM promo',
            'audience_name' => 'Active customers',
            'status' => 'completed',
            'message_count' => 1000,
            'delivered_count' => 900,
            'read_count' => 630,
            'failed_count' => 100,
            'team_name' => 'CRM',
            'spend_amount' => 30000,
        ]);
        Campaign::create([
            'organization_id' => $organization->id,
            'name' => 'Growth welcome',
            'audience_name' => 'New customers',
            'status' => 'completed',
            'message_count' => 500,
            'delivered_count' => 450,
            'read_count' => 315,
            'failed_count' => 50,
            'team_name' => 'Growth',
            'spend_amount' => 15000,
        ]);
        Campaign::create([
            'organization_id' => Organization::factory()->create()->id,
            'name' => 'Foreign analytics',
            'audience_name' => 'Hidden',
            'message_count' => 9999,
            'team_name' => 'Foreign',
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson('/api/v1/campaigns/analytics')
            ->assertOk()
            ->assertJsonPath('data.totals.messages', 1500)
            ->assertJsonPath('data.totals.delivery_rate', 90)
            ->assertJsonPath('data.totals.read_rate', 70)
            ->assertJsonPath('data.totals.failure_rate', 10)
            ->assertJsonPath('data.teams.0.name', 'CRM')
            ->assertJsonPath('data.teams.0.share', 67)
            ->assertJsonPath('data.campaigns.0.name', 'CRM promo')
            ->assertJsonMissing(['name' => 'Foreign analytics']);
    }

    public function test_show_returns_campaign_detail_with_resources_and_timeline(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);
        $audience = Audience::create([
            'organization_id' => $organization->id,
            'name' => 'VIP buyers',
            'team_name' => 'CRM',
            'source' => 'Segmento dinâmico',
            'contact_count' => 750,
            'estimated_spend_amount' => 22500,
            'rules' => ['Comprou nos últimos 45 dias'],
        ]);
        $template = MessageTemplate::create([
            'organization_id' => $organization->id,
            'name' => 'VIP Offer',
            'team_name' => 'CRM',
            'category' => 'marketing',
            'status' => 'approved',
            'language' => 'pt_BR',
            'body' => 'Olá {{nome}}, sua oferta chegou.',
        ]);
        $campaign = Campaign::create([
            'organization_id' => $organization->id,
            'audience_id' => $audience->id,
            'message_template_id' => $template->id,
            'name' => 'VIP weekend',
            'audience_name' => $audience->name,
            'team_name' => 'CRM',
            'status' => 'completed',
            'message_count' => 750,
            'delivered_count' => 710,
            'read_count' => 550,
            'spend_amount' => 22500,
            'scheduled_at' => now()->subHours(3),
            'started_at' => now()->subHours(2),
            'completed_at' => now()->subHour(),
        ]);
        CampaignRecipient::create([
            'organization_id' => $organization->id,
            'campaign_id' => $campaign->id,
            'recipient_name' => 'Ana Rodrigues',
            'phone' => '+55 11 94002-1030',
            'status' => 'read',
            'last_event_at' => now()->subMinutes(20),
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson("/api/v1/campaigns/{$campaign->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'VIP weekend')
            ->assertJsonPath('data.audience.id', $audience->id)
            ->assertJsonPath('data.audience.contact_count', 750)
            ->assertJsonPath('data.message_template.id', $template->id)
            ->assertJsonPath('data.message_template.category', 'marketing')
            ->assertJsonPath('data.recipients.0.name', 'Ana Rodrigues')
            ->assertJsonPath('data.recipients.0.phone', '+55 ••••-1030')
            ->assertJsonPath('data.recipients.0.status', 'read')
            ->assertJsonPath('data.timeline.0.label', 'Criada')
            ->assertJsonPath('data.timeline.3.state', 'done');
    }

    public function test_show_hides_campaign_from_another_organization(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);
        $foreign = Organization::factory()->create();
        $campaign = Campaign::create([
            'organization_id' => $foreign->id,
            'name' => 'Foreign campaign',
            'audience_name' => 'Hidden audience',
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson("/api/v1/campaigns/{$campaign->id}")
            ->assertNotFound();
    }

    /** @return array{Organization, User} */
    private function membership(OrganizationRole $role, ?Organization $organization = null): array
    {
        $organization ??= Organization::factory()->create();
        $user = User::factory()->create();
        $organization->memberships()->create(['user_id' => $user->id, 'role' => $role]);

        return [$organization, $user];
    }

    /** @return array{Audience, MessageTemplate} */
    private function campaignResources(Organization $organization): array
    {
        $audience = Audience::create([
            'organization_id' => $organization->id,
            'name' => 'VIP customers',
            'team_name' => 'CRM',
            'contact_count' => 450,
            'estimated_spend_amount' => 13500,
        ]);
        $template = MessageTemplate::create([
            'organization_id' => $organization->id,
            'name' => 'Weekend offer',
            'team_name' => 'CRM',
            'category' => 'marketing',
            'status' => 'approved',
            'body' => 'Olá {{nome}}, sua oferta chegou.',
        ]);

        return [$audience, $template];
    }
}
