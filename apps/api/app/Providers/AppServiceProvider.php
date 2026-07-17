<?php

namespace App\Providers;

use App\Contracts\MessagingProvider;
use App\Services\MetaWhatsAppProvider;
use App\Tenancy\TenantContext;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->scoped(TenantContext::class);
        $this->app->bind(MessagingProvider::class, MetaWhatsAppProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(fn (object $user, string $token): string => sprintf(
            '%s/reset-password?token=%s&email=%s',
            rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/'),
            urlencode($token),
            urlencode($user->getEmailForPasswordReset()),
        ));
    }
}
