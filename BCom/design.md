# Design System & UI/UX Specification (`design.md` — v2.0)

## 1\. Design Philosophy: "High-Trust, Truthful Bangladeshi Mobile Commerce"

Bangladeshi online shoppers browsing inside the **Facebook or Messenger in-app browser (IAB)** on 320px–414px Android screens are skeptical of scam pages, deceptive timers, and cluttered interfaces. Our v2.0 design system enforces:

- **Truthful Scarcity & Guarantees:** Stock badges are bound directly to `ProductVariant.stock` in MySQL, and offer countdowns render only when `Product.offerEndsAt` is set to a real future timestamp.  
- **Honest "Minimal 3-Text-Input \+ Option Selectors" Layout:** Clearly separates option pills (Variant/Size, Quantity/Bundle, Delivery Zone, Payment Method) from the three required text inputs (`Name`, `Phone`, `Address`).  
- **WCAG AA Accessible Contrast:** Replaces low-contrast light green buttons with `#15803D` (`bg-green-700`) for a `5.1:1` contrast ratio outdoors, and restricts red (`#DC2626`) strictly to form errors and a single discount pill.  
- **Privacy-Safe Social Proof:** Customer review cards display consented written reviews or redacted screenshots (blurring customer full names, profile photos, and phone numbers).

---

## 2\. Typography System (`next/font/google`)

To meet the `< 1.8s` LCP budget on 4G mobile connections, load only the `bengali` and `latin` subsets with `display: 'swap'` and limit font weights:

- **Primary Bangla & UI Font:** `Hind Siliguri` (Weights: `400` Regular, `600` SemiBold, `700` Bold)  
- **Secondary Numeric & Invoice Font:** `Inter` (Weights: `500` Medium, `700` Bold)

| Element | Mobile / Desktop Size | Weight | Line Height | Usage & Accessibility Rule |
| :---- | :---- | :---- | :---- | :---- |
| **Funnel Headline (H1)** | `22px / 32px` (`text-xl md:text-3xl`) | `700 Bold` | `1.35` | Clean Bangla wrapping on `320px` screens |
| **Section Header (H2)** | `18px / 22px` (`text-lg md:text-xl`) | `700 Bold` | `1.4` | Checkout card header |
| **Sale Price Display** | `26px / 32px` (`text-2xl md:text-3xl`) | `700 Bold` | `1.2` | Derived dynamically from selected `ProductVariant.salePrice` |
| **Body & Policy Copy** | `16px` (`text-base`) | `400 Regular` | `1.6` | High readability for Bangla conjuncts (যুক্তবর্ণ) |
| **Form Inputs (`<input>`)** | `16px` (`text-base`) | `500 Medium` | `1.5` | **Mandatory `16px` minimum** to prevent iOS/Android WebView auto-zoom |

---

## 3\. WCAG AA Color Palette & Semantic Tokens

| Role | Hex Code | Tailwind Class | Contrast Ratio (vs `#FFFFFF`) | Usage Rule |
| :---- | :---- | :---- | :---- | :---- |
| **Primary CTA (Order Confirm)** | `#15803D` | `bg-green-700 hover:bg-green-800 text-white` | **5.1:1 (WCAG AA Pass)** | Main submit button, sticky bottom CTA |
| **Secondary / Neutral Surface** | `#F8FAFC` | `bg-slate-50 text-slate-900` | **18.2:1 (AAA)** | Page background |
| **Primary Body Text** | `#0F172A` | `text-slate-900` | **19.1:1 (AAA)** | Product titles, labels, prices |
| **Muted / Helper Text** | `#475569` | `text-slate-600` | **7.0:1 (AAA)** | Privacy notice under phone field, field hints |
| **Error & Single Discount Pill** | `#B91C1C` | `bg-red-700 text-white` / `text-red-700` | **6.4:1 (AA Pass)** | Form validation errors & 1 top discount badge (avoid alarm fatigue) |
| **Warning / Risk Flag** | `#92400E` | `bg-amber-100 text-amber-900 border-amber-300` | **8.3:1 (AAA)** | Admin `riskScore >= 50` badge, `AWAITING_ADVANCE` status |
| **bKash Brand Accent** | `#C91060` | `bg-[#C91060] text-white` | **4.9:1 (AA Pass)** | Manual bKash payment instruction card |
| **Steadfast Courier Accent** | `#0369A1` | `bg-sky-700 text-white` | **5.9:1 (AA Pass)** | Admin "Send to Steadfast" action button |

---

## 4\. Core Screen Wireframes (Fenced Specification)

### 4.1 Single-Product Ad Funnel (`/offer/[slug]`)

\+-------------------------------------------------------------------+

| \[Top Bar\] সারা বাংলাদেশে ক্যাশ অন ডেলিভারি | হেল্পলাইন: 017XX-XXXXXX |

