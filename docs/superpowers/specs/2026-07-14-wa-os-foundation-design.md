# WA OS — Foundation and Campaign Operations Design

Date: 2026-07-14
Status: approved for implementation planning

## Objective

Build the first production-oriented vertical slice of WA OS, a multi-tenant WhatsApp campaign operations platform. This milestone includes authentication, organizations, dashboard analytics, contacts, static audiences, synchronized demo templates, campaign creation, scheduled simulated delivery, and lifecycle tracking.

The real Meta WhatsApp Business Platform integration is explicitly deferred. The milestone uses a provider simulator behind the same boundary intended for the future Meta adapter.

## Scope

### Included

- Email/password authentication, session persistence, and password recovery.
- Organization tenant context and membership-based authorization.
- Organization Owner, Admin, Marketing, and Analyst roles.
- Dashboard metrics backed by PostgreSQL data.
- Contacts and a demonstrative import workflow.
- Static audiences and audience membership.
- Message templates synchronized from a simulated provider.
- Four-step campaign wizard with persisted drafts.
- Immediate and scheduled campaign execution through Redis-backed queues.
- Simulated message events for sent, delivered, read, and failed states.
- Campaign detail, recipient/message tracking, and aggregate analytics.
- Demo seeders containing coherent users, organizations, contacts, templates, campaigns, messages, and lifecycle events.
- Responsive desktop, tablet, and mobile interfaces.

### Excluded

- Real Meta authorization, API requests, template synchronization, and webhook processing.
- Dynamic audiences.
- Template creation and Meta approval workflows.
- CRM, shared inbox, chatbot builder, sales pipeline, and automation builder features.
- Super Admin infrastructure tooling beyond what is required to support seeded development data.

## Architecture

The repository will be a monorepo with independently deployable frontend and backend applications:

```text
wa-os/
├── apps/
│   ├── web/       Next.js, TypeScript, Tailwind CSS, shadcn/ui
│   └── api/       Laravel, PostgreSQL, Redis, queues
├── infra/         Docker development services and configuration
└── docs/          Architecture, decisions, and implementation plans
```

The frontend consumes a versioned JSON API. Laravel owns authentication, authorization, tenant isolation, validation, and domain behavior. Next.js owns rendering, interaction state, form experience, and server-state synchronization. Frontend validation improves usability but never replaces backend validation.

The backend follows the modular-monolith boundaries defined by the project: Organization, WhatsApp, Contact, Audience, Template, Campaign, Message, and Analytics. Controllers translate HTTP requests and responses; domain actions and services own behavior; queue jobs coordinate asynchronous work without containing provider or domain rules.

## Provider Boundary

The WhatsApp domain exposes a provider contract for account access, template synchronization, and message submission. The first implementation is a deterministic simulator.

Campaign dispatch produces provider submissions and normalized lifecycle events. The simulator schedules transitions through `sent`, `delivered`, `read`, or `failed` states. The future Meta adapter will implement the same contract and convert Graph API responses and webhook payloads into the same normalized events.

Provider event identifiers are unique. Processing is idempotent so repeated events cannot create duplicate message transitions or inflate analytics.

## Tenant and Authorization Model

Organization is the primary tenant boundary. Users access organization-owned resources only through an authenticated membership. The API does not accept an arbitrary organization identifier as authority.

Every organization-owned query is scoped to the active membership. Route-model resolution, policies, domain actions, and tests must prevent cross-organization access even when a valid resource identifier from another tenant is supplied.

Initial access rules:

- Organization Owner manages the organization, members, WhatsApp accounts, costs, and campaigns.
- Admin manages contacts, audiences, templates, campaigns, and analytics.
- Marketing creates, schedules, and monitors campaigns without access to provider credentials or organization security.
- Analyst has read-only access to dashboards, campaigns, analytics, and exports included in this milestone.

The backend enforces every capability. The frontend may hide unavailable controls only as a usability improvement.

## Core Experience

The authenticated shell contains Overview, Campaigns, Contacts, Audiences, Templates, Analytics, and Settings.

