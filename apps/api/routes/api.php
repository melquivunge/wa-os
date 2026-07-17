<?php

use App\Http\Controllers\Api\V1\AudienceController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CampaignController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\ContactImportController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\MessageTemplateController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\OrganizationMemberController;
use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Http\Controllers\Api\V1\WhatsAppAccountController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', HealthController::class)->name('api.v1.health');
    Route::middleware('throttle:6,1')->group(function (): void {
        Route::post('/auth/login', [AuthController::class, 'login'])->name('api.v1.auth.login');
        Route::post('/auth/forgot-password', [PasswordResetController::class, 'request'])->name('api.v1.auth.password.request');
        Route::post('/auth/reset-password', [PasswordResetController::class, 'reset'])->name('api.v1.auth.password.reset');
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.v1.auth.logout');
        Route::get('/organizations', [OrganizationController::class, 'index'])->name('api.v1.organizations.index');
        Route::post('/organizations', [OrganizationController::class, 'store'])->name('api.v1.organizations.store');

        Route::middleware('tenant')->group(function (): void {
            Route::get('/me', MeController::class)->name('api.v1.me');
            Route::get('/organizations/{organization}', [OrganizationController::class, 'show'])->name('api.v1.organizations.show');
            Route::patch('/organizations/{organization}', [OrganizationController::class, 'update'])->name('api.v1.organizations.update');
            Route::get('/organizations/{organization}/members', [OrganizationMemberController::class, 'index'])->name('api.v1.organizations.members.index');
            Route::post('/organizations/{organization}/members', [OrganizationMemberController::class, 'store'])->name('api.v1.organizations.members.store');
            Route::patch('/organizations/{organization}/members/{member}', [OrganizationMemberController::class, 'update'])->name('api.v1.organizations.members.update');
            Route::delete('/organizations/{organization}/members/{member}', [OrganizationMemberController::class, 'destroy'])->name('api.v1.organizations.members.destroy');
            Route::get('/campaigns/summary', [CampaignController::class, 'summary'])->name('api.v1.campaigns.summary');
            Route::get('/campaigns/analytics', [CampaignController::class, 'analytics'])->name('api.v1.campaigns.analytics');
            Route::get('/campaigns', [CampaignController::class, 'index'])->name('api.v1.campaigns.index');
            Route::post('/campaigns', [CampaignController::class, 'store'])->name('api.v1.campaigns.store');
            Route::get('/campaigns/{campaign}', [CampaignController::class, 'show'])->name('api.v1.campaigns.show');
            Route::post('/campaigns/{campaign}/validate', [CampaignController::class, 'validateCampaign'])->name('api.v1.campaigns.validate');
            Route::post('/campaigns/{campaign}/start', [CampaignController::class, 'start'])->name('api.v1.campaigns.start');
            Route::post('/campaigns/{campaign}/pause', [CampaignController::class, 'pause'])->name('api.v1.campaigns.pause');
            Route::post('/campaigns/{campaign}/resume', [CampaignController::class, 'resume'])->name('api.v1.campaigns.resume');
            Route::post('/campaigns/{campaign}/cancel', [CampaignController::class, 'cancel'])->name('api.v1.campaigns.cancel');
            Route::get('/contacts', [ContactController::class, 'index'])->name('api.v1.contacts.index');
            Route::get('/contact-imports', [ContactImportController::class, 'index'])->name('api.v1.contact-imports.index');
            Route::post('/contact-imports', [ContactImportController::class, 'store'])->name('api.v1.contact-imports.store');
            Route::get('/audiences', [AudienceController::class, 'index'])->name('api.v1.audiences.index');
            Route::post('/audiences', [AudienceController::class, 'store'])->name('api.v1.audiences.store');
            Route::get('/templates', [MessageTemplateController::class, 'index'])->name('api.v1.templates.index');
            Route::post('/templates/sync', [MessageTemplateController::class, 'sync'])->name('api.v1.templates.sync');
            Route::get('/whatsapp-accounts', [WhatsAppAccountController::class, 'index'])->name('api.v1.whatsapp-accounts.index');
            Route::post('/whatsapp-accounts', [WhatsAppAccountController::class, 'store'])->name('api.v1.whatsapp-accounts.store');
            Route::post('/whatsapp-accounts/{account}/validate', [WhatsAppAccountController::class, 'validateConnection'])->name('api.v1.whatsapp-accounts.validate');
        });
    });
});
