// src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Decorative Ambient Radial Gradient */}
      <div 
        aria-hidden="true" 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-green-700/15 rounded-full blur-3xl pointer-events-none" 
      />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-950/80 border border-green-700/30 text-green-400 text-xs font-semibold mb-3">
            <span>🛡️ সুকুন কালেকশন</span>
            <span>•</span>
            <span>স্টাফ অথেন্টিকেশন</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            মার্চেন্ট অ্যাডমিন পোর্টাল
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            শুধুমাত্র অনুমোদিত অ্যাডমিন ও মডারেটরদের জন্য সংরক্ষিত (Invite-Only Access)
          </p>
        </div>

        {/* Clerk Sign-In Component */}
        <div className="w-full flex justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/admin/orders"
          />
        </div>

        {/* Footer Navigation & Security Info */}
        <div className="mt-8 text-center space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/offer/premium-egyptian-cotton-panjabi"
              className="text-slate-400 hover:text-green-400 transition-colors inline-flex items-center gap-1"
            >
              ← লাইভ শপে ফিরে যান
            </Link>
            <span>•</span>
            <Link
              href="/sign-up"
              className="text-slate-400 hover:text-green-400 transition-colors"
            >
              নতুন ইনভাইটেশন সাইন আপ
            </Link>
          </div>
          <p>সুরক্ষিত ২FA ও রোল-বেসড এক্সেস কন্ট্রোল (RBAC) দ্বারা সুরক্ষিত</p>
        </div>
      </div>
    </main>
  );
}
