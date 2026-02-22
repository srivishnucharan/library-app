# Architecture Overview

## Product Surfaces

- **Member Mobile App (Expo)**
  - Search catalog
  - Reserve/borrow/renew books
  - See due dates/fines
  - Receive notifications
- **Web App (Next.js)**
  - Public catalog browsing
  - Member account pages
  - Librarian/admin dashboard
- **API (NestJS)**
  - Domain modules: Auth, Catalog, Inventory, Circulation, Reservations, Fines, Notifications, Reporting

## Core Domain Modules

1. **Auth & Users**
   - Roles: `MEMBER`, `LIBRARIAN`, `ADMIN`
   - Session management + refresh tokens
2. **Catalog**
   - Book metadata, authors, categories, ISBN
   - Search and filtering
3. **Inventory**
   - Physical copies per branch
   - Barcode/QR identity for each copy
4. **Circulation**
   - Checkout, return, renew
   - Loan policies and due dates
5. **Reservations**
   - Hold queue per title/branch
   - Auto-allocation when copy becomes available
6. **Fines & Payments**
   - Overdue fee calculation
   - Payment provider integration (e.g., Stripe)
7. **Notifications**
   - Due reminders, overdue notices, hold-ready alerts
8. **Reporting**
   - Borrow trends, overdue rates, inventory utilization

## Data/Execution Flow

1. Client calls API with JWT.
2. API validates role + request payload.
3. Prisma transaction updates loan/copy/fine tables.
4. Domain event is emitted (e.g., `loan.returned`).
5. Queue worker sends notification + updates analytics projections.

## Non-Functional Requirements

- **Security**: RBAC, audit logs, rate limiting, encrypted secrets.
- **Scalability**: Redis caching, queue workers, optional read replicas.
- **Observability**: structured logs, tracing, error monitoring.
- **Accessibility**: high contrast, scalable typography, semantic controls.
