# Database Schema & Prisma Specification (`schema.md` — v2.0)

## 1\. Architectural Upgrades (Post-Audit v2.0)

- **Database Engine:** MySQL 8.0+ (`provider = "mysql"`), configured with connection pooling for serverless deployments.  
- **Variant-Level Inventory (`ProductVariant`):** Stock, SKU, cost price, and sale price are modeled per sellable variant (e.g., Size M, L, XL, XXL) rather than a single product-level integer, eliminating overselling across sizes.  
- **Soft Deletion Only:** Products and variants use `isActive` and `deletedAt` with `onDelete: Restrict` on `OrderItem` so historical invoices and profit reports never break.  
- **Opaque Public Token vs. Sequential Invoice:** `Order` separates `invoiceNo` (`INV-1001`, generated via an atomic `InvoiceCounter` row for staff/Steadfast) from `publicToken` (high-entropy CUID used on `/order-success/[publicToken]`).  
- **Separated State Machines:** Fulfillment status (`OrderStatus`), payment verification (`PaymentStatus` \+ `PaymentTransaction`), and courier booking (`DispatchStatus` \+ `CourierDispatch`) are decoupled and audited via `OrderStatusHistory`.  
- **Session-Scoped `IncompleteOrder`:** Keyed by `sessionKey` instead of `@unique` on `customerPhone`, with explicit `LeadStatus` (`OPEN`, `CONVERTED`, `DISMISSED`, `EXPIRED`) and 30-day retention (`expiresAt`).  
- **Secrets Removed from DB:** Third-party secret keys (`STEADFAST_SECRET_KEY`, `META_CAPI_ACCESS_TOKEN`) are stored strictly in server `.env` variables, not in `StoreSettings`.

---

## 2\. Complete `prisma/schema.prisma`

// prisma/schema.prisma

generator client {

  provider \= "prisma-client-js"

}

datasource db {

  provider \= "mysql"

  url      \= env("DATABASE\_URL")

}

// \==========================================

// 1\. ENUMS (EXPLICIT STATE MACHINES)

// \==========================================

enum StaffRole {

  ADMIN

  MODERATOR

}

enum DeliveryZone {

  INSIDE\_DHAKA  // Default 70 BDT

  SUB\_DHAKA     // Savar, Ashulia, Gazipur, Keraniganj, Narayanganj \- Default 100 BDT

  OUTSIDE\_DHAKA // All other 63 districts \- Default 130 BDT

}

enum PaymentMethod {

  COD

  BKASH\_MANUAL

  NAGAD\_MANUAL

}

enum PaymentStatus {

  UNPAID

  ADVANCE\_PENDING\_VERIFICATION

  PARTIALLY\_PAID

  PAID

  REFUNDED

  FAILED

}

enum OrderStatus {

  PENDING           // Newly submitted by customer

  ON\_HOLD           // Customer requested later delivery / stock check

  NO\_ANSWER         // Moderator called, customer did not pick up

  AWAITING\_ADVANCE  // Waiting for advance delivery charge via bKash

  CONFIRMED         // Phone verified by Moderator, ready to pack

  PACKED            // Invoice printed & parcel packed

  SHIPPED           // Booked with Steadfast / handed to courier

  DELIVERED         // Courier delivered parcel to customer

  PARTIAL\_DELIVERED // Customer kept part of multi-item order

  CANCELLED         // Cancelled before shipping (restocks inventory)

  RETURNED          // Customer refused / returned via courier (restocks if intact)

}

enum DispatchStatus {

  NOT\_SENT

  DISPATCHING          // In-flight lock to prevent double-click duplicate parcels

  BOOKED               // Consignment ID received from Steadfast

  IN\_TRANSIT           // Picked up by courier rider

  DELIVERED            // Courier confirmed delivery

  RETURNED             // Courier confirmed return (RTO)

  FAILED               // API rejected request (safe to retry)

  NEEDS\_RECONCILIATION // Network timeout during booking; check status by invoiceNo first

}

enum LeadStatus {

  OPEN

  CONVERTED

  DISMISSED

  EXPIRED

}

// \==========================================

