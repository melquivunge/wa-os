# ADR 0002: Branch promotion workflow

Status: accepted
Date: 2026-07-14

## Decision

Every change is developed on a dedicated branch created from `dev`. Completed features merge to `dev`, release candidates promote to `stage`, and approved releases promote to `main`.

Direct development commits to `dev`, `stage`, and `main` are prohibited. Repository protection rules should require pull requests and successful checks for these branches.
