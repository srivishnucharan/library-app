# Library Management App Blueprint

A production-ready starter blueprint for a **mobile-native + responsive web** library management system using React and Node.

## Recommended Stack

- **Mobile app**: React Native + Expo
- **Web app**: Next.js (React)
- **API**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **Cache/Queue**: Redis + BullMQ
- **Search**: OpenSearch/Elasticsearch
- **Auth**: JWT + refresh tokens (or external provider)
- **Notifications**: Expo push + email/SMS provider
- **Monorepo**: Turborepo

## Monorepo Structure

```txt
library-app/
  apps/
    mobile/               # Expo app (React Native)
    web/                  # Next.js app (catalog + admin)
    api/                  # NestJS REST API
  packages/
    ui/                   # Shared design system/components
    types/                # Shared TypeScript contracts
    config/               # Shared lint/tsconfig/tooling presets
    validation/           # Shared zod validation schemas
  infra/
    docker/               # Docker files and compose
    terraform/            # Optional cloud infra
  docs/
    architecture.md
    api-spec.md
    db-schema.prisma
```

## Week 1 Build Plan

1. Set up monorepo apps (`mobile`, `web`, `api`) and shared packages.
2. Implement auth (`/auth/register`, `/auth/login`, refresh token flow).
3. Build book catalog read endpoints and responsive search UI.
4. Build basic circulation flow: issue and return a copy.
5. Add due-date notifications and overdue flagging.

See detailed architecture, schema, and endpoint proposals in `docs/`.
