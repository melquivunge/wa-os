# ADR 0004: Tenant resolution and enforcement

Status: accepted
Date: 2026-07-15

## Context

Organization is the WA OS tenant boundary. A user may belong to multiple organizations, and an identifier supplied by a client must never grant tenant authority.

## Decision

Organizations and users are connected through memberships. The selected organization identifier is stored in the authenticated server session and revalidated against a current membership and active organization on every tenant-owned request.

A request-scoped tenant context exposes the active organization and membership. Controllers and domain actions obtain organization ownership from this context, never from an `organization_id` request field.

Organization-owned resources use tenant-scoped queries and route binding. A valid resource identifier belonging to another tenant returns `404` to avoid disclosing its existence. Policies still enforce capabilities after tenant scoping. Queue jobs carry an explicit organization identifier and do not depend on an HTTP session.

The active organization can be changed only to an organization with a current membership. Membership removal or organization suspension takes effect on the next request.

## Consequences

Tenant isolation must be tested for every organization-owned resource. Global Eloquent scopes are not the only security boundary because administrative and queued work require explicit context.
