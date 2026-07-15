# Security baseline

## Tenant boundary

Organization is the primary tenant. The active organization is derived from an authenticated membership. Request payloads never grant authority by supplying an `organization_id`.

Every organization-owned route, query, policy, action, job, and test must preserve this boundary. Cross-tenant resource identifiers must not reveal resource existence.

## Authentication and authorization

The first-party web application uses Laravel session authentication with CSRF protection. CORS and cookie domains are explicitly configured per environment. Backend policies enforce the role capability matrix; hidden frontend controls are not authorization.

## Data handling

Phone numbers, contact metadata, message variables, imports, and logs are PII. Logs exclude credentials and mask contact identifiers. Uploaded files are private, validated, processed asynchronously, and deleted according to the retention policy defined before production use.

## Secrets

Secrets live in environment configuration or the deployment secret store and are never committed, returned by API resources, or written to logs.
