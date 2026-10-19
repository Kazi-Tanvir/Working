// src/app/(admin)/admin/settings/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { requireStaffRole } from '@/lib/auth-guard';
import { revalidatePath } from 'next/cache';

export async function updateStoreSettings(formData: FormData) {
  await requireStaffRole(['ADMIN']);

  const storeName = (formData.get('storeName') as string)?.trim() || 'সুকুন কালেকশন (Sukoon Collection)';
  const supportPhone = (formData.get('supportPhone') as string)?.trim() || '01712345678';
  let whatsappNumber = (formData.get('whatsappNumber') as string)?.trim() || '8801712345678';
  const bkashMerchantNumber = (formData.get('bkashMerchantNumber') as string)?.trim() || null;
  const insideDhakaCharge = parseInt(formData.get('insideDhakaCharge') as string, 10) || 70;
  const subDhakaCharge = parseInt(formData.get('subDhakaCharge') as string, 10) || 100;
  const outsideDhakaCharge = parseInt(formData.get('outsideDhakaCharge') as string, 10) || 130;
  const orderCooldownMinutes = parseInt(formData.get('orderCooldownMinutes') as string, 10) || 15;

  // Clean WhatsApp number: ensure digits only
  whatsappNumber = whatsappNumber.replace(/[^\d]/g, '');
  if (whatsappNumber.startsWith('01') && whatsappNumber.length === 11) {
    whatsappNumber = `88${whatsappNumber}`;
  }

  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {
      storeName,
      supportPhone,
      whatsappNumber,
      bkashMerchantNumber,
      insideDhakaCharge,
      subDhakaCharge,
      outsideDhakaCharge,
      orderCooldownMinutes,
    },
    create: {
      id: 'default',
      storeName,
      supportPhone,
      whatsappNumber,
      bkashMerchantNumber,
      insideDhakaCharge,
      subDhakaCharge,
      outsideDhakaCharge,
      orderCooldownMinutes,
    },
  });

  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');

  return { success: true };
}
