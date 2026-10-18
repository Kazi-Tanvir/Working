# Implementation Plan: BD F-Commerce Engine (`implementation-plan.md` — v2.0)

## 1\. Tech Stack, Pinned Versions & Architectural Rules

- **Framework:** Next.js `15.x` (Pinned App Router release using `src/middleware.ts`; *Note: if upgrading to Next.js 16+, rename `src/middleware.ts` to `src/proxy.ts` per Next.js 16 convention*).  
- **Language & Validation:** TypeScript `5.x` \+ Zod `3.x` (shared client/server validation schemas, with authoritative server-side price/stock enforcement).  
- **Database & ORM:** MySQL `8.0+` (TiDB Cloud Serverless / Railway / Aiven with connection pooling) \+ Prisma ORM (`@prisma/client` `6.x`).  
- **Authentication & Staff RBAC:** Clerk (`@clerk/nextjs` `6.x`) configured as **Invite-Only** (public sign-up disabled) and scoped **strictly** to `(admin)` and `sign-in` route groups so the customer funnel ships zero Clerk JS.  
- **Mutation Architecture (Single Pattern):** All public checkout and admin mutations flow through **Route Handlers (`src/app/api/...`)** calling pure, unit-tested business services in `src/services/*.service.ts`.  
- **Image Upload Pipeline:** UploadThing (`uploadthing`) or Cloudinary signed uploads so merchants can upload product and review images on serverless hosting without local disk writes.  
- **Abuse & Rate Limiting:** Upstash Redis (`@upstash/ratelimit`) or in-memory LRU fallback \+ Cloudflare Turnstile / honeypot protection on public `/api/orders` and `/api/orders/incomplete` endpoints.

---

## 2\. Project Directory Structure

bd-fcommerce/

├── prisma/

│   ├── schema.prisma                  \# v2.0 MySQL schema (ProductVariant, CourierDispatch, etc.)

│   └── seed.ts                        \# Realistic BD products \+ variants \+ test fixtures

├── src/

│   ├── app/

│   │   ├── (storefront)/              \# ZERO ClerkProvider here (Fast \<1.8s LCP)

│   │   │   ├── layout.tsx             \# Hind Siliguri \+ Inter fonts \+ Footer legal links

│   │   │   ├── page.tsx               \# Storefront catalog (MVP-4) or redirect to featured offer

│   │   │   ├── offer/\[slug\]/page.tsx  \# ISR Single-Product Ad Funnel \+ Embedded Checkout

│   │   │   ├── order-success/\[publicToken\]/page.tsx \# Masked PII confirmation page

│   │   │   ├── privacy/page.tsx       \# Required Privacy Policy & lead capture disclosure

│   │   │   ├── terms/page.tsx         \# Required Terms of Service

│   │   │   └── return-policy/page.tsx \# Explicit COD return & exchange policy

│   │   ├── (admin)/                   \# Wrapped in \<ClerkProvider\>

│   │   │   ├── layout.tsx             \# ClerkProvider \+ requireStaffRole() layout guard

│   │   │   └── admin/

│   │   │       ├── page.tsx           \# Operational KPIs (Pending, Confirmed, Dispatched)

│   │   │       ├── orders/page.tsx    \# Mobile-first order cards \+ edit modal \+ Steadfast push

│   │   │       ├── incomplete/page.tsx\# Session-scoped OPEN leads \+ Call/WhatsApp/Dismiss

│   │   │       ├── products/page.tsx  \# ADMIN-only Product & ProductVariant stock CRUD

│   │   │       ├── blacklist/page.tsx \# ADMIN-only BlockedCustomer phone management

│   │   │       ├── analytics/page.tsx \# ADMIN-only Net Profit & AdSpend tracker

│   │   │       ├── settings/page.tsx  \# ADMIN-only non-secret StoreSettings editor

│   │   │       └── invoice/\[id\]/page.tsx \# 80mm Thermal & A4 4-up printable courier slip

│   │   ├── sign-in/\[\[...sign-in\]\]/page.tsx

│   │   └── api/

│   │       ├── orders/route.ts                \# Public: Rate-limited \+ createAuthoritativeOrder()

│   │       ├── orders/\[id\]/status/route.ts    \# Staff: State-machine enforced status transitions

│   │       ├── orders/\[id\]/verify-payment/route.ts \# Staff: Verify manual bKash TrxID

│   │       ├── orders/incomplete/route.ts     \# Public: Rate-limited session-key lead capture

│   │       ├── courier/steadfast/route.ts     \# Staff: Idempotent Steadfast dispatch \+ reconcile

│   │       ├── webhooks/steadfast/route.ts    \# Webhook: Courier status sync & return restock

│   │       ├── webhooks/clerk/route.ts        \# Webhook: Svix-verified Clerk staff sync

│   │       └── cron/cleanup-leads/route.ts    \# Cron: Purges IncompleteOrder \> 30 days

│   ├── services/

│   │   ├── order.service.ts           \# Server price calc, atomic variant stock, idempotency

