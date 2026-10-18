# Product Requirements Document (PRD): BD F-Commerce Conversion & Automation Engine (v2.0)

## 1\. Executive Summary & Deployment Model

- **Product Name:** BD F-Commerce Engine (v2.0 — Revised Post-Audit)  
- **Deployment Architecture (Resolved Decision):** **Single-Merchant / Single-Tenant Deployment**. Each client brand receives an isolated application deployment (Vercel) and an isolated MySQL database instance. `StoreSettings` is a strict singleton (`id = "default"`), eliminating cross-merchant data leakage risks.  
- **Target Market & Buyer Persona:** Independent Bangladeshi F-Commerce (Facebook-driven) brands selling fashion/panjabi, modest wear, gadgets, organic food, or skincare who spend \$10–\$100/day on Meta Ads and process 15–150 orders/day.  
- **Commercial Model:** Sold as a custom turnkey deployment (one-time setup fee in BDT \+ optional monthly maintenance retainer).  
- **Working Market Hypotheses (To Validate Against Pilot Baselines):**  
  - *Hypothesis H1:* F-Commerce sellers lose an estimated 30%–50% of ad-driven impulse buyers due to Messenger reply delays and multi-step Western checkouts.  
  - *Hypothesis H2:* Over 90% of storefront traffic originates from the Facebook/Messenger mobile in-app browser (IAB) on Android devices.  
  - *Hypothesis H3:* Moderator phone follow-up on consented abandoned checkout numbers can recover 15%–25% of otherwise lost checkouts.  
  - *Baseline Discovery Requirement:* Before onboarding a client, record their 14-day baseline for daily ad spend, Messenger lead volume, order confirmation rate, and courier return (RTO) rate.

---

## 2\. Explicit MVP Scope & Non-Goals (Release Slicing)

To ensure security, data integrity, and a realistic delivery schedule, the product is sliced into four releases:

### In-Scope for MVP-1 & MVP-2 (Core Revenue & Courier Path)

1. **Single-Product Ad Funnel (`/offer/[slug]`):** High-converting mobile funnel page with variant selection, quantity/bundle selection, and embedded minimal checkout.  
2. **Server-Authoritative Minimal Checkout:** 3 text inputs (`Name`, `11-Digit BD Phone`, `Full Address`) \+ option selectors (`Variant/Size`, `Quantity/Bundle`, `Delivery Zone`, `Payment Method`), where the server strictly owns all price, discount, delivery charge, and stock calculations.  
3. **Consented Incomplete-Order Lead Capture:** Session-based lead capture with visible point-of-capture notice, full lifecycle (`OPEN`, `CONVERTED`, `DISMISSED`, `EXPIRED`), and 30-day automatic retention purge.  
4. **Clerk Invite-Only Staff RBAC:** Default-deny (`fail-closed`) authentication and resource-level authorization for `ADMIN` and `MODERATOR` roles.  
5. **Idempotent Steadfast Courier Integration:** 1-click parcel booking with `DISPATCHING / BOOKED / FAILED / NEEDS_RECONCILIATION` state locking, webhook/cron status sync, and 58mm/80mm thermal \+ A4 invoice printing.  
6. **Manual bKash Advance Verification Workflow:** Captures sender phone and `TrxID` into a `PaymentTransaction` queue (`ADVANCE_PENDING_VERIFICATION`) requiring explicit staff verification before deducting from `codCollectible`.

### Explicit Out-of-Scope (Deferred to Post-MVP Releases)

- **Shared Multi-Tenant SaaS Hosting:** No shared multi-merchant database in v2.0.  
- **Multi-Product Shopping Cart Drawer in MVP-1:** Deferred to MVP-4 so the single-product ad funnel \+ bundle selector ships with zero cart state desynchronization bugs.  
- **Automated bKash tokenized PGW / SSLCommerz Callbacks:** MVP uses COD \+ staff-verified manual bKash `TrxID`.  
- **Automated Bulk WhatsApp Marketing:** Staff use 1-tap `wa.me` click-to-chat only to prevent WhatsApp number bans.  
- **Pathao / RedX Live Adapters:** A `CourierProvider` interface is defined in code, but only the Steadfast adapter is wired in MVP-2.

---

## 3\. Unified Role & Permission Matrix (Single Source of Truth)

Clerk public sign-up MUST be disabled (**Invite-Only**). Every protected Page, Route Handler, and Server Action enforces `requireStaffRole()` checking both Clerk `sessionClaims.metadata.role` AND `User.isActive === true` in MySQL. Any missing, unknown, or inactive role fails closed with `403 Forbidden`.