// 2\. CLERK STAFF USERS & RBAC

// \==========================================

model User {

  id                  String               @id @default(cuid())

  clerkId             String               @unique

  email               String               @unique

  name                String

  role                StaffRole

  isActive            Boolean              @default(true)

  processedOrders     Order\[\]              @relation("ProcessedByStaff")

  verifiedPayments    PaymentTransaction\[\] @relation("VerifiedByStaff")

  statusHistoryLogs   OrderStatusHistory\[\]

  dismissedLeads      IncompleteOrder\[\]    @relation("DismissedByStaff")

  createdBlocks       BlockedCustomer\[\]

  createdAt           DateTime             @default(now())

  updatedAt           DateTime             @updatedAt

}

// \==========================================

// 3\. CATALOG, PRODUCTS & VARIANT INVENTORY

// \==========================================

model Category {

  id        String    @id @default(cuid())

  name      String

  slug      String    @unique

  sortOrder Int       @default(0)

  products  Product\[\]

  createdAt DateTime  @default(now())

}

model Product {

  id               String           @id @default(cuid())

  name             String           // Bangla/English product title

  slug             String           @unique

  description      String           @db.Text

  images           Json             // Validated string\[\] of UploadThing/Cloudinary URLs

  features         Json             // Validated string\[\] of Bangla funnel bullet points

  reviewsImages    Json?            // Consented/redacted customer review image URLs

  bundleConfig     Json?            // e.g., \[{"qty": 2, "discountBdt": 130, "label": "২ টি কম্বো"}\]

  offerEndsAt      DateTime?        // Real promotion end timestamp (null \= no countdown)

  isFeaturedFunnel Boolean          @default(false)

  isActive         Boolean          @default(true)

  deletedAt        DateTime?        // Soft delete timestamp

  categoryId       String?

  category         Category?        @relation(fields: \[categoryId\], references: \[id\])

  variants         ProductVariant\[\]

  orderItems       OrderItem\[\]

  createdAt        DateTime         @default(now())

  updatedAt        DateTime         @updatedAt

  @@index(\[isActive, isFeaturedFunnel\])

}

model ProductVariant {

  id           String      @id @default(cuid())

  productId    String

  sku          String      @unique

  label        String      // e.g., "Size: XL" or "1kg Jar"

  regularPrice Int         // Authoritative regular price in BDT (e.g., 1850\)

  salePrice    Int         // Authoritative sale price in BDT (e.g., 1290\)

  costPrice    Int         @default(0) // Unit wholesale cost in BDT for profit tracking

  stock        Int         @default(0) // Atomic variant-level stock counter

  sortOrder    Int         @default(0)

  isActive     Boolean     @default(true)

  deletedAt    DateTime?

  product      Product     @relation(fields: \[productId\], references: \[id\])

  orderItems   OrderItem\[\]

  createdAt    DateTime    @default(now())

  updatedAt    DateTime    @updatedAt

  @@index(\[productId, isActive\])

}

// \==========================================

// 4\. ATOMIC INVOICE COUNTER & ORDERS

// \==========================================

model InvoiceCounter {

  id         String @id @default("default")

  lastNumber Int    @default(1000) // Incremented atomically inside order transaction

}

