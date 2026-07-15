<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name', 140);
            $table->string('phone', 40);
            $table->string('email', 160)->nullable();
            $table->string('team_name', 120)->default('CRM');
            $table->string('status', 30)->default('active');
            $table->json('tags')->nullable();
            $table->timestampTz('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'phone']);
            $table->index(['organization_id', 'team_name']);
            $table->index(['organization_id', 'status']);
        });

        Schema::create('audiences', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name', 140);
            $table->string('team_name', 120)->default('CRM');
            $table->string('source', 80)->default('manual');
            $table->unsignedInteger('contact_count')->default(0);
            $table->unsignedInteger('estimated_spend_amount')->default(0);
            $table->json('rules')->nullable();
            $table->timestampTz('refreshed_at')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'name']);
            $table->index(['organization_id', 'team_name']);
        });

        Schema::create('message_templates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name', 140);
            $table->string('team_name', 120)->default('CRM');
            $table->string('category', 80)->default('marketing');
            $table->string('status', 30)->default('draft');
            $table->string('language', 12)->default('pt_BR');
            $table->text('body');
            $table->timestampTz('last_used_at')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'name', 'language']);
            $table->index(['organization_id', 'team_name']);
            $table->index(['organization_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_templates');
        Schema::dropIfExists('audiences');
        Schema::dropIfExists('contacts');
    }
};
