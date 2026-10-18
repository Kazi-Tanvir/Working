// prisma/seed.ts
// Realistic Bangladeshi F-Commerce seed fixtures for testing and development

import { PrismaClient, DeliveryZone, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BD F-Commerce database...');

  // 1. StoreSettings Singleton
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'সুকুন কালেকশন (Sukoon Collection)',
      supportPhone: '01712345678',
      whatsappNumber: '8801712345678',
      insideDhakaCharge: 70,
      subDhakaCharge: 100,
      outsideDhakaCharge: 130,
      bkashMerchantNumber: '01712345678 (Personal/Merchant)',
      requireOutsideAdvance: false,
      orderCooldownMinutes: 15,
      capiPurchaseTrigger: 'ON_CONFIRM',
    },
  });

  // 2. Invoice Counter Singleton
  await prisma.invoiceCounter.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      lastNumber: 1040,
    },
  });

  // 3. Staff Users (Admin & Moderator)
  const adminUser = await prisma.user.upsert({
    where: { clerkId: 'user_admin_test_123' },
    update: {},
    create: {
      clerkId: 'user_admin_test_123',
      email: 'admin@bdshop.test',
      name: 'Tanvir Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const moderatorUser = await prisma.user.upsert({
    where: { clerkId: 'user_mod_test_456' },
    update: {},
    create: {
      clerkId: 'user_mod_test_456',
      email: 'moderator@bdshop.test',
      name: 'Rafi Moderator',
      role: 'MODERATOR',
      isActive: true,
    },
  });

  // 4. Category
  const category = await prisma.category.upsert({
    where: { slug: 'mens-panjabi' },
    update: {},
    create: {
      name: 'পাঞ্জাবি কালেকশন',
      slug: 'mens-panjabi',
      sortOrder: 1,
    },
  });

  // 5. Featured Funnel Product
  const product = await prisma.product.upsert({
    where: { slug: 'premium-egyptian-cotton-panjabi' },
    update: {},
    create: {
      name: 'প্রিমিয়াম ইজিপশিয়ান কটন পাঞ্জাবি (Royal Black)',
      slug: 'premium-egyptian-cotton-panjabi',
      description:
        '১০০% প্রিমিয়াম সুতি কাপড়ে তৈরি আরামদায়ক পাঞ্জাবি। প্রি-ওয়াশড এবং কালার গ্যারান্টি। গরমে বা উৎসবে সারাদিন পরে থাকার জন্য সেরা পছন্দ। ছবিতে যেমন দেখছেন হুবহু তেমন পাবেন।',
      images: [
        'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
      ],
      features: [
        '১০০% খাঁটি ইজিপশিয়ান কটন — ১০০% কালার ও ফেব্রিক গ্যারান্টি',
        'ছবি ও ভিডিওর সাথে শতভাগ মিল — মিল না থাকলে ডেলিভারি ম্যানের সামনেই রিটার্ন',
        'এক্সক্লুসিভ মেটাল স্ন্যাপ বাটন ও প্রিমিয়াম কলার ফিনিশিং',
        'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা',
      ],
      reviewsImages: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      ],
      bundleConfig: [
        { qty: 1, discountBdt: 0, label: '১ টি পাঞ্জাবি — ৳১,২৯০' },
        { qty: 2, discountBdt: 130, label: '২ টি কম্বো প্যাক — ৳২,৪৫০ (৳১৩০ সাশ্রয়!)' },
      ],
      offerEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Real 48h future countdown
      isFeaturedFunnel: true,
      isActive: true,
      categoryId: category.id,
      variants: {
        create: [
          {
            sku: 'EGY-BLK-M',
            label: 'Size: M (Chest 38", Length 40")',
            regularPrice: 1850,
            salePrice: 1290,
            costPrice: 850,
            stock: 25,
            sortOrder: 1,
            isActive: true,
          },
          {
            sku: 'EGY-BLK-L',
            label: 'Size: L (Chest 40", Length 42")',
            regularPrice: 1850,
            salePrice: 1290,
            costPrice: 850,
            stock: 30,
            sortOrder: 2,
            isActive: true,
          },
          {
            sku: 'EGY-BLK-XL',
            label: 'Size: XL (Chest 42", Length 44")',
            regularPrice: 1850,
            salePrice: 1290,
            costPrice: 850,
            stock: 7,
            sortOrder: 3,
            isActive: true,
          },
          {
            sku: 'EGY-BLK-XXL',
            label: 'Size: XXL (Chest 44", Length 46")',
            regularPrice: 1850,
            salePrice: 1290,
            costPrice: 850,
            stock: 0,
            sortOrder: 4,
            isActive: true,
          },
        ],
      },
    },
  });

  // 6. Test Orders for Admin Dashboard
  const order1 = await prisma.order.upsert({
    where: { invoiceNo: 'INV-1041' },
    update: {},
    create: {
      invoiceNo: 'INV-1041',
      publicToken: 'cuid_test_order_token_1041',
      idempotencyKey: 'idem_test_key_1041',
      customerName: 'তানভীর আহমেদ',
      customerPhone: '01712345678',
      customerAddress: 'বাসা ১২, রোড ৫, মিরপুর ১০, ঢাকা',
      deliveryZone: DeliveryZone.INSIDE_DHAKA,
      deliveryCharge: 70,
      subTotal: 1290,
      discountAmount: 0,
      totalAmount: 1360,
      advancePaid: 0,
      codCollectible: 1360,
      paymentMethod: PaymentMethod.COD,
      status: 'CONFIRMED',
      riskScore: 10,
      processedById: moderatorUser.id,
      items: {
        create: {
          productId: product.id,
          variantId: 'temp_var_id', // Replaced or connected if using relations
          productName: 'প্রিমিয়াম ইজিপশিয়ান কটন পাঞ্জাবি (Royal Black)',
          variantLabel: 'Size: XL (Chest 42", Length 44")',
          skuSnapshot: 'EGY-BLK-XL',
          quantity: 1,
          unitPrice: 1290,
          unitCost: 850,
          totalPrice: 1290,
        },
      },
      statusHistory: {
        create: {
          toStatus: 'CONFIRMED',
          action: 'MODERATOR_CONFIRM_PHONE',
          note: 'Customer confirmed via phone call (Mirpur delivery)',
          actorId: moderatorUser.id,
        },
      },
    },
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