model Order {

  id                  String               @id @default(cuid())

  invoiceNo           String               @unique // Staff & Courier label ID: "INV-1001"

  publicToken         String               @unique @default(cuid()) // Unguessable URL token

  idempotencyKey      String               @unique // Client UUID to prevent duplicate double-taps

  customerName        String

  customerPhone       String               // Canonical 11-digit BD format: 01XXXXXXXXX

  customerAddress     String               @db.Text

  customerNote        String?              @db.Text

  staffNote           String?              @db.Text

  deliveryZone        DeliveryZone         @default(INSIDE\_DHAKA)

  deliveryCharge      Int                  // Server-computed from StoreSettings

  subTotal            Int                  // Server-computed sum of OrderItems

  discountAmount      Int                  @default(0)

  totalAmount         Int                  // subTotal \+ deliveryCharge \- discountAmount

  advancePaid         Int                  @default(0) // Verified advance amount only

  codCollectible      Int                  // totalAmount \- advancePaid (never \< 0\)

  paymentMethod       PaymentMethod        @default(COD)

  paymentStatus       PaymentStatus        @default(UNPAID)

  status              OrderStatus          @default(PENDING)

  returnReason        String?              // Logged if CANCELLED or RETURNED

  isStockRestocked    Boolean              @default(false) // Prevents double restocking

  // Fraud & Risk Enrichment (IP is a weak signal, never a hard block)

  ipAddress           String?

  userAgent           String?              @db.Text

  riskScore           Int                  @default(0) // 0-100 composite risk score

  courierSuccessPct   Float?

  courierRatioSource  String?

  courierRatioCheckedAt DateTime?

  // Marketing & Meta CAPI Attribution

  landingSlug         String?

  utmSource           String?

  utmMedium           String?

  utmCampaign         String?

  fbclid              String?

  fbp                 String?              // \_fbp cookie for Meta CAPI match quality

  fbc                 String?              // \_fbc cookie for Meta CAPI match quality

  capiPurchaseSentAt  DateTime?            // Guards against duplicate CAPI Purchase firing

  processedById       String?

  processedBy         User?                @relation("ProcessedByStaff", fields: \[processedById\], references: \[id\])

  items               OrderItem\[\]

  payments            PaymentTransaction\[\]

  courierDispatch     CourierDispatch?

  statusHistory       OrderStatusHistory\[\]

  createdAt           DateTime             @default(now())

  updatedAt           DateTime             @updatedAt

  @@index(\[customerPhone, createdAt\])

  @@index(\[ipAddress, createdAt\])

  @@index(\[status, createdAt\])

}

model OrderItem {

  id           String         @id @default(cuid())

  orderId      String

  productId    String

  variantId    String

  productName  String         // Snapshot at sale time

  variantLabel String         // Snapshot at sale time (e.g., "Size: XL")

  skuSnapshot  String         // Snapshot at sale time

  quantity     Int

  unitPrice    Int            // Authoritative server salePrice at sale time

  unitCost     Int            // Authoritative server costPrice at sale time (for profit calc)

  totalPrice   Int            // unitPrice \* quantity

  order        Order          @relation(fields: \[orderId\], references: \[id\], onDelete: Cascade)

  product      Product        @relation(fields: \[productId\], references: \[id\], onDelete: Restrict)

  variant      ProductVariant @relation(fields: \[variantId\], references: \[id\], onDelete: Restrict)

  @@index(\[orderId\])

  @@index(\[variantId\])

}

// \==========================================

// 5\. PAYMENT VERIFICATION & COURIER DISPATCH

// \==========================================

model PaymentTransaction {

  id           String        @id @default(cuid())

  orderId      String

  method       PaymentMethod

  amount       Int           // Amount claimed or verified in BDT

  senderPhone  String?       // Customer bKash/Nagad number

  trxId        String?       @unique // Prevents reusing the same TrxID across orders

  status       PaymentStatus @default(ADVANCE\_PENDING\_VERIFICATION)

  verifiedById String?

  verifiedBy   User?         @relation("VerifiedByStaff", fields: \[verifiedById\], references: \[id\])

  verifiedAt   DateTime?

  rejectionNote String?

  order        Order         @relation(fields: \[orderId\], references: \[id\], onDelete: Cascade)

  createdAt    DateTime      @default(now())

  @@index(\[orderId, status\])

}

model CourierDispatch {

  id                String         @id @default(cuid())

  orderId           String         @unique

  provider          String         @default("STEADFAST")

  dispatchStatus    DispatchStatus @default(NOT\_SENT)

  idempotencyKey    String         @unique // Prevents duplicate parcel booking

  consignmentId     String?        @unique

  trackingCode      String?

  codAmountSent     Int            // Exact COD collectible sent to courier

  courierFeeBdt     Int            @default(0) // Actual courier delivery charge for profit calc

  codFeeBdt         Int            @default(0) // 1% COD fee if applicable

  returnPenaltyBdt  Int            @default(0) // RTO return cost if parcel is returned

  attemptCount      Int            @default(0)

  lastError         String?        @db.Text

  rawResponse       Json?

  dispatchedAt      DateTime?

  deliveredAt       DateTime?

  settledAt         DateTime?      // When courier settles COD cash to merchant bank/bKash

  order             Order          @relation(fields: \[orderId\], references: \[id\], onDelete: Cascade)

  createdAt         DateTime       @default(now())

  updatedAt         DateTime       @updatedAt

  @@index(\[dispatchStatus, updatedAt\])

}

