<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table): void {
            $table->string('team_name', 120)->default('Marketing')->after('audience_name');
            $table->unsignedInteger('spend_amount')->default(0)->after('failed_count');

            $table->index(['organization_id', 'team_name']);
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table): void {
            $table->dropIndex(['organization_id', 'team_name']);
            $table->dropColumn(['team_name', 'spend_amount']);
        });
    }
};
