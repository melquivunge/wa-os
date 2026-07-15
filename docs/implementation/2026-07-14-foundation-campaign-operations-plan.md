# WA OS — Foundation and Campaign Operations Implementation Plan

Date: 2026-07-14
Branch: `feat/foundation-campaign-operations`
Design: `docs/superpowers/specs/2026-07-14-wa-os-foundation-design.md`

## Delivery rule

Build in vertical gates. Every gate must run in a clean environment, have automated verification, and preserve tenant isolation. The responsive dashboard shell may appear early, but final metrics and visual polish depend on the reliable message-event projection built later.

## Gate 0 — Architecture baseline

- Record fixed runtime versions and root development commands.
- Create architecture documents for system boundaries, data model, queues, security, and the simulated provider.
- Add ADRs for modular monolith boundaries, tenant resolution, Next/Laravel authentication, IDs and database constraints, campaign lifecycle, queue topology, provider abstraction, message-event idempotency, analytics projections, and PII handling.
- Define API v1 response, error, filtering, and pagination conventions.
- Define campaign statuses separately from message lifecycle statuses.

Acceptance: architectural decisions required by the first schema and authentication work are explicit and internally consistent.

## Gate 1 — Executable monorepo

- Scaffold `apps/web` with Next.js, TypeScript, Tailwind CSS, and the approved component foundation.
- Scaffold `apps/api` with Laravel and modular domain directories.
- Add Docker Compose services for PostgreSQL and Redis with health checks and persistent development volumes.
- Add root commands for setup, start, stop, migration, seed, test, lint, format, and type checking.
- Add environment examples, repository ignores, API and web health endpoints, and CI checks.

Acceptance: a clean clone installs, starts, migrates, seeds the minimum dataset, and runs both test suites using documented commands.

## Gate 2 — Identity, organizations, and authorization

- Implement session authentication and password recovery.
- Implement organizations, memberships, roles, and organization timezone.
- Resolve the active organization from the authenticated membership, never from untrusted request authority.
- Implement tenant-scoped route binding, policies, and query scopes.
- Build the responsive authenticated shell: persistent desktop sidebar, compact tablet navigation, and mobile bottom navigation.
- Seed one organization and one user for each initial role.

Acceptance: authentication and role flows work; cross-tenant identifiers cannot read or mutate resources; the shell is usable by keyboard and at desktop and mobile viewports.

## Gate 3 — Contacts, imports, audiences, and templates

- Implement normalized contacts with metadata, status, indexes, and tenant ownership.
- Implement secure CSV upload records, explicit column mapping, background chunk processing, per-row failures, and spreadsheet-formula-safe exports.
- Implement static audiences and membership counts.
- Implement simulated WhatsApp accounts and provider-synchronized approved/rejected templates.
- Build responsive list, detail, empty, loading, failure, and permission states.
- Seed deterministic contacts, imports, audiences, accounts, and templates.

Acceptance: an Admin can import demo contacts asynchronously, create a static audience, and inspect synchronized templates without crossing tenant boundaries.

## Gate 4 — Campaign drafts and validation

- Implement campaign enums and a centralized transition policy.
- Implement the four-step persisted campaign wizard.
- Validate account, audience, approved template, variables, schedule, permissions, and suppression rules.
- Resolve recipients in pages and persist immutable campaign snapshots for audience, template, and variable mapping.
- Record audit events and distinguish estimated cost from actual cost.
- Define transactional pause, resume, cancel, and claim semantics.

Acceptance: a Marketing user can persist and resume a valid draft, preview its resolved content, and schedule it; invalid transitions, concurrency conflicts, and unauthorized changes are rejected.

## Gate 5 — Reliable simulated delivery

- Implement atomic UTC scheduler claims and progressive campaign batching.
- Separate orchestration, dispatch, and provider-event queues.
- Implement messages, outbound attempts, normalized message events, unique provider event identifiers, and idempotency keys.
- Implement retry classification, exponential backoff, terminal failures, and masked diagnostic logging.
- Make the simulator deterministic with a fixed seed and controllable clock; cover duplicate and out-of-order events.

Acceptance: immediate and scheduled campaigns progress without duplicate dispatch, tolerate job retries, respect pause/cancel races, and produce a durable event history.

## Gate 6 — Projections, analytics, and operational UI

- Apply message events through monotonic, idempotent transitions.
- Build campaign and organization daily projections with uniqueness constraints and a reconciliation command.
- Connect dashboard metrics, activity chart, recent campaigns, alerts, campaign detail, and lifecycle trail to real API data.
- Keep campaign status and recipient message states visually distinct.
- Finish responsive tables-to-cards behavior, mobile fixed wizard actions, chart resizing, and reduced-motion support.

Acceptance: a Marketing user sends a seeded campaign and an Analyst observes correct sent, delivery, read, and failure metrics on desktop and mobile without double counting.

## Gate 7 — Hardening and milestone acceptance

- Run dedicated security review for authentication, tenancy, uploads, PII, secrets, and logs.
- Run independent code review and accessibility/responsive review.
- Load-test import parsing, recipient resolution, scheduler claims, dispatch batching, and projection updates at representative local volumes.
- Add queue observability, failed-job operations, structured masked logs, and documented recovery procedures.
- Verify clean-environment setup and the complete end-to-end acceptance journey.

Acceptance: all automated checks pass, critical security findings are resolved, operational recovery is documented, and the approved milestone works from a clean clone.

## First implementation slice

Start with Gate 0 and Gate 1 only. Do not generate domain tables before the tenant, ID, authentication, PII, and lifecycle ADRs establish the constraints those tables must preserve.
