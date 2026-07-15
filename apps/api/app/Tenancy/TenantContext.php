<?php

namespace App\Tenancy;

use App\Models\Organization;
use App\Models\OrganizationUser;
use LogicException;

class TenantContext
{
    private ?OrganizationUser $membership = null;

    public function set(OrganizationUser $membership): void
    {
        $this->membership = $membership->loadMissing('organization');
    }

    public function membership(): OrganizationUser
    {
        return $this->membership ?? throw new LogicException('Tenant context has not been resolved.');
    }

    public function organization(): Organization
    {
        return $this->membership()->organization;
    }
}
