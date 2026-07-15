# ADR 0001: Modular monolith with separate web and API applications

Status: accepted
Date: 2026-07-14

## Context

WA OS needs clear domain ownership and asynchronous processing without the deployment and consistency overhead of microservices during its first product stages.

## Decision

Use a monorepo containing a Next.js web application and Laravel modular-monolith API. Backend modules communicate through explicit actions, contracts, and normalized events. PostgreSQL is the system of record and Redis supports queues and ephemeral coordination.

## Consequences

Domain boundaries must be enforced by project structure and review rather than network boundaries. The web and API may deploy independently while sharing one release workflow.
