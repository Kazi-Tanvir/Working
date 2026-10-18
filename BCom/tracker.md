# Project Tracker: BD F-Commerce Conversion & Automation Engine (v2.0)

> This document tracks every conversation, milestone progress, architectural decisions, and verification records across development sessions.

---

## 📌 Project Overview
- **Product Name:** BD F-Commerce Engine (v2.0)
- **Architecture:** Single-Merchant Next.js 15 App Router + TypeScript + Tailwind CSS v4 + Prisma ORM (MySQL 8.0+)
- **Staff Auth:** Clerk (Invite-Only, scoped strictly to `(admin)` and `/sign-in`, zero Clerk JS on customer storefront)
- **Key Modules:**
  1. Single-Product Ad Funnel (`/offer/[slug]`) with embedded 3-input minimal checkout
  2. Server-Authoritative Order Service with atomic variant-level stock decrement
  3. Consented Incomplete Order Lead Capture with 4-state lifecycle (`OPEN`, `CONVERTED`, `DISMISSED`, `EXPIRED`)
  4. Mobile-first Admin Order Operations with Clerk RBAC & status transitions
  5. Steadfast Courier 1-click idempotent dispatch & status reconciliation
  6. Thermal (80mm/58mm) & A4 printable courier invoice slips
  7. Manual bKash TrxID advance verification workflow
  8. Meta Pixel & Server CAPI async events

---

## 🎯 Milestone Roadmap & Status

| Milestone | Description | Target | Status |
| :--- | :--- | :--- | :---: |
| **Milestone 0** | Project Setup, Next.js 15, Prisma MySQL Schema, Seed Data, Clerk Config | Day 1 | 🟢 Completed |
| **Milestone 1** | Core Order Engine, Phone Normalization, Variant Stock, Funnel `/offer/[slug]`, Order Success | Day 1–2 | 🟢 Completed |
| **Milestone 2** | Clerk RBAC, Guard, Staff Operations (`/admin/orders`), Order Status State Machine, bKash Verify | Day 3–4 | 🟢 Completed |
| **Milestone 3** | Idempotent Steadfast Courier Dispatch, Reconcile, Webhooks, Printable Invoices (`/admin/invoice/[id]`) | Day 5–6 | 🟢 Completed |
| **Milestone 4** | Consented Incomplete Leads Capture (`/api/orders/incomplete`), Admin Queue (`/admin/incomplete`) | Day 7 | 🟢 Completed |
| **Milestone 5** | Meta Pixel + Async CAPI Dispatch, Trust & Legal Pages (`/privacy`, `/terms`, `/return-policy`) | Day 8 | 🟢 Completed |
| **Milestone 6** | Production Build, In-App Browser QA, Verification Suite | Day 9–10 | 🟡 In Progress |

---

## 📝 Session & Chat Activity Log

### Session 1 (2026-10-18)
- **Goal:**
  - Initialize repository with Next.js 15 App Router, TypeScript, Tailwind CSS v4, and Prisma ORM.
  - Establish `tracker.md` to track progress across every chat.
  - Implement full database schema (`prisma/schema.prisma`), seed fixtures (`prisma/seed.ts`), and `.env.example`.
  - Implement server-authoritative order creation, phone normalization, lead capture, courier dispatch, and state machines.
  - Implement storefront funnel (`/offer/[slug]`), embedded checkout form, masked PII success page, and legal pages (`/privacy`, `/terms`, `/return-policy`).
  - Implement admin portal (`/admin`, `/admin/orders`, `/admin/incomplete`, `/admin/products`, `/admin/invoice/[id]`, `/admin/settings`, `/admin/blacklist`, `/admin/analytics`).
  - Implement API routes (`/api/orders`, `/api/orders/incomplete`, `/api/orders/[id]/status`, `/api/orders/[id]/verify-payment`, `/api/courier/steadfast`, `/api/webhooks/steadfast`, `/api/cron/cleanup-leads`).
  - Write and pass automated unit tests for `bd-phone` and `state-machine`.

