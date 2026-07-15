<?php

namespace Database\Seeders;

use App\Enums\OrganizationRole;
use App\Models\Audience;
use App\Models\Campaign;
use App\Models\Contact;
use App\Models\MessageTemplate;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $organization = Organization::updateOrCreate(
            ['slug' => 'wa-os-demo'],
            ['name' => 'WA OS Demo', 'timezone' => 'America/Sao_Paulo'],
        );

        $users = [
            OrganizationRole::Owner->value => ['Dona da Organização', 'owner@waos.test'],
            OrganizationRole::Admin->value => ['Administrador Demo', 'admin@waos.test'],
            OrganizationRole::Marketing->value => ['Marketing Demo', 'marketing@waos.test'],
            OrganizationRole::Analyst->value => ['Analista Demo', 'analyst@waos.test'],
        ];

        foreach ($users as $role => [$name, $email]) {
            $user = User::updateOrCreate(
                ['email' => $email],
                ['name' => $name, 'password' => Hash::make('Demo1234!'), 'email_verified_at' => now()],
            );
            $organization->memberships()->updateOrCreate(
                ['user_id' => $user->id],
                ['role' => $role],
            );
        }

        $demoContacts = [
            ['name' => 'Ana Rodrigues', 'phone' => '+55 11 94002-1030', 'email' => 'ana@example.test', 'team_name' => 'CRM', 'status' => 'active', 'tags' => ['VIP', 'Pós-compra'], 'last_seen_at' => now()->subMinutes(18)],
            ['name' => 'Bruno Lima', 'phone' => '+55 21 98812-4410', 'email' => 'bruno@example.test', 'team_name' => 'Growth', 'status' => 'active', 'tags' => ['Novo cliente'], 'last_seen_at' => now()->subHours(2)],
            ['name' => 'Carla Mendes', 'phone' => '+55 31 97770-8712', 'email' => 'carla@example.test', 'team_name' => 'Retenção', 'status' => 'inactive', 'tags' => ['30 dias sem compra'], 'last_seen_at' => now()->subDays(11)],
            ['name' => 'Diego Santos', 'phone' => '+55 41 99654-2201', 'email' => 'diego@example.test', 'team_name' => 'Produto', 'status' => 'active', 'tags' => ['Beta'], 'last_seen_at' => now()->subDay()],
        ];

        foreach ($demoContacts as $contact) {
            Contact::updateOrCreate(
                ['organization_id' => $organization->id, 'phone' => $contact['phone']],
                $contact,
            );
        }

        $demoAudiences = [
            ['name' => 'Clientes ativos', 'team_name' => 'CRM', 'source' => 'Segmento dinâmico', 'contact_count' => 8142, 'estimated_spend_amount' => 244260, 'rules' => ['Comprou nos últimos 45 dias'], 'refreshed_at' => now()->subMinutes(12)],
            ['name' => 'Novos clientes', 'team_name' => 'Growth', 'source' => 'Importação CSV', 'contact_count' => 4280, 'estimated_spend_amount' => 128400, 'rules' => ['Primeira compra em julho'], 'refreshed_at' => now()->subHours(4)],
            ['name' => 'Clientes inativos', 'team_name' => 'Retenção', 'source' => 'Segmento dinâmico', 'contact_count' => 2615, 'estimated_spend_amount' => 78450, 'rules' => ['Sem compra há 30 dias'], 'refreshed_at' => now()->subHours(1)],
            ['name' => 'Compraram nos últimos 14 dias', 'team_name' => 'CRM', 'source' => 'Segmento dinâmico', 'contact_count' => 1900, 'estimated_spend_amount' => 57000, 'rules' => ['Pedido entregue', 'Sem cupom ativo'], 'refreshed_at' => now()->subMinutes(47)],
        ];

        foreach ($demoAudiences as $audience) {
            Audience::updateOrCreate(
                ['organization_id' => $organization->id, 'name' => $audience['name']],
                $audience,
            );
        }

        $demoTemplates = [
            ['name' => 'Oferta relâmpago', 'team_name' => 'CRM', 'category' => 'marketing', 'status' => 'approved', 'language' => 'pt_BR', 'body' => 'Olá {{nome}}, sua oferta de inverno está pronta. Use o cupom {{cupom}} até hoje.', 'last_used_at' => now()->subMinutes(35)],
            ['name' => 'Boas-vindas pós-cadastro', 'team_name' => 'Growth', 'category' => 'onboarding', 'status' => 'approved', 'language' => 'pt_BR', 'body' => 'Bem-vindo ao Acme Studio, {{nome}}. Veja seus próximos passos aqui: {{link}}', 'last_used_at' => now()->subHours(7)],
            ['name' => 'Reativação 30 dias', 'team_name' => 'Retenção', 'category' => 'retention', 'status' => 'draft', 'language' => 'pt_BR', 'body' => '{{nome}}, sentimos sua falta. Preparamos uma condição especial para voltar.', 'last_used_at' => null],
        ];

        foreach ($demoTemplates as $template) {
            MessageTemplate::updateOrCreate(
                ['organization_id' => $organization->id, 'name' => $template['name']],
                $template,
            );
        }

        $audiencesByName = Audience::query()
            ->whereBelongsTo($organization)
            ->get()
            ->keyBy('name');
        $templatesByName = MessageTemplate::query()
            ->whereBelongsTo($organization)
            ->get()
            ->keyBy('name');

        $demoCampaigns = [
            [
                'name' => 'Boas-vindas de julho',
                'audience_name' => 'Novos clientes',
                'message_template_name' => 'Boas-vindas pós-cadastro',
                'team_name' => 'Growth',
                'status' => 'completed',
                'message_count' => 4280,
                'delivered_count' => 4164,
                'read_count' => 3698,
                'failed_count' => 116,
                'spend_amount' => 128400,
                'scheduled_at' => now()->subHours(7),
                'started_at' => now()->subHours(7)->addMinutes(2),
                'completed_at' => now()->subHours(6)->addMinutes(12),
            ],
            [
                'name' => 'Oferta de inverno',
                'audience_name' => 'Clientes ativos',
                'message_template_name' => 'Oferta relâmpago',
                'team_name' => 'CRM',
                'status' => 'sending',
                'message_count' => 8142,
                'delivered_count' => 6480,
                'read_count' => 4912,
                'failed_count' => 87,
                'spend_amount' => 244260,
                'scheduled_at' => now()->subMinutes(40),
                'started_at' => now()->subMinutes(35),
                'completed_at' => null,
            ],
            [
                'name' => 'Reativação 30 dias',
                'audience_name' => 'Clientes inativos',
                'message_template_name' => 'Reativação 30 dias',
                'team_name' => 'Retenção',
                'status' => 'scheduled',
                'message_count' => 2615,
                'delivered_count' => 0,
                'read_count' => 0,
                'failed_count' => 0,
                'spend_amount' => 78450,
                'scheduled_at' => now()->addDay()->setTime(10, 15),
                'started_at' => null,
                'completed_at' => null,
            ],
            [
                'name' => 'Cupom VIP pós-compra',
                'audience_name' => 'Compraram nos últimos 14 dias',
                'message_template_name' => 'Oferta relâmpago',
                'team_name' => 'CRM',
                'status' => 'draft',
                'message_count' => 1900,
                'delivered_count' => 0,
                'read_count' => 0,
                'failed_count' => 0,
                'spend_amount' => 57000,
                'scheduled_at' => null,
                'started_at' => null,
                'completed_at' => null,
            ],
        ];

        foreach ($demoCampaigns as $campaign) {
            $audience = $audiencesByName->get($campaign['audience_name']);
            $template = $templatesByName->get($campaign['message_template_name']);
            unset($campaign['message_template_name']);

            Campaign::updateOrCreate(
                ['organization_id' => $organization->id, 'name' => $campaign['name']],
                [
                    'channel' => 'whatsapp',
                    'audience_id' => $audience?->id,
                    'message_template_id' => $template?->id,
                    ...$campaign,
                ],
            );
        }
    }
}
