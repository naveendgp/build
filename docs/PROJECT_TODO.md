## Laundry Backend - API and Task Plan

This document tracks the full set of APIs and implementation tasks. Status boxes reflect current progress.

### Legend
- [x] Completed
- [ ] Pending

---

## High-level Tasks

- [x] Initialize NestJS project structure
- [x] Add and configure MongoDB connection with success console.log
- [x] Centralize config in `src/config/database.config.ts` (DB + JWT)
- [x] Add base schemas: `User`, `Vendor`, `DeliveryPerson`
- [x] Add JWT helper and 3 independent guards (user, delivery, vendor)
- [x] Add OTP helper (temp OTP 1234)
- [x] Create `user`, `vendor`, `delivery` modules with OTP login/register/verify
- [ ] Add request DTOs and validation pipes for all endpoints
- [ ] Add standardized response format and error filter
- [ ] Add API versioning and Swagger documentation
- [ ] Implement services catalog (wash/fold/iron etc.) and pricing
- [ ] Implement user addresses
- [ ] Implement order lifecycle (create, assign, pickup, in-process, delivered)
- [ ] Implement vendor order management
- [ ] Implement delivery assignment and status updates
- [ ] Add role-based route protection using existing independent guards
- [ ] Add notifications (stub webhook or log-based)
- [ ] Add payments (stub integration) and receipts
- [ ] Add admin/reporting endpoints (basic metrics)
- [ ] Add e2e tests for critical flows
- [ ] CI-ready lint/test scripts

---

## API Endpoints

### Auth (OTP-based) — Per Role
- User
  - [x] POST `/user/register` — start registration via phone, send OTP
  - [x] POST `/user/login` — start login via phone, send OTP
  - [x] POST `/user/verify-otp` — verify OTP, returns 6h JWT
- Vendor
  - [x] POST `/vendor/register`
  - [x] POST `/vendor/login`
  - [x] POST `/vendor/verify-otp`
- Delivery Person
  - [x] POST `/delivery/register`
  - [x] POST `/delivery/login`
  - [x] POST `/delivery/verify-otp`

### Profiles
- User
  - [ ] GET `/user/me` — get profile (UserAuthGuard)
  - [ ] PATCH `/user/me` — update profile
- Vendor
  - [ ] GET `/vendor/me` — get profile (VendorAuthGuard)
  - [ ] PATCH `/vendor/me` — update profile
- Delivery Person
  - [ ] GET `/delivery/me` — get profile (DeliveryAuthGuard)
  - [ ] PATCH `/delivery/me` — update profile

### Services & Pricing (Vendor-managed, User-facing)
- [ ] GET `/services` — list services and base pricing
- [ ] POST `/vendor/services` — create/update service items (vendor)
- [ ] PATCH `/vendor/services/:id` — update
- [ ] DELETE `/vendor/services/:id` — delete

### Addresses (User)
- [ ] GET `/user/addresses`
- [ ] POST `/user/addresses`
- [ ] PATCH `/user/addresses/:id`
- [ ] DELETE `/user/addresses/:id`

### Orders
- User
  - [ ] POST `/orders` — create order (items, address, schedule)
  - [ ] GET `/orders` — list own
  - [ ] GET `/orders/:id` — detail
- Vendor
  - [ ] GET `/vendor/orders` — list assigned to vendor
  - [ ] PATCH `/vendor/orders/:id/status` — update processing status
- Delivery
  - [ ] GET `/delivery/jobs` — list assigned pickup/delivery jobs
  - [ ] PATCH `/delivery/jobs/:id/status` — update job status

### Notifications
- [ ] POST `/notifications/test` — stub send (for dev)

### Payments
- [ ] POST `/payments/intent` — stub create payment intent
- [ ] POST `/payments/confirm` — stub confirm

### Admin/Reports (optional/basic)
- [ ] GET `/admin/metrics` — counts by role and order status

---

## Immediate Next Tasks

1) Add DTOs and validation for OTP endpoints
   - [ ] Create DTOs for register/login/verify-otp in `user`, `vendor`, `delivery`
   - [ ] Enable global `ValidationPipe` in `main.ts`

2) Add `GET /:role/me` endpoints using existing guards
   - [ ] Implement controllers/services for fetching current profile by token

3) Scaffold services & pricing models and endpoints
   - [ ] Create schemas: `ServiceItem`
   - [ ] Public list, vendor CRUD

4) Scaffold addresses for users
   - [ ] Create schema: `Address`
   - [ ] CRUD endpoints under `/user/addresses`

5) Scaffold orders
   - [ ] Create schemas: `Order`, `OrderItem`
   - [ ] User create/list/view; Vendor list/update; Delivery list/update

6) Add Swagger and versioning
   - [ ] Setup `/docs` and v1 prefix

7) Tests & polish
   - [ ] Basic e2e for OTP flow and protected endpoints
   - [ ] Error filter and response envelope

---

## Notes
- DB connection uses `console.log` on success.
- Config is centralized via `AppConfig` with DB URL and per-role JWT secrets.
- Guards are independent: `UserAuthGuard`, `VendorAuthGuard`, `DeliveryAuthGuard`.

