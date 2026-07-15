<?php

namespace Database\Seeders;

use App\Enums\OrganizationRole;
use App\Models\Campaign;
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

        $demoCampaigns = [
            [
                'name' => 'Boas-vindas de julho',
                'audience_name' => 'Novos clientes',
                'status' => 'completed',
                'message_count' => 4280,
                'delivered_count' => 4164,
                'read_count' => 3698,
                'failed_count' => 116,
                'scheduled_at' => now()->subHours(7),
                'started_at' => now()->subHours(7)->addMinutes(2),
                'completed_at' => now()->subHours(6)->addMinutes(12),
            ],
            [
                'name' => 'Oferta de inverno',
                'audience_name' => 'Clientes ativos',
                'status' => 'sending',
                'message_count' => 8142,
                'delivered_count' => 6480,
                'read_count' => 4912,
                'failed_count' => 87,
                'scheduled_at' => now()->subMinutes(40),
                'started_at' => now()->subMinutes(35),
                'completed_at' => null,
            ],
            [
                'name' => 'Reativação 30 dias',
                'audience_name' => 'Clientes inativos',
                'status' => 'scheduled',
                'message_count' => 2615,
                'delivered_count' => 0,
                'read_count' => 0,
                'failed_count' => 0,
                'scheduled_at' => now()->addDay()->setTime(10, 15),
                'started_at' => null,
                'completed_at' => null,
            ],
            [
                'name' => 'Cupom VIP pós-compra',
                'audience_name' => 'Compraram nos últimos 14 dias',
                'status' => 'draft',
                'message_count' => 1900,
                'delivered_count' => 0,
                'read_count' => 0,
                'failed_count' => 0,
                'scheduled_at' => null,
                'started_at' => null,
                'completed_at' => null,
            ],
        ];

        foreach ($demoCampaigns as $campaign) {
            Campaign::updateOrCreate(
                ['organization_id' => $organization->id, 'name' => $campaign['name']],
                ['channel' => 'whatsapp', ...$campaign],
            );
        }
    }
}