\+-------------------------------------------------------------------+

| \[Product Image Carousel \- 1:1 Square, AVIF/WebP Priority LCP\]     |

| \[Badge: বাঁচুন ৳৫৬০ (Computed: regularPrice \- salePrice)\]         |

\+-------------------------------------------------------------------+

| প্রিমিয়াম ইজিপশিয়ান কটন পাঞ্জাবি (Premium Egyptian Cotton Panjabi)   |

| রেগুলার মূল্য: \~৳১,৮৫০\~   অফার মূল্য: ৳১,২৯০                      |

| \[স্টক আপডেট: XL সাইজে আর মাত্র ৭টি বাকি আছে (From Variant.stock)\]  |

|                                                                   |

| \[ 🛒 অর্ডার করতে নিচের ফর্মে যান (Smooth Scroll to \#checkout) \]    |

\+-------------------------------------------------------------------+

| কেন আমাদের থেকে নিবেন? (Product Features & Clear Return Policy)     |

|  \[✓\] ১০০% সুতি কাপড় — ছবির সাথে মিল না থাকলে ডেলিভারি ম্যানের কাছে |

|      ডেলিভারি চার্জ দিয়ে রিটার্ন করার সুবিধা ( বিস্তারিত রিটার্ন পলিসি ) |

\+-------------------------------------------------------------------+

| সম্মানিত গ্রাহকদের মতামত (Verified & Redacted Customer Reviews)    |

|  \[ "কাপড়ের মান আলহামদুলিল্লাহ অনেক ভালো" — রাহাত, মিরপুর (Verified) \] |

\+-------------------------------------------------------------------+

| \========= MINIMAL CHECKOUT (3 Text Inputs \+ Selectors) \========== |

|                                                                   |

| অপশন ১: সাইজ সিলেক্ট করুন (Variant Selector)\*                       |

|   \[ M (স্টকে আছে) \]  \[ L (স্টকে আছে) \]  \[• XL (৭টি বাকি) \]  \[ XXL (শেষ) \]|

|                                                                   |

| অপশন ২: পরিমাণ সিলেক্ট করুন (Quantity / Bundle Selector)\*           |

|   (•) ১ টি পাঞ্জাবি — ৳১,২৯০                                       |

|   ( ) ২ টি কম্বো প্যাক — ৳২,৪৫০ (৳১৩০ সাশ্রয়\!)                      |

|                                                                   |

| ইনপুট ১: আপনার নাম (Full Name)\*                                    |

|   \[ উদাঃ রহিম উদ্দিন (autocomplete="name")                       \] |

|                                                                   |

| ইনপুট ২: মোবাইল নাম্বার (11-Digit BD Phone)\*                       |

|   \[ 017XXXXXXXX (type="tel" inputMode="numeric" Bangla-\>EN)     \] |

|   ℹ অর্ডারটি সম্পূর্ণ না হলে সহায়তার জন্য আমরা এই নাম্বারে যোগাযোগ    |

|     করতে পারি। (Privacy Notice)                                    |

|                                                                   |

| ইনপুট ৩: সম্পূর্ণ ঠিকানা (Full Delivery Address)\*                  |

|   \[ বাসা নং, রোড, এলাকা, থানা ও জেলা (autocomplete="street-address")\]|

|                                                                   |

| অপশন ৩: ডেলিভারি এরিয়া (Delivery Zone — From StoreSettings)\*       |

|   (•) ঢাকার ভিতরে (Inside Dhaka City) .................... ৳৭০     |

|   ( ) ঢাকা সাব-এরিয়া (সাভার, আশুলিয়া, গাজীপুর, কেরানীগঞ্জ, নারায়ণগঞ্জ) ৳১০০|

|   ( ) ঢাকার বাইরে (Outside Dhaka \- ৬৩ জেলা) ............... ৳১৩০   |

|                                                                   |

| অপশন ৪: পেমেন্ট মেথড (Payment Method)\*                              |

|   (•) ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে ডেলিভারি ম্যানকে পেমেন্ট)     |

|   ( ) বিকাশ মার্চেন্ট / সেন্ড মানি (অগ্রিম ডেলিভারি চার্জ পেমেন্ট)      |

|       └─ \[If selected: Shows bKash No, Sender Phone & TrxID box\]  |

|                                                                   |

| \----------------------------------------------------------------- |

| প্রোডাক্ট মূল্য: ৳১,২৯০ | ডেলিভারি চার্জ: ৳৭০ | মোট পরিশোধযোগ্য: ৳১,৩৬০ |

|                                                                   |

| \[  ✓ অর্ডার কনফার্ম করুন — ৳১,৩৬০ (bg-green-700, Min Height 56px) \] |

\+-------------------------------------------------------------------+

| Footer: \[প্রাইভেসি পলিসি (/privacy)\] • \[শর্তাবলী (/terms)\] • \[রিটার্ন\] |

\+-------------------------------------------------------------------+

### 4.2 Mobile-First Merchant Admin Order Card (`/admin/orders`)

Designed for `360px` mobile screens with confirmation modals on destructive/dispatch actions and full staff attribution:

\+-------------------------------------------------------------------+

| INV-1042 • 4 mins ago                        \[Status: CONFIRMED\]  |

| গ্রাহক: তানভীর আহমেদ • 01712345678 \[Copy\]                          |

| ঠিকানা: বাসা ১২, রোড ৫, মিরপুর ১০, ঢাকা \[Edit Address / Zone\]      |

| আইটেম: Premium Panjabi (Size: XL) × 1                             |

| বিল: ৳1,360 (COD Collectible: ৳1,360) | পেমেন্ট: UNPAID            |

| রিস্ক স্কোর: 10/100 (Low Risk • Past Orders: 2 Delivered, 0 Return)|

| সর্বশেষ আপডেট: Confirmed by Moderator Rafi (2 mins ago)           |

| \----------------------------------------------------------------- |

| Primary Actions (48px Touch Targets):                             |

|  \[ 📞 Call Buyer \]   \[ 💬 WhatsApp \]   \[ 🚚 Send to Steadfast \]   |

| Secondary Menu (⋯):                                               |

|  • Edit Order / Zone  • Put On Hold  • Cancel & Restock  • Print  |

\+-------------------------------------------------------------------+

---

## 5\. Form States, Empty States & Low-End Android Ergonomics

### 5.1 Complete Form-State Matrix

1. **Pristine:** Clean slate border (`border-slate-300`), clear Bangla placeholder.  
2. **Typing & Normalization:** Automatically converts Bangla digits (`০-৯` \-\> `0-9`) and strips `+88`, spaces, and hyphens on the fly. Shows character counter (`৮/১১ ডিজিট`) without premature red errors.  
3. **Valid Format:** Shows subtle slate/green border (`✓ ১১ ডিজিট সম্পূর্ণ`). Does **not** claim phone ownership is verified.  
4. **Invalid (On Blur or Submit):** High-contrast `#B91C1C` text (`"সঠিক ১১ ডিজিটের মোবাইল নাম্বার লিখুন, যেমন: 017XXXXXXXX"`), announced via `aria-live="polite"`.  
5. **Submit-Pending (Double-Tap Guard):** Button immediately disables (`disabled={isSubmitting}`), displays spinner \+ `"অর্ডার প্রসেস হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন"`, and attaches the client `idempotencyKey`.  
6. **Out-of-Stock / Rate-Limited / Network Error:** Preserves all typed customer inputs in the form, shows a clear Bangla error banner with a **"Try Again"** button and a **1-Tap WhatsApp Order Fallback** button so the sale is never lost.

### 5.2 Operational Empty & Error States (`/admin`)

- **No Orders / No Abandoned Leads:** Displays a clean illustration with active filter reset button (`"এই ফিল্টারে কোনো অর্ডার নেই — সব অর্ডার দেখুন"`).  
- **Steadfast Timeout (`NEEDS_RECONCILIATION`):** Replaces the "Send to Steadfast" button with an amber **"⚠️ চেক কুরিয়ার স্ট্যাটাস (Reconcile)"** button so moderators never blind-retry a timed-out request.

### 5.3 Sticky Bar & Virtual Keyboard (`dvh`) Handling

- Use `100dvh` (`min-h-dvh`) and `IntersectionObserver` on `#checkout-form`: as soon as the checkout card enters the viewport (or when any `<input>` receives focus on mobile), the sticky bottom bar smoothly hides (`translate-y-full pointer-events-none`) so it never covers the submit button when the Android on-screen keyboard opens.

---

## 6\. Printable Courier Label & Invoice Spec (`/admin/invoice/[id]`)

Protected by `requireStaffRole(['ADMIN', 'MODERATOR'])`. Supports two print modes toggled via CSS `@media print`:

1. **80mm / 58mm POS Thermal Label Mode (`@page { size: 80mm auto; margin: 2mm; }`):**  
   - Pure black `#000000` text on white `#FFFFFF` (zero grayscale shading that blurs on thermal paper).  
   - Displays: Store Name & Helpline, **Steadfast Consignment ID (`CID`)** in `22px` bold monospace, `invoiceNo` (`INV-1042`), Customer Name, Full Phone Number, Full Address, Item \+ Variant (`Size: XL × 1`), and a boxed **COD Collectible Amount (`৳১,৩৬০`)**.  
2. **Standard A4 Sheet Mode:**  
   - Prints up to 4 parcel labels per A4 page (2×2 grid) for merchants using standard inkjet/laser printers.