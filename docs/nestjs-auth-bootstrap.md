# Next Step: Scaffold NestJS API + Auth (Copy/Paste)

Use these commands from repo root.

## 1) Create/replace `apps/api` with a fresh NestJS app

```bash
# from repo root
rm -rf apps/api
pnpm dlx @nestjs/cli new apps/api --package-manager pnpm --skip-git
```

## 2) Install Week 1 auth dependencies

```bash
pnpm --dir apps/api add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
pnpm --dir apps/api add -D @types/passport-jwt @types/bcrypt
```

## 3) Create auth module skeleton

```bash
pnpm --dir apps/api exec nest g module auth
pnpm --dir apps/api exec nest g controller auth --no-spec
pnpm --dir apps/api exec nest g service auth --no-spec
```

## 4) Run API

```bash
pnpm --dir apps/api run start:dev
```

## 5) Smoke test

By default Nest runs on `http://localhost:3000`.

```bash
curl http://localhost:3000
```

## 6) Implement Week 1 auth endpoints

Implement in `apps/api/src/auth/auth.controller.ts`:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

These are aligned with the API blueprint in `docs/api-spec.md`.

## 7) Commit and push

```bash
git add .
git commit -m "Scaffold NestJS API and auth module for Week 1"
git push
```
