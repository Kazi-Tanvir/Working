# Application Flow & System Journeys (`appflow.md` — v2.0)

## 1\. End-to-End Customer Checkout, Idempotency & Meta CAPI Flow

This sequence diagram includes **phone normalization**, **session-scoped incomplete lead capture**, **idempotent order creation**, **server-authoritative pricing & atomic variant stock check**, **non-guessable `publicToken` redirect**, and **non-blocking background CAPI dispatch**.

sequenceDiagram

    autonumber

    actor Shopper as BD Mobile Shopper (FB Browser)

    participant UI as Next.js Funnel (/offer/\[slug\])

    participant API as Next.js Route Handlers

    participant DB as MySQL (Prisma)

    participant Meta as Meta Pixel \+ CAPI (Async)

    Shopper-\>\>UI: Opens /offer/\[slug\] from FB Sponsored Ad

    UI-\>\>Meta: Fire Browser Pixel ViewContent (eventId: vc\_\<uuid\>)

    Shopper-\>\>UI: Selects Variant (Size XL), Quantity (1), & scrolls to Checkout Form

    UI-\>\>Meta: Fire Browser Pixel InitiateCheckout (eventId: ic\_\<uuid\>)

    Shopper-\>\>UI: Enters Phone (accepts Bangla ০১৭... or \+88017...)

    Note over UI: Normalizes to 01XXXXXXXXX & shows privacy notice below input

    UI-\>\>API: Debounced POST /api/orders/incomplete { sessionKey, phone, variantId }

    API-\>\>DB: Upsert by sessionKey (only if status \== OPEN; never reopens CONVERTED/DISMISSED)

    Shopper-\>\>UI: Enters Name, Address, Zone (Inside Dhaka), & taps Confirm

    Note over UI: Disables button & sends UUID idempotencyKey

    UI-\>\>API: POST /api/orders { idempotencyKey, sessionKey, variantId, qty, zone, phone, ... }

    API-\>\>DB: Check existing Order by idempotencyKey

    alt Duplicate Network Retry / Double-Tap

        DB--\>\>API: Returns existing Order

        API--\>\>UI: 200 OK { publicToken, invoiceNo, deduplicated: true }

    else New Order Submission

        API-\>\>DB: Check BlockedCustomer (Phone only) & 15-min Phone Cooldown

        alt Blocked Phone or Cooldown Active

            API--\>\>UI: 403 / 429 Polite Bangla Notice \+ WhatsApp Support Link

        else Passed Guard

            API-\>\>DB: Prisma \$transaction (Load DB Price/Zone \+ Atomic Variant Stock \>= qty \+ InvoiceCounter \+ Create Order \+ Convert Lead)

            alt Variant Stock \< qty (Oversell Prevented)

                DB--\>\>API: Rollback (OUT\_OF\_STOCK)

                API--\>\>UI: 409 Conflict (Bangla Out-of-Stock Message)

            else Transaction Committed

                API--\>\>UI: 201 Created { publicToken, invoiceNo }

                API--)Meta: Next.js after() \-\> Fire Server CAPI Lead/OrderSubmitted (Non-blocking)

                UI-\>\>Shopper: Redirect to /order-success/\[publicToken\] (Shows Masked PII only)

            end

        end

    end

---

## 2\. Consented Incomplete-Order Lead Lifecycle & Moderator Recovery Flow

Leads are tracked per checkout `sessionKey` (not `@unique` on phone), require a visible point-of-capture notice, and follow a strict 4-state lifecycle (`OPEN`, `CONVERTED`, `DISMISSED`, `EXPIRED`).

