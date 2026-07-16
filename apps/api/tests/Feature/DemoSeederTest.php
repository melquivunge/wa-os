<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_demo_admin_credentials(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::query()->where('email', 'admin@waos.test')->first();

        $this->assertNotNull($admin);
        $this->assertSame('Administrador Demo', $admin->name);
        $this->assertTrue(Hash::check('Demo1234!', $admin->password));
        $this->assertTrue($admin->memberships()->whereHas('organization', fn ($query) => $query->where('slug', 'wa-os-demo'))->exists());
    }
}
