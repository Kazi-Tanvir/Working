// src/lib/constants.ts
// Single source of truth for zones, roles, statuses, and delivery rates

export const DELIVERY_ZONES = {
  INSIDE_DHAKA: {
    label: 'ঢাকার ভিতরে (Inside Dhaka City)',
    defaultCharge: 70,
  },
  SUB_DHAKA: {
    label: 'ঢাকা সাব-এরিয়া (সাভার, আশুলিয়া, গাজীপুর, কেরানীগঞ্জ, নারায়ণগঞ্জ)',
    defaultCharge: 100,
  },
  OUTSIDE_DHAKA: {
    label: 'ঢাকার বাইরে (Outside Dhaka - ৬৩ জেলা)',
    defaultCharge: 130,
  },
} as const;

export type DeliveryZoneKey = keyof typeof DELIVERY_ZONES;

export const PAYMENT_METHODS = {
  COD: {
    label: 'ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে পেমেন্ট)',
    description: 'ডেলিভারি ম্যানের কাছে পণ্য দেখে সম্পূর্ণ মূল্য পরিশোধ করুন।',
  },
  BKASH_MANUAL: {
    label: 'বিকাশ মার্চেন্ট / সেন্ড মানি (অগ্রিম পেমেন্ট)',
    description: 'বিকাশ করে ট্রানজেকশন আইডি (TrxID) দিন।',
  },
  NAGAD_MANUAL: {
    label: 'নগদ মার্চেন্ট / সেন্ড মানি (অগ্রিম পেমেন্ট)',
    description: 'নগদ পেমেন্ট করে ট্রানজেকশন আইডি (TrxID) দিন।',
  },
} as const;

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'নতুন অর্ডার', color: 'bg-amber-100 text-amber-800' },
  ON_HOLD: { label: 'হোল্ডে আছে', color: 'bg-yellow-100 text-yellow-800' },
  NO_ANSWER: { label: 'রিসিভ করেননি', color: 'bg-orange-100 text-orange-800' },
  AWAITING_ADVANCE: { label: 'অগ্রিম অপেক্ষা', color: 'bg-purple-100 text-purple-800' },
  CONFIRMED: { label: 'কনফার্মড', color: 'bg-blue-100 text-blue-800' },
  PACKED: { label: 'প্যাক করা হয়েছে', color: 'bg-indigo-100 text-indigo-800' },
  SHIPPED: { label: 'কুরিয়ারে দেওয়া হয়েছে', color: 'bg-sky-100 text-sky-800' },
  DELIVERED: { label: 'ডেলিভারড', color: 'bg-green-100 text-green-800' },
  PARTIAL_DELIVERED: { label: 'আংশিক ডেলিভারি', color: 'bg-teal-100 text-teal-800' },
  CANCELLED: { label: 'বাতিল', color: 'bg-red-100 text-red-800' },
  RETURNED: { label: 'রিটার্নড', color: 'bg-rose-100 text-rose-800' },
};

export const DISPATCH_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NOT_SENT: { label: 'পাঠানো হয়নি', color: 'bg-slate-100 text-slate-800' },
  DISPATCHING: { label: 'বুকিং হচ্ছে...', color: 'bg-blue-100 text-blue-800' },
  BOOKED: { label: 'বুকড', color: 'bg-sky-100 text-sky-800' },
  IN_TRANSIT: { label: 'পথে আছে', color: 'bg-indigo-100 text-indigo-800' },
  DELIVERED: { label: 'ডেলিভারড', color: 'bg-green-100 text-green-800' },
  RETURNED: { label: 'রিটার্নড', color: 'bg-red-100 text-red-800' },
  FAILED: { label: 'ব্যর্থ হয়েছে', color: 'bg-red-100 text-red-800' },
  NEEDS_RECONCILIATION: { label: 'চেক প্রয়োজন (Timeout)', color: 'bg-amber-100 text-amber-800' },
};

export const LEAD_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'ওপেন লিড', color: 'bg-amber-100 text-amber-800' },
  CONVERTED: { label: 'কনভার্টেড (অর্ডার হয়েছে)', color: 'bg-green-100 text-green-800' },
  DISMISSED: { label: 'ডিসমিসড', color: 'bg-slate-100 text-slate-800' },
  EXPIRED: { label: 'মেয়াদোত্তীর্ণ', color: 'bg-gray-100 text-gray-800' },
};
