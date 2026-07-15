<?php

namespace App\Enums;

enum OrganizationRole: string
{
    case Owner = 'owner';
    case Admin = 'admin';
    case Marketing = 'marketing';
    case Analyst = 'analyst';

    /** @return list<Capability> */
    public function capabilities(): array
    {
        return match ($this) {
            self::Owner => Capability::cases(),
            self::Admin => [Capability::ManageMembers, Capability::ManageMarketingData, Capability::ViewAnalytics],
            self::Marketing => [Capability::ManageMarketingData, Capability::ViewAnalytics],
            self::Analyst => [Capability::ViewAnalytics],
        };
    }

    public function allows(Capability $capability): bool
    {
        return in_array($capability, $this->capabilities(), true);
    }

    public function canManageOrganization(): bool
    {
        return $this->allows(Capability::ManageOrganization);
    }

    public function canManageMembers(): bool
    {
        return $this->allows(Capability::ManageMembers);
    }

    public function canWriteMarketingData(): bool
    {
        return $this->allows(Capability::ManageMarketingData);
    }
}
