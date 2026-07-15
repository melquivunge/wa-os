# ADR 0005: Identifiers and tenant role capabilities

Status: accepted
Date: 2026-07-15

## Identifiers

Users, organizations, memberships, and future public domain records use application-generated UUIDv7 identifiers stored as native PostgreSQL UUID values. Business uniqueness is enforced independently with database constraints and tenant-leading indexes.

Email and organization slug uniqueness are case-insensitive. Organization timezone is a dedicated IANA timezone column. Memberships are unique by organization and user.

## Roles and capabilities

Tenant roles are backed by an enum:

- `owner`
- `admin`
- `marketing`
- `analyst`

Authorization uses a centralized capability map and Laravel policies or gates. Controllers do not compare arbitrary role strings. Analyst is read-only. Marketing cannot manage organization security or provider credentials. Admin cannot manage owner-only organization security. Owner has all tenant capabilities.

The last owner of an organization cannot be removed or demoted. Platform Super Admin authorization is separate from tenant membership roles.

## Consequences

Tests use a table-driven role-by-capability matrix. Database constraints reinforce duplicate-membership and relationship invariants, while policies remain authoritative for business permissions.