| Route / Action / Resource | Public Shopper | `MODERATOR` (Active) | `ADMIN` (Active) |
| :---- | :---: | :---: | :---: |
| View `/offer/[slug]`, `/`, Legal Pages | Allowed | Allowed | Allowed |
| `POST /api/orders` & `POST /api/orders/incomplete` | Allowed (Rate-Limited) | Allowed | Allowed |
| View `/order-success/[publicToken]` (Masked PII) | Allowed (Token Required) | Allowed | Allowed |
| View `/admin/orders` & Filter/Search Orders | Denied (401/403) | Allowed | Allowed |
| Edit Order Address, Delivery Zone, Variant, Qty (Pre-Dispatch) | Denied | Allowed (Audited) | Allowed (Audited) |
| Confirm, Hold, Mark No-Answer, Cancel Order | Denied | Allowed (Audited) | Allowed (Audited) |
| Verify Manual bKash `TrxID` (`PaymentTransaction`) | Denied | Allowed (Audited) | Allowed (Audited) |
| Trigger 1-Click Steadfast Dispatch (`POST /api/courier/steadfast`) | Denied | Allowed (Idempotent) | Allowed (Idempotent) |
| Print Parcel Invoice (`/admin/invoice/[id]`) | Denied | Allowed | Allowed |
| View, Call, Convert, or Dismiss `/admin/incomplete` Leads | Denied | Allowed (Audited) | Allowed (Audited) |
| Manage Products, Variants, Stock & Prices (`/admin/products`) | Denied | **Denied (403)** | Allowed (Audited) |
| Add/Remove Phone from Blacklist (`/admin/blacklist`) | Denied | **Denied (403)** | Allowed (Audited) |
| View Profit / Ad Spend Analytics (`/admin/analytics`) | Denied | **Denied (403)** | Allowed |
| View/Update `/admin/settings` (Delivery Fees, Cooldown, Pixel ID) | Denied | **Denied (403)** | Allowed (Audited) |

---

## 4\. Functional Requirements & Testable Acceptance Criteria

### FR-01: Minimal Bangladeshi Checkout (3 Text Inputs \+ Option Selectors)

- **Description:** Shoppers complete checkout on `/offer/[slug]` without account creation using 3 text inputs (`customerName`, `customerPhone`, `customerAddress`) and 4 option selectors (`variantId`, `quantity/bundle`, `deliveryZone`, `paymentMethod`).  
- **Acceptance Criteria:**  
  - *Normal:* Inputting Bangla digits (`০১৭১২৩৪৫৬৭৮`) or pasted `+880 1712-345678` automatically normalizes to `01712345678` and passes `/^01[3-9]\d{8}$/`.  
  - *Server Price Authority:* Client submits only `variantId`, `quantity`, `deliveryZone`, and contact details. If a tampered request includes `unitPrice: 1` or `deliveryCharge: 0`, the server ignores client numbers and computes `subTotal`, `deliveryCharge` (from `StoreSettings`), and `totalAmount` from the database.  
  - *Idempotency:* Submitting the same form twice with the same client `idempotencyKey` (e.g., double-tap on slow 4G) returns HTTP `200 OK` with the existing order's `publicToken` without creating a second order or double-decrementing stock.

### FR-02: Variant-Level Atomic Inventory Protection

- **Description:** Stock is tracked per sellable SKU/variant (`ProductVariant`, e.g., Size M, L, XL, XXL) and decremented atomically.  
- **Acceptance Criteria:**  
  - *Concurrency:* If `ProductVariant` (Size XL) has `stock = 1` and two requests arrive simultaneously, `updateMany({ where: { id: variantId, stock: { gte: qty } }, data: { stock: { decrement: qty } } })` succeeds for exactly one request and aborts the second transaction with HTTP `409 Conflict` and a clear Bangla out-of-stock message.  
  - *Restock Rules:* Transitioning an order to `CANCELLED` (before shipping) or `RETURNED` (confirmed parcel return) increments `ProductVariant.stock` atomically once and logs an `OrderStatusHistory` record.

### FR-03: Privacy-Safe Incomplete Order Lead Capture & Lifecycle

- **Description:** Captures checkout session leads when a valid 11-digit phone number is entered, governed by transparent notice and session-scoped lifecycle.  
- **Acceptance Criteria:**  
  - *Transparency:* A visible Bangla notice appears directly below the phone field: *"অর্ডারটি সম্পূর্ণ না হলে ডেলিভারি সহায়তার জন্য আমরা এই নাম্বারে যোগাযোগ করতে পারি। (If your order is incomplete, we may contact this number to assist you.)"*  
  - *Session Scoping:* Leads are keyed by `sessionKey` (not `@unique` on `customerPhone`). A repeat customer who converted last week does not overwrite their historical record, and an already `CONVERTED` or `DISMISSED` session is never reset to `OPEN`.  
  - *Abuse Protection:* Endpoint enforces per-IP rate limiting (max 10 requests / 10 mins), Zod max-length validation, and a hidden honeypot field.  
  - *Retention:* A scheduled cleanup job purges `IncompleteOrder` records older than 30 days.

### FR-04: Nuanced Fake-Order Guard (Phone Cooldown \+ CGNAT-Safe Risk Scoring)

