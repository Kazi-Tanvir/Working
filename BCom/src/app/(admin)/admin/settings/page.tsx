import { prisma } from '@/lib/prisma';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">স্টোর সেটিংস ও কনফিগারেশন</h1>
        <p className="text-sm text-slate-500">
          ডেলিভারি চার্জ, কাস্টমার হেল্পলাইন এবং হোয়াটসঅ্যাপ নাম্বার সরাসরি আপডেট করুন।
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