flowchart TD

    A\[Shopper types 11-digit BD number in Checkout\] \--\> B\[Normalize Bangla digits & strip \+880/spaces\]

    B \--\> C{Matches /^01\[3-9\]\\d{8}\$/ ?}

    C \-- No \--\> D\[Show helper counter e.g. 8/11 digits\]

    C \-- Yes \--\> E\[POST /api/orders/incomplete with sessionKey\]

    E \--\> F{Rate limit & Honeypot OK?}

    F \-- No \--\> G\[Drop silently / 429\]

    F \-- Yes \--\> H{Existing sessionKey CONVERTED or DISMISSED?}

    H \-- Yes \--\> I\[Do NOT reopen lead\]

    H \-- No \--\> J\[Upsert OPEN Lead with expiresAt \= \+30 days\]

    J \--\> K{Did shopper complete full order?}

    K \-- Yes \--\> L\[Transaction sets LeadStatus \= CONVERTED\]

    K \-- No \--\> M\[Appears in /admin/incomplete Queue\]

    M \--\> N\[Moderator calls customer or opens 1-tap wa.me chat\]

    N \--\> O{Customer wants to complete order?}

    O \-- Yes \--\> P\[Moderator converts lead \-\> Creates Order & sets CONVERTED\]

    O \-- No / Wrong Number \--\> Q\[Moderator sets LeadStatus \= DISMISSED with audit note\]

    J \--\> R\[Nightly Cleanup Cron: Delete/Expire leads where expiresAt \< now\]

---

## 3\. Nuanced Fake-Order & Abuse Prevention Pipeline

Bangladeshi mobile operators (Grameenphone, Robi, Banglalink) place thousands of users behind shared **CGNAT IP addresses**. Therefore, IP addresses are **never** used to hard-block an order.

1. **Stage 1: Canonical Normalization & Zod Schema Gate**  
   - Converts Bangla numerals (`০১২৩৪৫৬৭৮৯` \-\> `0123456789`), strips `+88`, spaces, and hyphens, and validates `/^01[3-9]\d{8}$/`.  
   - Rejects payloads exceeding field length limits or failing the hidden honeypot field.  
2. **Stage 2: Idempotency Replay Guard (`Order.idempotencyKey`)**  
   - If the client UUID `idempotencyKey` already exists in `Order`, immediately returns `200 OK` with the existing `publicToken` so slow 4G double-taps never show an error screen.  
3. **Stage 3: Phone-Only Hard Blacklist (`BlockedCustomer`)**  
   - Queries `BlockedCustomer` using **only** the normalized `customerPhone` (`where: { phone, isActive: true }`). Never passes `undefined` inside a Prisma `OR` clause.  
4. **Stage 4: Per-Phone Cooldown Window (`StoreSettings.orderCooldownMinutes`)**  
   - Blocks a second `PENDING` order from the same `customerPhone` within 15 minutes and provides a 1-tap WhatsApp link in case the customer wants to edit their size or quantity.  
5. **Stage 5: CGNAT-Safe Risk Scoring & Moderator Flagging (`Order.riskScore`)**  
   - Computes an internal `riskScore` (`0–100`) based on:  
     - Store's own historical return count for that phone (`RETURNED` orders \>= 2 adds `+50` risk).  
     - High IP velocity (`>= 3` orders from the same IP in 60 mins adds `+40` risk).  
     - Cached external courier delivery ratio (if configured and sample size `>= 3`).  
   - Orders with `riskScore >= 50` are highlighted in `/admin/orders` with a `"High Risk — Confirm Carefully"` badge for moderator review.

---

## 4\. Clerk Authentication & Fail-Closed RBAC Flow

`ClerkProvider` is scoped strictly to `/admin` and `/sign-in` so storefront shoppers download zero auth JavaScript. Both Middleware and Server Route Handlers / Actions enforce default-deny authorization.

flowchart LR

    subgraph Public\_Storefront \[Public Storefront \- Zero Clerk JS\]

        S1\[/offer/slug Funnel\]

        S2\[POST /api/orders\]

        S3\[POST /api/orders/incomplete\]

        S4\[/order-success/publicToken\]

    end

    subgraph Protected\_Admin \[Protected Admin & Staff APIs\]

        M\[Clerk Middleware \+ requireStaffRole Helper\]

        M \--\> CheckAuth{Signed In & User.isActive \== true?}

        CheckAuth \-- No \--\> Deny401\[401 / Redirect to /sign-in\]

        CheckAuth \-- Yes \--\> CheckRole{Check Role in Session \+ DB}

        CheckRole \-- Unknown / Missing Role \--\> Deny403\[403 Forbidden \- Default Deny\]

        CheckRole \-- MODERATOR \--\> ModRoutes\[Orders, Incomplete Leads, Courier Dispatch, Invoice Print\]

        CheckRole \-- MODERATOR \--\> ModBlock\[403 Forbidden on Products, Blacklist, Analytics, Settings\]

        CheckRole \-- ADMIN \--\> AdminRoutes\[Full Access \+ Audit Logged Mutations\]

    end