- **Description:** Protects merchants against fake COD spam without blocking legitimate buyers sharing mobile carrier CGNAT IPs.  
- **Acceptance Criteria:**  
  - *Hard Blocks:* Only normalized `customerPhone` numbers listed as active in `BlockedCustomer` are hard-blocked. Shared mobile IPs are **never** hard-blocked.  
  - *Phone Cooldown:* If the same `customerPhone` placed a `PENDING` order for the same product within `StoreSettings.orderCooldownMinutes` (default 15 mins) with a *different* `idempotencyKey`, return a polite Bangla prompt offering a direct WhatsApp link to modify their existing order.  
  - *IP Risk Scoring:* High request velocity from a single IP increments `Order.riskScore` and displays a `"High IP Velocity — Verify by Phone"` badge to the moderator rather than silently dropping the order.

### FR-05: Non-Guessable Order Confirmation Page (`/order-success/[publicToken]`)

- **Description:** Displays order confirmation without leaking customer PII or sequential order volume.  
- **Acceptance Criteria:**  
  - *Enumeration Prevention:* Accessing `/order-success/INV-1001` returns `404 Not Found`. Only the high-entropy `publicToken` (CUID2/UUID) renders the page.  
  - *PII Masking:* The public confirmation page displays only the customer's first name, masked phone (`017*****678`), ordered items, total payable BDT, and a WhatsApp support button—never the full street address or internal staff notes.

### FR-06: Idempotent Steadfast Courier Dispatch & Reconciliation

- **Description:** Pushes `CONFIRMED` orders to the Steadfast API safely and syncs delivery outcomes.  
- **Acceptance Criteria:**  
  - *Pre-Condition:* Only orders in `CONFIRMED` or `PACKED` status with `dispatchStatus IN ['NOT_SENT', 'FAILED']` can initiate dispatch.  
  - *Timeout Safety:* Before calling Steadfast, the server locks `CourierDispatch.dispatchStatus = 'DISPATCHING'`. If Steadfast times out, the record transitions to `NEEDS_RECONCILIATION` and queries Steadfast status by `invoiceNo` before ever attempting a duplicate creation call.  
  - *Booking vs Shipping:* Successful API booking sets `CourierDispatch.dispatchStatus = 'BOOKED'` and `Order.status = 'SHIPPED'`, storing `consignmentId`, `trackingCode`, and raw JSON response.

### FR-07: Meta Pixel \+ CAPI Event Architecture for COD

- **Description:** Tracks ad funnel performance while protecting Meta optimization from unverified fake COD orders.  
- **Acceptance Criteria:**  
  - *Configurable Purchase Trigger:* Supports two modes in `StoreSettings`:  
    1. `PURCHASE_ON_SUBMIT`: Fires Browser \+ Server CAPI `Purchase` on order submission (using `eventId = "pur_" + order.id`) for new ad accounts needing immediate volume.  
    2. `PURCHASE_ON_CONFIRM` (Recommended Default): Fires Browser \+ Server `Lead` (`OrderSubmitted`) on checkout submit, and fires Server CAPI `Purchase` (with stored `fbp`, `fbc`, client IP, User-Agent, and SHA-256 hashed `8801XXXXXXXXX`) only when a moderator marks the order `CONFIRMED`.  
  - *Non-Blocking Execution:* All server CAPI calls run asynchronously via Next.js `after()` (or outbox table) so Meta API latency never delays or fails customer checkout.

---

## 5\. Non-Functional Requirements (NFRs) & Performance Budget

1. **Mobile Performance Budget (Tested on Throttled 4G / Mid-Range Android):**  
   - **Zero Clerk JS on Storefront:** `<ClerkProvider>` is restricted strictly to `/admin` and `/sign-in` layouts so `/offer/[slug]` ships zero authentication bundle overhead.  
   - **LCP Target:** `< 1.8s` at P75 on `/offer/[slug]` using ISR (Incremental Static Regeneration), `next/image` AVIF/WebP priority hero image, and `Hind Siliguri` (`400`, `700` Bengali subset with `display: swap`).  
2. **Secrets & Security Posture:**  
   - API secrets (`STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY`, `META_CAPI_ACCESS_TOKEN`, `CLERK_SECRET_KEY`) live strictly in server environment variables (`.env`), never in plaintext database tables or client bundles.  
3. **Legal, Trust & Accessibility Baseline:**  
   - Dedicated `/privacy`, `/terms`, and `/return-policy` pages linked in the funnel footer.  
   - Minimum `4.5:1` WCAG AA contrast on all primary buttons (`#15803D` `bg-green-700` with `#FFFFFF` text \= `5.1:1`).

---

## 6\. Success Metrics & Operational KPIs

| Metric Name | Exact Formula / Definition | Target |
| :---- | :---- | :---- |
| **Funnel Submission Rate** | `Unique Submitted Orders / Unique /offer/[slug] Sessions` | `> 3.5%` |
| **Order Confirmation Rate** | `CONFIRMED Orders / Total Submitted Orders` (Excludes spam) | `> 80%` |
| **Net Delivery Success Rate** | `DELIVERED Orders / Total Dispatched Orders` | `> 85%` |
| **Consented Lead Recovery Rate** | `Converted Incomplete Leads / Total Open Consented Leads` | `12% – 20%` |
| **Click-to-Consignment Time** | Median time from Moderator clicking "Send to Steadfast" to `BOOKED` badge (excludes phone call duration) | `< 4 seconds` (P90 `< 8s`) |