model OrderStatusHistory {

  id         String       @id @default(cuid())

  orderId    String

  actorId    String?      // Null if system/webhook action

  actor      User?        @relation(fields: \[actorId\], references: \[id\])

  fromStatus OrderStatus?

  toStatus   OrderStatus

  action     String       // e.g., "CONFIRM\_ORDER", "EDIT\_ADDRESS", "STEADFAST\_BOOKED"

  note       String?      @db.Text

  order      Order        @relation(fields: \[orderId\], references: \[id\], onDelete: Cascade)

  createdAt  DateTime     @default(now())

  @@index(\[orderId, createdAt\])

}

// \==========================================

// 6\. SESSION-SCOPED INCOMPLETE ORDER LEADS

// \==========================================

model IncompleteOrder {

  id              String        @id @default(cuid())

  sessionKey      String        @unique // Client checkout session UUID (NOT unique on phone)

  customerPhone   String        // Canonical 11-digit BD number

  customerName    String?

  customerAddress String?       @db.Text

  deliveryZone    DeliveryZone?

  productSlug     String?

  variantLabel    String?

  quantity        Int           @default(1)

  estimatedTotal  Int?

  consentNoticeShown Boolean    @default(true)

  status          LeadStatus    @default(OPEN)

  callAttempts    Int           @default(0)

  staffNote       String?       @db.Text

  convertedOrderId String?

  dismissedById   String?

  dismissedBy     User?         @relation("DismissedByStaff", fields: \[dismissedById\], references: \[id\])

  dismissedAt     DateTime?

  expiresAt       DateTime      // Set to createdAt \+ 30 days for automatic privacy purge

  createdAt       DateTime      @default(now())

  updatedAt       DateTime      @updatedAt

  @@index(\[status, updatedAt\])

  @@index(\[customerPhone, status\])

  @@index(\[expiresAt\])

}

// \==========================================

// 7\. BLACKLIST, AD SPEND & NON-SECRET SETTINGS

// \==========================================

model BlockedCustomer {

  id          String    @id @default(cuid())

  phone       String    @unique // Normalized 01XXXXXXXXX (Hard block)

  reason      String

  isActive    Boolean   @default(true)

  expiresAt   DateTime?

  createdById String

  createdBy   User      @relation(fields: \[createdById\], references: \[id\])

  createdAt   DateTime  @default(now())

  updatedAt   DateTime  @updatedAt

  @@index(\[phone, isActive\])

}

model AdSpend {

  id           String   @id @default(cuid())

  spendDate    DateTime @db.Date // Daily ad spend date

  campaignName String   @default("All Campaigns")

  productSlug  String?

  amountBdt    Int      // Daily ad spend converted to BDT for net profit calculation

  createdAt    DateTime @default(now())

  @@index(\[spendDate\])

}

model StoreSettings {

  id                     String   @id @default("default")

  storeName              String   @default("আমার শপ (Amar Shop)")

  supportPhone           String   @default("01700000000")

  whatsappNumber         String   @default("8801700000000")

  insideDhakaCharge      Int      @default(70)

  subDhakaCharge         Int      @default(100)

  outsideDhakaCharge     Int      @default(130)

  bkashMerchantNumber    String?  // Public display number for manual bKash advance

  requireOutsideAdvance  Boolean  @default(false)

  orderCooldownMinutes   Int      @default(15)

  capiPurchaseTrigger    String   @default("ON\_CONFIRM") // "ON\_CONFIRM" | "ON\_SUBMIT"

  updatedAt              DateTime @updatedAt

}

---

## 3\. Server-Authoritative Order Creation (`src/services/order.service.ts`)

This transaction guarantees:

