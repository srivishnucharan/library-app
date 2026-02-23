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
pnpm run api:dev
# equivalent alias
pnpm run dev:api
```

API health check:

```powershell
Invoke-WebRequest http://localhost:3000/health
```

## Troubleshooting (Codespaces)

- `pnpm run api:dev` starts API directly from `apps/api/src/main.js` on port `3000` (no `scripts/` dependency).

- If you see `Command "api:dev" not found`, your branch is missing the latest root scripts. Run:

```bash
git pull
cat package.json | sed -n "1,80p"
```


- If `pnpm run api:dev` says `Command "api:dev" not found`, run these exact checks:

```bash
pwd
test -f package.json && cat package.json | sed -n "1,80p"
git pull
```

Then start API with one of these (from repo root):

```bash
pnpm -w run api:dev
# fallback that bypasses pnpm script lookup entirely
node apps/api/src/main.js
```

- If you see `ERR_PNPM_NO_SCRIPT Missing script: dev` under `apps/api`, run from repo root:

```bash
pnpm run api:dev
```

- If `curl http://localhost:3000/api/v1/books` returns a Nest-style 404 (`{"message":"Cannot GET /api/v1/books"...}`), you are running a different server process. Stop it and run the repo runner:

```bash
pnpm run api:dev
curl http://localhost:3000/api/v1/books
```


- If `curl` says `Failed to connect to localhost port 3000`, start and verify API in one command:

```bash
bash scripts/smoke-api.sh
```

This script starts `apps/api/src/main.js`, waits for readiness, runs:
- `GET /health`
- `GET /api/v1/books`
- `GET /api/v1/books/book_1`
and then stops the server automatically.

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



- If `node apps/api/src/main.js` says `Cannot find module`, your branch is missing the API file. Sync your branch first:

```bash
git fetch origin
git checkout week2-catalog-circulation
git pull

# if still missing, list API files
find apps/api -maxdepth 3 -type f
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


## GitHub branch/merge checks (exact commands)

Use these to know your current branch, latest commit id, and whether your branch is merged into `main`:

```bash
# current branch name
git branch --show-current

# latest commit id on your current branch
git rev-parse --short HEAD

# show branches already merged into main
git fetch origin
git checkout main
git pull
git branch --merged

# check if one specific branch is merged (example)
git branch --merged | grep "week2-catalog-circulation" && echo "merged" || echo "not merged"
```

If you are in Codespaces and want the safest API start command, use:

```bash
node apps/api/src/main.js
```




## PowerShell note (important)

In Windows PowerShell, `curl` maps to `Invoke-WebRequest`, so Linux-style flags like `-H` and `-d` fail.

Use either:

1) `curl.exe` (real curl on Windows):

```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com","password":"pass123"}'
```

2) Native PowerShell `Invoke-RestMethod` (recommended):

```powershell
$body = @{
  name = "Test User"
  email = "test@example.com"
  password = "pass123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/auth/register" -ContentType "application/json" -Body $body
```

Use the same pattern for `/auth/login`, `/loans/issue`, and `/reservations`.

## Week 2 execution checklist (copy/paste)

Run these commands from repository root in Codespaces:

```bash
# 1) start API
node apps/api/src/main.js
```

Open a second terminal and run:

```bash
# 2) verify baseline
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/books

# 3) create a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Week2 User","email":"week2@example.com","password":"pass123"}'

# 4) issue loan (replace USER_ID from register response)
curl -X POST http://localhost:3000/api/v1/loans/issue \
  -H "Content-Type: application/json" \
  -d '{"userId":"<USER_ID>","copyId":"copy_1","days":7}'

# 5) view member loans
curl "http://localhost:3000/api/v1/me/loans?userId=<USER_ID>"

# 6) create reservation
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{"userId":"<USER_ID>","bookId":"book_1","branchId":"main"}'

# 7) view member reservations
curl "http://localhost:3000/api/v1/me/reservations?userId=<USER_ID>"
```

Implemented Week 2 endpoints in current API starter:
- `POST /api/v1/loans/issue`
- `POST /api/v1/loans/return`
- `GET /api/v1/me/loans?userId=...`
- `POST /api/v1/reservations`
- `DELETE /api/v1/reservations/:reservationId`
- `GET /api/v1/me/reservations?userId=...`

