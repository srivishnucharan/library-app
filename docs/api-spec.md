# Initial API Blueprint (Week 1 + Core)

Base path: `/api/v1`

## Auth

- `POST /auth/register`
  - Create member account
- `POST /auth/login`
  - Returns access + refresh token
- `POST /auth/refresh`
  - Rotates refresh token
- `POST /auth/logout`
  - Revokes refresh token

## Catalog

- `GET /books`
  - Query: `q`, `category`, `author`, `branchId`, `availableOnly`, `page`, `pageSize`
- `GET /books/:bookId`
  - Book detail + copy availability by branch
- `POST /books` (LIBRARIAN/ADMIN)
- `PATCH /books/:bookId` (LIBRARIAN/ADMIN)

## Inventory

- `POST /copies` (LIBRARIAN/ADMIN)
  - Add physical copy to branch
- `PATCH /copies/:copyId` (LIBRARIAN/ADMIN)
  - Update status/shelf location

## Circulation

- `POST /loans/issue` (LIBRARIAN/ADMIN)
  - Inputs: `userId`, `copyBarcode` or `copyId`
- `POST /loans/return` (LIBRARIAN/ADMIN)
  - Inputs: `loanId` or `copyBarcode`
- `POST /loans/:loanId/renew`
  - Policy checks: max renewals, active hold queue
- `GET /me/loans`

## Reservations

- `POST /reservations`
  - Place hold for title in branch
- `DELETE /reservations/:reservationId`
  - Cancel hold
- `GET /me/reservations`

## Fines/Payments

- `GET /me/fines`
- `POST /payments/checkout-session`
  - Creates payment intent/session
- `POST /payments/webhook`
  - Provider webhook handler

## Notifications

- `POST /me/device-tokens`
  - Register push token
- `PATCH /me/notification-preferences`

## Admin/Reporting

- `GET /admin/reports/overdue-summary`
- `GET /admin/reports/popular-books`
- `GET /admin/audit-logs`

## Initial UI Screens

### Mobile (Expo)

1. Auth (Sign in / Sign up / Forgot password)
2. Home (search + featured categories)
3. Book details (availability, reserve, borrow info)
4. My loans (active/overdue/history)
5. Reservations
6. Fines and payment
7. Profile + notification preferences

### Web (Next.js)

1. Public catalog landing/search
2. Book detail pages
3. Member account pages
4. Librarian dashboard
   - Issue/return desk
   - Copy management
   - Reservation queue
5. Admin reports
