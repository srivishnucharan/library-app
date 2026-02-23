# Week 1 Implementation (Scaffold + Commands)

This patch adds a runnable baseline monorepo so you can start implementing the Week 1 plan.

## Added baseline

- Workspace and orchestration files (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`)
- API starter (`apps/api`) with a simple `/health` endpoint
- Web/Mobile placeholder package scripts (`apps/web`, `apps/mobile`)
- Shared package stubs (`packages/types`, `packages/validation`, `packages/ui`, `packages/config`)

## Windows PowerShell commands

```powershell
pnpm install
pnpm dev
# or run only API
pnpm api:dev
# equivalent alias
pnpm dev:api
```

API health check:

```powershell
Invoke-WebRequest http://localhost:3000/health
```

## Troubleshooting (Codespaces)

- `pnpm api:dev` uses a resilient runner (`scripts/api-dev.js`) that auto-creates `apps/api/src/main.js` if missing, then starts the API on port `3000`.

- If you see `Command "api:dev" not found`, your branch is missing the latest root scripts. Run:

```bash
git pull
cat package.json | sed -n "1,80p"
```

- If you see `ERR_PNPM_NO_SCRIPT Missing script: dev` under `apps/api`, run from repo root:

```bash
pnpm api:dev
```

- If `curl http://localhost:3000/api/v1/books` returns a Nest-style 404 (`{"message":"Cannot GET /api/v1/books"...}`), you are running a different server process. Stop it and run the repo runner:

```bash
pnpm api:dev
curl http://localhost:3000/api/v1/books
```
- Ensure you are at repository root before running pnpm commands:

```bash
pwd
test -f package.json && echo "root package.json found"
```

- Validate workspace package detection:

```bash
pnpm -r list --depth -1
pnpm --filter ./apps/api run dev
```


## Current API progress

The starter API now includes working Week 1 auth endpoints on `/api/v1/auth`:

- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /logout`

Quick test example:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"pass123"}'
```


Week 2 has started with initial catalog endpoints:

- `GET /api/v1/books`
- `GET /api/v1/books/:bookId`

Examples:

```bash
curl "http://localhost:3000/api/v1/books?q=code&availableOnly=true"
curl "http://localhost:3000/api/v1/books/book_1"
```

## Next coding tasks

For exact copy/paste commands to scaffold NestJS + Auth, see `docs/nestjs-auth-bootstrap.md`.


1. Replace `apps/api` starter with NestJS and implement auth endpoints from `docs/api-spec.md`.
2. Scaffold Next.js in `apps/web` and build catalog list/detail pages.
3. Scaffold Expo in `apps/mobile` and build auth + home screens.
4. Wire Prisma into API using `docs/db-schema.prisma` and run initial migration.
