# WA OS

WA OS is a multi-tenant WhatsApp campaign and messaging operations platform.

## Repository

- `apps/web`: Next.js web application.
- `apps/api`: Laravel JSON API and domain modules.
- `docs`: product, architecture, and implementation decisions.
- `compose.yaml`: local PostgreSQL and Redis services.

## Branch flow

All work starts from `dev` on a dedicated branch and is promoted through:

```text
feat/* -> dev -> stage -> main
```

Do not commit directly to `dev`, `stage`, or `main`.

## Local requirements

- PHP 8.4 or newer
- Composer 2
- Node.js 24 or newer
- npm 11 or newer
- Docker with Compose

## Getting started

```bash
make infra-up
make setup
make api
make web
```

The API and web application contain their own environment documentation.

## Verification

```bash
make test
make lint
make typecheck
```

GitHub Actions runs the same backend, frontend, and infrastructure checks on
feature pushes and pull requests targeting `dev`, `stage`, or `main`.
