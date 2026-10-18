\======================================================================  
 BD F-COMMERCE ENGINE (v2.0) — THINGS YOU MUST ADD & CONFIGURE YOURSELF  
\======================================================================

While the 5 updated specification files (prd, schema, appflow, design,  
and implementation-plan) give you the complete architecture, database  
schema, and core business logic, an AI or specification cannot supply  
your live credentials, merchant legal details, real product assets, or  
external dashboard configurations.

Below is the exact checklist of everything YOU must set up, decide, or  
add by yourself when building and deploying this project for yourself  
or your first Bangladeshi client.

\----------------------------------------------------------------------  
1\. CLERK DASHBOARD CONFIGURATION (CRITICAL — DO THIS FIRST)  
\----------------------------------------------------------------------  
Because customer checkout is 100% guest-based, Clerk is only for you  
(ADMIN) and the client's page moderators (MODERATOR). By default, Clerk  
allows anyone on the internet to sign up, which would be a security hole.

You must manually log into your Clerk Dashboard and:  
\[ \] 1.1 Disable Public Sign-Up (Enable "Invite-Only"):  
        Go to: User & Authentication \-\> Restrictions \-\> Enable  
        "Allowlist / Invite-only" and disable public sign-ups so random  
        visitors cannot create accounts.  
\[ \] 1.2 Customize the Session Token (Required for RBAC Middleware):  
        Go to: Sessions \-\> Customize session token \-\> Claims editor,  
        and add this exact JSON:  
        {  
          "metadata": "{{user.public\_metadata}}"  
        }  
        (If you skip this step, \`sessionClaims.metadata.role\` will  
        always be \`undefined\` and middleware will block you with 403\!)  
\[ \] 1.3 Assign Your Own ADMIN Role:  
        Go to: Users \-\> Click your user \-\> Scroll to "Public metadata"  
        \-\> Set:  
        {  
          "role": "ADMIN"  
        }  
        Also insert/sync your user row in the MySQL \`User\` table with  
        \`role \= 'ADMIN'\` and \`isActive \= true\`.  
\[ \] 1.4 Configure Clerk Webhook (Optional if seeding staff manually):  
        Set up a webhook endpoint pointing to \`/api/webhooks/clerk\`  
        and copy the Signing Secret (\`whsec\_...\`) into \`.env\`.

\----------------------------------------------------------------------  
2\. THIRD-PARTY API KEYS & SECRETS TO ADD IN \`.env\`  
\----------------------------------------------------------------------  
For security, v2.0 removed plaintext API keys from the database. You  
must obtain and paste these into your local \`.env\` and Vercel  
Environment Variables:

\[ \] 2.1 MySQL Pooled Connection String (\`DATABASE\_URL\`):  
        \- Create a MySQL 8.0+ database on TiDB Cloud Serverless,  
          Railway, or Aiven (choose Singapore \`ap-southeast-1\` or  
          Mumbai \`ap-south-1\` for lowest latency to Bangladesh).  
        \- Append \`\&connection\_limit=10\` to prevent serverless connection  
          exhaustion.  
\[ \] 2.2 Steadfast Courier (Packzy) Merchant Credentials:  
        \- Log into the client's Steadfast merchant portal \-\> API Settings.  
        \- Copy \`Api-Key\` \-\> \`STEADFAST\_API\_KEY\`  
        \- Copy \`Secret-Key\` \-\> \`STEADFAST\_SECRET\_KEY\`  
        \- Verify the exact base URL and webhook format in their official  
          portal documentation before going live.  
\[ \] 2.3 Meta Pixel ID & Conversions API (CAPI) Access Token:  
        \- Open Meta Events Manager \-\> Data Sources \-\> Your Pixel.  
        \- Copy Pixel ID \-\> \`NEXT\_PUBLIC\_META\_PIXEL\_ID\`  
        \- Go to Settings \-\> Conversions API \-\> "Generate access token"  
          \-\> \`META\_CAPI\_ACCESS\_TOKEN\`.  
        \- During testing, also copy the \`TEST\_EVENT\_CODE\` (e.g.  
          \`TEST12345\`) from Meta Events Manager "Test Events" tab to  
          verify that browser and server events deduplicate properly.  
\[ \] 2.4 Image Hosting Token (\`UPLOADTHING\_TOKEN\` or Cloudinary):  
        \- Since Vercel has no persistent local disk for uploaded product  
          photos, create a free account on UploadThing or Cloudinary  
          and add the API key to \`.env\`.  
\[ \] 2.5 Rate Limiting (\`UPSTASH\_REDIS\_REST\_URL\` & \`TOKEN\`):  
        \- Create a free serverless Redis instance on Upstash  
          (Singapore region) to rate-limit \`/api/orders\` and  
          \`/api/orders/incomplete\` against bot spam.

\----------------------------------------------------------------------  
3\. REAL STORE ASSETS & BUSINESS CONTENT YOU MUST ADD YOURSELF  
\----------------------------------------------------------------------  
Critics and real Bangladeshi shoppers immediately spot fake placeholder  
stores. Before pitching clients or running real ads, add:

\[ \] 3.1 Authentic Product Photos & Variant Stock (\`ProductVariant\`):  
        \- Replace placeholder images with real 1:1 square WebP/AVIF  
          photos of your demo products (e.g., Panjabi, Hijab combo,  
          Sundarban Honey, TWS Earbuds).  
        \- Enter realistic stock counts per size (M, L, XL, XXL) and  
          wholesale \`costPrice\` so profit tracking works.  
\[ \] 3.2 Consented / Privacy-Safe Customer Reviews:  
        \- Never upload unredacted private Messenger screenshots showing  
          a real stranger's phone number or full name. Blur personal  
          identifiers or use consented customer review cards.  
\[ \] 3.3 Legal & Policy Pages (\`/privacy\`, \`/terms\`, \`/return-policy\`):  
        \- Fill in the store's real business name, physical address in  
          Bangladesh, phone helpline, WhatsApp number, and clear return  
          rules (e.g., "Check product in front of the delivery rider;  
          if returning on the spot, only delivery charge applies").  
        \- Ensure \`/privacy\` explicitly mentions that phone numbers typed  
          during checkout may be contacted once via phone/WhatsApp for  
          order completion assistance and are deleted after 30 days.  
\[ \] 3.4 Manual bKash Merchant / Personal Number:  
        \- In \`/admin/settings\`, set the real bKash number displayed when  
          a customer chooses advance delivery payment, and train the  
          moderator to verify the \`TrxID\` against the bKash SMS/App  
          before clicking "Verify Payment" in \`/admin/orders\`.

\----------------------------------------------------------------------  
4\. CODE & FRAMEWORK VERIFICATIONS YOU MUST DO WHEN SCAFFOLDING  
\----------------------------------------------------------------------  
\[ \] 4.1 Next.js Version Check (\`middleware.ts\` vs \`proxy.ts\`):  
        \- If you install Next.js 15 (\`npx create-next-app@15\`), keep the  
          file named \`src/middleware.ts\`.  
        \- If you install Next.js 16+, verify Next.js's \`src/proxy.ts\`  
          file convention in the official Next.js docs.  
\[ \] 4.2 Prisma Version Check:  
        \- Pin \`prisma\` and \`@prisma/client\` to \`^6.x\` (or verify the  
          generator syntax if using Prisma 7).  
\[ \] 4.3 Vercel Commercial Usage & Region Settings:  
        \- Set your Vercel Function Region (\`iad1\` default \-\> change to  
          \`sin1\` Singapore or \`bom1\` Mumbai in Project Settings \-\>  
          Functions) so database queries don't travel across the globe.  
        \- Remember that live commercial client stores require a Vercel  
          Pro plan (or self-hosted VPS/Coolify/Railway deployment) per  
          Vercel's terms of service.

\----------------------------------------------------------------------  
5\. MANUAL DEVICE & PRINTER TESTING CHECKLIST (BEFORE LAUNCH)  
\----------------------------------------------------------------------  
Do not rely only on your laptop's Chrome browser. Test these yourself:  
\[ \] 5.1 Facebook / Messenger In-App Browser Test:  
        \- Send your \`/offer/\[slug\]\` link to yourself on Facebook  
          Messenger on an Android phone and tap it.  
        \- Verify that tapping the Name/Phone input does NOT zoom in the  
          screen, and that the sticky bottom bar hides when the keyboard  
          opens.  
\[ \] 5.2 Bangla Numeral Phone Input Test:  
        \- Switch your phone keyboard to Bangla (Ridmik/Gboard) and type  
          \`০১৭১২৩৪৫৬৭৮\`, or paste \`+880 1712-345678\`. Verify it  
          converts cleanly to \`01712345678\` and saves the incomplete  
          lead.  
\[ \] 5.3 Double-Tap / Airplane Mode Test:  
        \- Rapidly double-tap the "অর্ডার কনফার্ম করুন" button on throttled  
          3G/4G. Verify only ONE order is created in \`/admin/orders\`.  
\[ \] 5.4 Invoice Print Preview (\`Ctrl \+ P\`):  
        \- Open \`/admin/invoice/\[id\]\` and test both A4 and 80mm thermal  
          print previews to ensure the Steadfast Consignment ID (\`CID\`)  
          and COD Collectible amount are crisp and readable.  
\======================================================================  
