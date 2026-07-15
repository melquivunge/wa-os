<?php

namespace Tests\Feature\Api\V1;

use Tests\TestCase;

final class HealthTest extends TestCase
{
    public function test_health_endpoint_reports_the_api_is_available(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertExactJson([
                'status' => 'ok',
                'service' => 'wa-os-api',
            ]);
    }
}