---

## 5\. Order Lifecycle, Payment Verification & Idempotent Steadfast Dispatch

### 5.1 Allowed Order Status Transitions (Enforced Server State Machine)

| Current Status | Allowed Next Statuses | Required Role | Side Effects |
| :---- | :---- | :---- | :---- |
| `PENDING` | `CONFIRMED`, `ON_HOLD`, `NO_ANSWER`, `AWAITING_ADVANCE`, `CANCELLED` | `MODERATOR`, `ADMIN` | `CONFIRMED` fires Server CAPI `Purchase` (if `ON_CONFIRM`). `CANCELLED` restocks `ProductVariant.stock`. |
| `ON_HOLD` / `NO_ANSWER` | `CONFIRMED`, `CANCELLED` | `MODERATOR`, `ADMIN` | Logs call attempt in `OrderStatusHistory`. |
| `AWAITING_ADVANCE` | `CONFIRMED`, `CANCELLED` | `MODERATOR`, `ADMIN` | Transition to `CONFIRMED` requires verified `PaymentTransaction` (`PAID` / `PARTIALLY_PAID`), recalculating `codCollectible`. |
| `CONFIRMED` | `PACKED`, `SHIPPED`, `CANCELLED` | `MODERATOR`, `ADMIN` | `CANCELLED` restocks `ProductVariant.stock` only if courier is `NOT_SENT`. |
| `PACKED` | `SHIPPED`, `CANCELLED` | `MODERATOR`, `ADMIN` | Triggered automatically when Steadfast returns `BOOKED`. |
| `SHIPPED` | `DELIVERED`, `PARTIAL_DELIVERED`, `RETURNED` | `ADMIN` or Courier Webhook/Sync | `RETURNED` records `returnReason`, logs `returnPenaltyBdt`, and restocks inventory once. |
| `DELIVERED` / `CANCELLED` / `RETURNED` | *Terminal States (No backward transitions allowed)* | `ADMIN` override only | Prevents accidental status corruption. |

### 5.2 Idempotent Steadfast Dispatch & Timeout Recovery Flow

sequenceDiagram

    autonumber

    actor Staff as Moderator / Admin

    participant AdminUI as /admin/orders

    participant DispatchAPI as POST /api/courier/steadfast

    participant DB as MySQL (Prisma)

    participant Steadfast as Steadfast Packzy API

    Staff-\>\>AdminUI: Taps "Send to Steadfast" on CONFIRMED order

    AdminUI-\>\>DispatchAPI: POST /api/courier/steadfast { orderId, idempotencyKey }

    DispatchAPI-\>\>DB: Verify Staff Role (ADMIN/MODERATOR) & Lock CourierDispatch

    alt Already BOOKED or DISPATCHING

        DB--\>\>DispatchAPI: Return current status (Prevents double parcel creation)

        DispatchAPI--\>\>AdminUI: 200 OK / 409 In-Progress

    else Status \== NOT\_SENT or FAILED

        DispatchAPI-\>\>DB: Set dispatchStatus \= DISPATCHING, increment attemptCount

        DispatchAPI-\>\>Steadfast: POST /create\_order { invoice: invoiceNo, cod\_amount: codCollectible, ... }

        alt 200 OK with consignment\_id

            Steadfast--\>\>DispatchAPI: { consignment\_id, tracking\_code }

            DispatchAPI-\>\>DB: Update CourierDispatch \= BOOKED, Order.status \= SHIPPED \+ AuditLog

            DispatchAPI--\>\>AdminUI: 200 OK (Show Tracking Badge & Print Button)

        else Network Timeout / 5xx Uncertain State

            DispatchAPI-\>\>DB: Set dispatchStatus \= NEEDS\_RECONCILIATION

            DispatchAPI--\>\>AdminUI: 504 Timeout — Click "Reconcile Status" before retrying

        else 4xx Validation Error

            DispatchAPI-\>\>DB: Set dispatchStatus \= FAILED \+ save lastError

            DispatchAPI--\>\>AdminUI: 400 Error (Moderator fixes address & retries safely)

        end

    end