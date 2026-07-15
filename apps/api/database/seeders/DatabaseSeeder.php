<?php

namespace Database\Seeders;

use App\Enums\OrganizationRole;
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
    }
}
