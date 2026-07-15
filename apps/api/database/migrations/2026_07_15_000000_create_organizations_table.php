<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug');
            $table->string('timezone')->default('UTC');
            $table->timestamps();
        });

        Schema::create('organization_users', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20);
            $table->timestamps();
            $table->unique(['organization_id', 'user_id']);
            $table->index(['user_id', 'organization_id']);
        });

        Schema::getConnection()->statement('CREATE UNIQUE INDEX users_email_lower_unique ON users (LOWER(email))');
        Schema::getConnection()->statement('CREATE UNIQUE INDEX organizations_slug_lower_unique ON organizations (LOWER(slug))');
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_users');
        Schema::dropIfExists('organizations');
        Schema::getConnection()->statement('DROP INDEX IF EXISTS users_email_lower_unique');
    }
};