│   │   ├── state-machine.service.ts   \# Allowed OrderStatus & PaymentStatus transitions

│   │   ├── lead.service.ts            \# Session-scoped IncompleteOrder upsert & conversion

│   │   ├── courier.service.ts         \# CourierProvider interface \+ Steadfast adapter

│   │   └── meta-capi.service.ts       \# SHA-256 8801... hashing \+ non-blocking after() dispatch

│   ├── lib/

│   │   ├── prisma.ts                  \# Pooled Prisma client singleton

│   │   ├── auth-guard.ts              \# Fail-closed requireStaffRole(\['ADMIN', 'MODERATOR'\])

│   │   ├── bd-phone.ts                \# Bangla digit normalization \+ /^01\[3-9\]\\d{8}\$/

│   │   ├── rate-limit.ts              \# Per-IP & per-phone rate limiter

│   │   └── constants.ts               \# Single source of truth for zones, roles, statuses

│   └── middleware.ts                  \# Clerk middleware with standard static asset matcher

├── tests/

│   ├── order-service.test.ts          \# Price tampering, concurrency stock, idempotency tests

│   ├── auth-rbac.test.ts              \# Default-deny & Moderator vs Admin permission tests

│   └── bd-phone.test.ts               \# Bangla numerals, \+880, & undefined-OR safety tests

└── .env.example

---

## 3\. Environment Variables Template (`.env.example`)

All third-party secrets live strictly in `.env` (never in `StoreSettings` or `NEXT_PUBLIC_*`):

\# 1\. Database (MySQL 8.0+ with Connection Pooling)

DATABASE\_URL="mysql://user:password@host:4000/bd\_fcommerce?sslaccept=strict\&connection\_limit=10"

\# 2\. Clerk Staff Authentication (Invite-Only Mode)

NEXT\_PUBLIC\_CLERK\_PUBLISHABLE\_KEY="pk\_test\_your\_key"

CLERK\_SECRET\_KEY="sk\_test\_your\_key"

NEXT\_PUBLIC\_CLERK\_SIGN\_IN\_URL="/sign-in"

CLERK\_WEBHOOK\_SECRET="whsec\_your\_secret"

\# 3\. Steadfast Courier Packzy API (Server-Only Secrets)

STEADFAST\_API\_KEY="your\_steadfast\_api\_key"

STEADFAST\_SECRET\_KEY="your\_steadfast\_secret\_key"

STEADFAST\_BASE\_URL="\<STEADFAST\_API\_V1\_BASE\_URL\>"

STEADFAST\_WEBHOOK\_SECRET="your\_webhook\_bearer\_secret"

\# 4\. Meta Pixel & Conversions API (CAPI)

NEXT\_PUBLIC\_META\_PIXEL\_ID="123456789012345"

META\_CAPI\_ACCESS\_TOKEN="EAAB\_your\_capi\_token"

\# 5\. Image Upload & Rate Limiting / Cron Security

UPLOADTHING\_TOKEN="your\_uploadthing\_token"

UPSTASH\_REDIS\_REST\_URL="\<UPSTASH\_REDIS\_ENDPOINT\>"

UPSTASH\_REDIS\_REST\_TOKEN="your\_upstash\_token"

CRON\_SECRET="random\_32\_char\_secret\_for\_lead\_cleanup"

---

## 4\. Fail-Closed Clerk Middleware & Resource Authorization

### 4.1 `src/middleware.ts` (Standard Static Asset Matcher \+ Default-Deny)

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

import { NextResponse } from 'next/server';

const isProtectedStaffRoute \= createRouteMatcher(\[

  '/admin(.\*)',

  '/api/orders/(.\*)/status',

  '/api/orders/(.\*)/verify-payment',

  '/api/courier(.\*)',

\]);

const isAdminOnlyRoute \= createRouteMatcher(\[

  '/admin/products(.\*)',

  '/admin/blacklist(.\*)',

  '/admin/analytics(.\*)',

  '/admin/settings(.\*)',

\]);

export default clerkMiddleware(async (auth, req) \=\> {

  if (\!isProtectedStaffRoute(req)) {

    return NextResponse.next();

  }

  const session \= await auth.protect();

  const role \= (session.sessionClaims?.metadata as { role?: string } | undefined)?.role;

  // Fail-Closed Default Deny: Reject any signed-in user lacking an explicit staff role

  if (role \!== 'ADMIN' && role \!== 'MODERATOR') {

    return new NextResponse('Forbidden: Staff Role Required', { status: 403 });

  }

  // Enforce Admin-Only Routes per Unified Permission Matrix

  if (isAdminOnlyRoute(req) && role \!== 'ADMIN') {

    if (req.nextUrl.pathname.startsWith('/api/')) {

      return new NextResponse('Forbidden: Admin Role Required', { status: 403 });

    }

    return NextResponse.redirect(new URL('/admin/orders', req.url));

  }

  return NextResponse.next();

});

export const config \= {

  matcher: \[

    // Skip Next.js internals and all static files, unless found in search params

    '/((?\!\_next|\[^?\]\*\\\\.(?:html?|css|js(?\!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).\*)',

    // Always run for API routes

    '/(api|trpc)(.\*)',

  \],

};