The overview dashboard includes:

- sent, delivered, read, and failed indicators;
- delivery rate as delivered divided by sent;
- read rate as read divided by delivered;
- failure rate as failed divided by attempted;
- message activity over the selected period;
- recent campaigns and operational alerts;
- a primary action to create a campaign;
- a campaign lifecycle trail showing Scheduled, Sending, Delivered, and Read progress.

The campaign wizard persists a draft after each completed step:

1. Campaign name, internal description, and simulated WhatsApp account.
2. Static audience selection and recipient count.
3. Approved template selection and variable mapping.
4. Validation, message preview, immediate send, or scheduled send.

Invalid transitions are rejected by a centralized campaign transition policy. The main lifecycle is draft, validating, scheduled or queued, running, and completed. Supported cancellation, pause, resume, and failure transitions follow the project rules.

## Visual Direction

The interface follows the supplied reference without cloning its content. It uses a pale lavender application canvas, disciplined white surfaces, soft dividers, and saturated violet for primary actions and active navigation. Typography is compact and operational, prioritizing fast scanning of states and metrics.

The signature element is the campaign lifecycle trail: a compact visual status path that makes operational progress understandable at a glance. Decorative elements remain restrained so this trail is the primary visual distinction.

Responsive behavior is part of the component contract:

- Desktop uses a persistent sidebar and multi-column dashboard grid.
- Tablet uses a compact or collapsible sidebar and reduced grid columns.
- Mobile uses bottom navigation for primary destinations, stacked cards, responsive charts, card representations for dense tables, and fixed bottom actions in the campaign wizard.
- Essential information and actions never depend on hover.
- Keyboard focus is visible and reduced-motion preferences are respected.

## Data and Demo Fixtures

Seeders create a demonstration organization and one user for each initial role. Passwords and login instructions are documented for local development only.

The organization receives simulated WhatsApp accounts, approved and rejected templates, valid and invalid contacts, static audiences, draft and completed campaigns, and messages covering sent, delivered, read, and failed outcomes. Dates span enough history for dashboard charts and filters to show meaningful variation.

Demo data is deterministic so automated tests and screenshots remain stable.

## Error and Empty States

Field validation appears beside the relevant input. Operational failures explain what failed and provide a concrete recovery action such as retrying, changing a schedule, or correcting variable mappings.

Empty states lead to the next meaningful action. Unauthorized access returns an appropriate API status and never reveals whether another tenant's resource exists. Queue failures retain diagnostic context without exposing message content or provider credentials in user-facing errors.

## Testing and Acceptance

Backend automated tests cover:

- authentication and organization membership;
- tenant isolation for every organization-owned resource introduced in this milestone;
- role capabilities and read-only enforcement;
- campaign validation and allowed state transitions;
- immediate and scheduled dispatch;
- provider-event idempotency;
- analytics calculations.

Frontend automated tests cover:

- authentication states;
- the four campaign wizard steps and draft persistence;
- validation and permission-driven controls;
- dashboard loading, error, empty, and populated states.

End-to-end verification covers a Marketing user creating and sending a campaign and an Analyst monitoring its results. The critical flows are verified at desktop and mobile viewport sizes. The milestone is complete when a clean Docker environment can be started, migrated, seeded, and used to execute this flow without manual database changes.

## Delivery Sequence

Implementation planning will divide this milestone into independently verifiable increments:

1. Repository, Docker, application scaffolds, and development commands.
2. Authentication, organizations, memberships, roles, and tenant enforcement.
3. Responsive application shell and dashboard.
4. Contacts, demonstrative import, and static audiences.
5. Simulated WhatsApp accounts and template synchronization.
6. Campaign wizard, validation, scheduling, and lifecycle transitions.
7. Queue-based provider simulation, normalized events, and analytics.
8. Cross-browser responsive review, security review, and end-to-end verification.

Each increment uses the final domain boundaries. Temporary UI data is allowed only while its backing API increment is being built and must be removed before the milestone is considered complete.
