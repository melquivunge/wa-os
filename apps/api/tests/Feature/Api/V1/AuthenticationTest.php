<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:3000');
    }

    public function test_user_can_login_with_normalized_email_and_logout(): void
    {
        $user = User::factory()->create(['email' => 'owner@example.com', 'password' => Hash::make('Secret123!')]);

        $this->postJson('/api/v1/auth/login', ['email' => 'OWNER@EXAMPLE.COM', 'password' => 'Secret123!'])
            ->assertOk();
        $this->assertAuthenticatedAs($user);

        $this->postJson('/api/v1/auth/logout')->assertOk();
        $this->assertFalse(session()->isStarted());
    }

    public function test_invalid_login_is_rejected_and_rate_limited(): void
    {
        foreach (range(1, 6) as $_) {
            $this->postJson('/api/v1/auth/login', ['email' => 'none@example.com', 'password' => 'bad'])->assertUnprocessable();
        }
        $this->postJson('/api/v1/auth/login', ['email' => 'none@example.com', 'password' => 'bad'])->assertTooManyRequests();
    }

    public function test_password_reset_request_does_not_disclose_accounts(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk()->json();
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'unknown@example.com'])->assertOk()->json();

        $this->assertSame($known, $unknown);
        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create();
        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
    }
}