1. **Zero client price trust:** Prices and shipping charges are loaded strictly from `ProductVariant` and `StoreSettings`.  
2. **Safe Prisma `OR` handling:** Never passes `undefined` inside a Prisma `OR` filter.  
3. **Idempotency:** Returns the existing order if `idempotencyKey` was already processed.  
4. **Atomic variant stock guard:** Rejects the order if concurrent buyers exhaust `ProductVariant.stock`.

import { prisma } from '@/lib/prisma';

import { DeliveryZone, PaymentMethod } from '@prisma/client';

export interface CreateOrderInput {

  idempotencyKey: string;

  sessionKey?: string;

  customerName: string;

  customerPhone: string; // Already normalized to 01XXXXXXXXX

  customerAddress: string;

  deliveryZone: DeliveryZone;

  paymentMethod: PaymentMethod;

  bkashSenderPhone?: string;

  bkashTrxId?: string;

  variantId: string;

  quantity: number;

  ipAddress?: string;

  userAgent?: string;

  fbp?: string;

  fbc?: string;

  utmSource?: string;

  utmCampaign?: string;

}

export async function createAuthoritativeOrder(input: CreateOrderInput) {

  // 1\. Idempotency Check: Return existing order on network retry / double-tap

  const existingOrder \= await prisma.order.findUnique({

    where: { idempotencyKey: input.idempotencyKey },

  });

  if (existingOrder) {

    return { order: existingOrder, deduplicated: true };

  }

  // 2\. Hard Blacklist Check (Phone only — never hard-block shared CGNAT IPs)

  const blocked \= await prisma.blockedCustomer.findFirst({

    where: {

      phone: input.customerPhone,

      isActive: true,

      OR: \[{ expiresAt: null }, { expiresAt: { gt: new Date() } }\],

    },

  });

  if (blocked) {

    throw new Error('ORDER\_BLOCKED\_CONTACT\_SUPPORT');

  }

  // 3\. Load StoreSettings & Authoritative ProductVariant

  const \[settings, variant\] \= await Promise.all(\[

    prisma.storeSettings.upsert({

      where: { id: 'default' },

      update: {},

      create: { id: 'default' },

    }),

    prisma.productVariant.findFirst({

      where: { id: input.variantId, isActive: true, deletedAt: null },

      include: { product: true },

    }),

  \]);

  if (\!variant || \!variant.product.isActive) {

    throw new Error('PRODUCT\_VARIANT\_UNAVAILABLE');

  }

  if (input.quantity \< 1 || input.quantity \> 20\) {

    throw new Error('INVALID\_QUANTITY');

  }

  // 4\. Phone Cooldown Check (Safe query — no undefined inside OR)

  const cooldownCutoff \= new Date(Date.now() \- settings.orderCooldownMinutes \* 60 \* 1000);

  const recentOrder \= await prisma.order.findFirst({

    where: {

      customerPhone: input.customerPhone,

      createdAt: { gte: cooldownCutoff },

      status: { notIn: \['CANCELLED', 'RETURNED'\] },

    },

  });

  if (recentOrder) {

    throw new Error('COOLDOWN\_ACTIVE\_USE\_WHATSAPP');

  }

  // 5\. Compute IP Velocity Risk Score (Weak signal for Moderator review)

  let riskScore \= 0;

  if (input.ipAddress) {

    const recentIpOrders \= await prisma.order.count({

      where: {

        ipAddress: input.ipAddress,

        createdAt: { gte: new Date(Date.now() \- 60 \* 60 \* 1000\) },

      },

    });

    if (recentIpOrders \>= 3\) riskScore \+= 40;

  }

  // 6\. Server-Authoritative Financial Calculation

  const deliveryCharge \=

    input.deliveryZone \=== 'INSIDE\_DHAKA'

      ? settings.insideDhakaCharge

      : input.deliveryZone \=== 'SUB\_DHAKA'

      ? settings.subDhakaCharge

      : settings.outsideDhakaCharge;

  const subTotal \= variant.salePrice \* input.quantity;

  const discountAmount \= 0; // Apply verified bundle rules from variant.product.bundleConfig if matched

  const totalAmount \= subTotal \+ deliveryCharge \- discountAmount;

  // Note: Unverified manual bKash advance does NOT reduce codCollectible until staff verifies TrxID

  const advancePaid \= 0;

  const codCollectible \= totalAmount \- advancePaid;

  // 7\. Execute Atomic Transaction (Stock Check \+ Counter \+ Order \+ Lead Conversion)

  const order \= await prisma.\$transaction(async (tx) \=\> {

    // 7a. Conditional Atomic Stock Decrement

    const stockUpdate \= await tx.productVariant.updateMany({

      where: {

        id: variant.id,

        isActive: true,

        stock: { gte: input.quantity },

      },

      data: {

        stock: { decrement: input.quantity },

      },

    });

    if (stockUpdate.count \=== 0\) {

      throw new Error('OUT\_OF\_STOCK');

    }

    // 7b. Atomic Sequential Invoice Number Generation

    const counter \= await tx.invoiceCounter.upsert({

      where: { id: 'default' },

      update: { lastNumber: { increment: 1 } },

      create: { id: 'default', lastNumber: 1001 },

    });

    const invoiceNo \= \`INV-\${counter.lastNumber}\`;

    // 7c. Create Order \+ OrderItem \+ Status History

    const createdOrder \= await tx.order.create({

      data: {

        invoiceNo,

        idempotencyKey: input.idempotencyKey,

        customerName: input.customerName.trim(),

        customerPhone: input.customerPhone,

        customerAddress: input.customerAddress.trim(),

        deliveryZone: input.deliveryZone,

        deliveryCharge,

        subTotal,

        discountAmount,

        totalAmount,

        advancePaid,

        codCollectible,

        paymentMethod: input.paymentMethod,

        paymentStatus:

          input.paymentMethod \!== 'COD' && input.bkashTrxId

            ? 'ADVANCE\_PENDING\_VERIFICATION'

            : 'UNPAID',

        status:

          input.paymentMethod \!== 'COD' && input.bkashTrxId

            ? 'AWAITING\_ADVANCE'

            : 'PENDING',

        ipAddress: input.ipAddress ?? null,

        userAgent: input.userAgent ?? null,

        riskScore,

        fbp: input.fbp ?? null,

        fbc: input.fbc ?? null,

        utmSource: input.utmSource ?? null,

        utmCampaign: input.utmCampaign ?? null,

        items: {

          create: {

            productId: variant.productId,

            variantId: variant.id,

            productName: variant.product.name,

            variantLabel: variant.label,

            skuSnapshot: variant.sku,

            quantity: input.quantity,

            unitPrice: variant.salePrice,

            unitCost: variant.costPrice,

            totalPrice: subTotal,

          },

        },

        statusHistory: {

          create: {

            fromStatus: null,

            toStatus:

              input.paymentMethod \!== 'COD' && input.bkashTrxId

                ? 'AWAITING\_ADVANCE'

                : 'PENDING',

            action: 'CUSTOMER\_CHECKOUT\_SUBMIT',

            note: 'Order created via public funnel checkout',

          },

        },

      },

    });

    // 7d. Record Pending Manual bKash Transaction if submitted

    if (input.paymentMethod \!== 'COD' && input.bkashTrxId) {

      await tx.paymentTransaction.create({

        data: {

          orderId: createdOrder.id,

          method: input.paymentMethod,

          amount: deliveryCharge,

          senderPhone: input.bkashSenderPhone ?? null,

          trxId: input.bkashTrxId.trim().toUpperCase(),

          status: 'ADVANCE\_PENDING\_VERIFICATION',

        },

      });

    }

    // 7e. Convert Open IncompleteOrder Leads for this Session or Phone

    await tx.incompleteOrder.updateMany({

      where: {

        status: 'OPEN',

        OR: \[

          ...(input.sessionKey ? \[{ sessionKey: input.sessionKey }\] : \[\]),

          { customerPhone: input.customerPhone },

        \],

      },

      data: {

        status: 'CONVERTED',

        convertedOrderId: createdOrder.id,

      },

    });

    return createdOrder;

  });

  return { order, deduplicated: false };

}