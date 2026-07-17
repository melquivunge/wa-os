<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_accounts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name', 140);
            $table->string('business_account_id', 120)->nullable();
            $table->string('phone_number_id', 120)->nullable();
            $table->string('display_phone_number', 40)->nullable();
            $table->text('access_token')->nullable();
            $table->string('provider', 30)->default('meta');
            $table->string('status', 30)->default('pending');
            $table->json('metadata')->nullable();
            $table->timestampTz('last_validated_at')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'phone_number_id']);
            $table->index(['organization_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_accounts');
    }
};
