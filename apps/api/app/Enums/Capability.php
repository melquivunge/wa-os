<?php

namespace App\Enums;

enum Capability: string
{
    case ManageOrganization = 'manage_organization';
    case ManageMembers = 'manage_members';
    case ManageProviderCredentials = 'manage_provider_credentials';
    case ManageMarketingData = 'manage_marketing_data';
    case ViewAnalytics = 'view_analytics';
}
