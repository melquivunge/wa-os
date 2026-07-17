<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_templates', function (Blueprint $table): void {
            $table->string('provider_template_id', 120)->nullable()->after('organization_id');
            $table->unique(['organization_id', 'provider_template_id']);
        });
    }

    public function down(): void
    {
        Schema::table('message_templates', function (Blueprint $table): void {
            $table->dropUnique(['organization_id', 'provider_template_id']);
            $table->dropColumn('provider_template_id');
        });
    }
};