### 4.2 Resource-Level Guard (`src/lib/auth-guard.ts`)

Called inside every protected Route Handler and Server Component to verify both the Clerk role AND `User.isActive === true` in MySQL:

import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/prisma';

import { StaffRole } from '@prisma/client';

export async function requireStaffRole(allowedRoles: StaffRole\[\]) {

  const { userId } \= await auth();

  if (\!userId) {

    throw new Error('UNAUTHORIZED\_401');

  }

  const staffUser \= await prisma.user.findUnique({

    where: { clerkId: userId },

  });

  if (\!staffUser || \!staffUser.isActive || \!allowedRoles.includes(staffUser.role)) {

    throw new Error('FORBIDDEN\_403');

  }

  return staffUser;

}

---

## 5\. Realistic Milestone-Based Delivery Schedule (68–80 Hours / 8–10 Days)

Instead of an unrealistic 26-hour sprint, implementation is ordered by risk and dependency across 6 gated milestones:

### Milestone 0: Architecture & Merchant Baseline Setup (4 Hours — Day 1 AM)

- Lock single-merchant deployment config, create pooled MySQL database, configure Clerk Invite-Only application, and customize the Clerk Session Token to include `{"metadata": "{{user.public_metadata}}"}`.  
- **Completion Gate:** Clerk login issues JWT containing `metadata.role`, and `npx prisma migrate dev` succeeds.

### Milestone 1: Safe Core Order Engine & Variant Stock (16 Hours — Days 1–2)

- Implement `bd-phone.ts` (Bangla numeral `০-৯` normalizer \+ regex validator).  
- Implement `order.service.ts` (`createAuthoritativeOrder`) with server-side price/delivery calculation, atomic `ProductVariant.stock` check, `InvoiceCounter`, `idempotencyKey`, and opaque `publicToken`.  
- Build `/offer/[slug]`, minimal checkout form, and `/order-success/[publicToken]` (masked PII).  
- **Completion Gate (Automated Tests):** Vitest suite passes price-tampering rejection, concurrent last-unit stock race test, Bangla phone normalization, and duplicate `idempotencyKey` replay.

### Milestone 2: Clerk RBAC, Audit Logs & Staff Order Operations (14 Hours — Days 3–4)

- Scope `<ClerkProvider>` strictly to `src/app/(admin)/layout.tsx` and `/sign-in`.  
- Implement `middleware.ts`, `requireStaffRole()`, and Svix-verified `/api/webhooks/clerk`.  
- Build `/admin/orders` mobile card interface, order address/zone edit modal, state-machine transition API (`/api/orders/[id]/status`), and manual bKash `PaymentTransaction` verification.  
- **Completion Gate (Automated Tests):** Moderator receives `403` on `/admin/settings`, `/admin/products`, and `/admin/blacklist`; deactivated `User.isActive = false` is blocked immediately.

### Milestone 3: Idempotent Steadfast Courier & Printable Labels (12 Hours — Days 5–6)

- Implement `courier.service.ts` with `DISPATCHING -> BOOKED / FAILED / NEEDS_RECONCILIATION` locking and invoice-lookup reconciliation before retry.  
- Implement `/api/webhooks/steadfast` for delivery/return status sync and automatic single-restock on `RETURNED`.  
- Build `/admin/invoice/[id]` supporting 80mm thermal and A4 4-up print layouts.  
- **Completion Gate:** Simulated network timeout during Steadfast booking transitions order to `NEEDS_RECONCILIATION` and prevents duplicate consignment creation on second click.

### Milestone 4: Consented Incomplete Leads & Abuse Protection (10 Hours — Day 7\)

- Implement `/api/orders/incomplete` keyed by `sessionKey` with Upstash/LRU rate limiting, honeypot check, visible point-of-capture privacy notice, and 30-day expiry cron (`/api/cron/cleanup-leads`).  
- Build `/admin/incomplete` recovery queue with 1-tap phone call, WhatsApp click-to-chat, Convert, and Dismiss actions.  
- **Completion Gate:** Repeat customer with previous `CONVERTED` order creates a new session lead without reopening old leads.

### Milestone 5: Meta Pixel \+ Async CAPI & Legal/Trust Pages (8 Hours — Day 8\)

- Implement client Pixel (`ViewContent`, `InitiateCheckout`, `Lead`) and non-blocking Server CAPI (`Purchase` on `CONFIRMED` or `ON_SUBMIT` via Next.js `after()`) with SHA-256 `8801XXXXXXXXX` hashing, `fbp`, and `fbc`.  
- Build `/privacy`, `/terms`, and `/return-policy` pages and UploadThing/Cloudinary product image uploader.

### Milestone 6: In-App Browser QA, Backup Drill & Production Launch (8 Hours — Days 9–10)

- Test `/offer/[slug]` inside real Android Facebook & Messenger in-app browsers over 4G.  
- Verify database backup & restore runbook, Sentry error alerts, and thermal label print output.