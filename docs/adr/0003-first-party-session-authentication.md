# ADR 0003: First-party session authentication

Status: accepted
Date: 2026-07-15

## Context

WA OS uses a Next.js first-party web application and a Laravel JSON API. Authentication must protect credentials from JavaScript-accessible storage and preserve Laravel's session, CSRF, password reset, and authorization facilities.

## Decision

Use Laravel Sanctum SPA authentication backed by the `web` session guard. The browser obtains the CSRF cookie, then sends credentialed requests directly to the Laravel API. No bearer token is stored in local storage, session storage, or a client-readable cookie.

The initial contract is:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

Login regenerates the session identifier. Logout invalidates the session and regenerates the CSRF token. Password reset responses do not reveal whether an email exists.

The SPA and API use the same site in production, with exact CORS origins, credential support, secure cookies, and explicitly configured Sanctum stateful domains. The frontend treats `401` as an expired or missing session and `419` as an expired CSRF state.

## Consequences

Laravel remains the only authentication authority. The Next.js application does not invent a second token scheme. Server-rendered authenticated routes will require an explicit cookie-forwarding or BFF decision if introduced later.