- **Files Created / Modified:**
  - `package.json`: Configured Next.js 15, React 19, Prisma 6, Zod, Clerk 6, Lucide, Tailwind v4.
  - `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`.
  - `.env.example`: Complete environment variable template with Steadfast, Clerk, and database parameters.
  - `prisma/schema.prisma`: Complete v2.0 MySQL schema with `ProductVariant`, `InvoiceCounter`, `Order`, `CourierDispatch`, `IncompleteOrder`, `PaymentTransaction`, `BlockedCustomer`.
  - `prisma/seed.ts`: Seed fixtures with realistic Bangladeshi Panjabi products, variants, and admin users.
  - `src/lib/bd-phone.ts`: Normalization of Bangla numerals (`০-৯`), `+880` prefix stripping, and regex validation.
  - `src/lib/rate-limit.ts`: In-memory LRU rate-limiting fallback.
  - `src/lib/prisma.ts`: Pooled Prisma client singleton.
  - `src/lib/constants.ts`: Delivery zone charges, status badges, payment methods.
  - `src/lib/auth-guard.ts`: Fail-closed `requireStaffRole(['ADMIN', 'MODERATOR'])` guard.
  - `src/middleware.ts`: Clerk default-deny route protection with role check.
  - `src/services/order.service.ts`: Server-authoritative order creation with atomic variant stock decrement and idempotency.
  - `src/services/state-machine.service.ts`: State machine transition enforcement.
  - `src/services/lead.service.ts`: Session-scoped lead capture with 30-day retention.
  - `src/services/courier.service.ts`: Steadfast adapter with `DISPATCHING -> BOOKED / NEEDS_RECONCILIATION` lock.
  - `src/services/meta-capi.service.ts`: SHA-256 hashed Meta CAPI async background dispatch.
  - `src/components/CheckoutForm.tsx`: High-converting 3-input minimal checkout with sticky bar and honeypot.
  - `src/components/AdminOrderCard.tsx`: Mobile-first order card with 48px touch targets, call, WhatsApp, Steadfast push.
  - `src/components/PrintButton.tsx`: Instant invoice printing trigger.
  - `src/app/globals.css`: Typography tokens, 16px mobile input guard, and 80mm thermal POS print styling.
  - `src/app/layout.tsx`: Root layout with Google Fonts (`Hind Siliguri` + `Inter`).
  - `src/app/(storefront)/layout.tsx`: Storefront layout with announcement bar and legal footer.
  - `src/app/(storefront)/page.tsx`: Landing page redirecting to featured product funnel.
  - `src/app/(storefront)/offer/[slug]/page.tsx`: Single-product ad funnel page.
  - `src/app/(storefront)/order-success/[publicToken]/page.tsx`: Masked PII order confirmation page.
  - `src/app/(storefront)/privacy/page.tsx`: Privacy policy with lead capture disclosure.
  - `src/app/(storefront)/terms/page.tsx`: Terms of service.
  - `src/app/(storefront)/return-policy/page.tsx`: Return and exchange policy.
  - `src/app/(admin)/layout.tsx`: Admin layout with `<ClerkProvider>` and staff navigation.
  - `src/app/(admin)/admin/page.tsx`: Operational KPIs dashboard.
  - `src/app/(admin)/admin/orders/page.tsx`: Orders list with status filter pills.
  - `src/app/(admin)/admin/incomplete/page.tsx`: Incomplete leads recovery queue.
  - `src/app/(admin)/admin/invoice/[id]/page.tsx`: 80mm thermal receipt & A4 printable courier invoice.
  - `src/app/(admin)/admin/products/page.tsx`: Product and variant inventory CRUD.
  - `src/app/(admin)/admin/settings/page.tsx`: Store settings editor.
  - `src/app/(admin)/admin/blacklist/page.tsx`: Blocked customer phone management.
  - `src/app/(admin)/admin/analytics/page.tsx`: Net profit and ad spend analytics.
  - `src/app/api/orders/route.ts`: Public rate-limited checkout endpoint.
  - `src/app/api/orders/incomplete/route.ts`: Public session-scoped incomplete lead capture.
  - `src/app/api/orders/[id]/status/route.ts`: Staff order status transition endpoint.
  - `src/app/api/orders/[id]/verify-payment/route.ts`: Staff manual bKash verification endpoint.
  - `src/app/api/courier/steadfast/route.ts`: Staff Steadfast dispatch and reconcile endpoint.
  - `src/app/api/webhooks/steadfast/route.ts`: Steadfast webhook for status sync & restock.
  - `src/app/api/cron/cleanup-leads/route.ts`: 30-day incomplete lead cleanup cron.
  - `tests/bd-phone.test.ts`: 6 passing unit tests for phone normalization and operator prefixes.
  - `tests/state-machine.test.ts`: 4 passing unit tests for order, payment, and dispatch state transitions.

- **Evidence & Verification:**
  - Dependencies: Installed 385 packages successfully (`npm install` exit code 0).
  - Prisma Client: Generated successfully (`npx prisma generate` exit code 0).
  - TypeScript: Zero type errors (`npx tsc --noEmit` exit code 0).
  - Test Suite: 10/10 tests passed (`tests/bd-phone.test.ts` 6/6, `tests/state-machine.test.ts` 4/4).

- **Next Steps:**
  - Configure live database credentials in `.env` (`DATABASE_URL`) to run `npx prisma db push` or `npx prisma migrate dev` and `npm run prisma:seed`.
  - Configure Clerk API keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) per checklist in `manual_additions_and_setup.txt.md`.
