// src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
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
            <span>স্টাফ রেজিস্ট্রেশন</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            নতুন স্টাফ অ্যাকাউন্ট
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            এডমিনের ইনভাইটেশন লিংক অথবা অনুমোদিত ইমেইল দিয়ে সাইন আপ সম্পন্ন করুন
          </p>
        </div>

        {/* Clerk Sign-Up Component */}
        <div className="w-full flex justify-center">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/admin/orders"
          />
        </div>

        {/* Footer Navigation & Security Info */}
        <div className="mt-8 text-center space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/sign-in"
              className="text-slate-400 hover:text-green-400 transition-colors inline-flex items-center gap-1"
            >
              ← ইতিমধ্যে অ্যাকাউন্ট আছে? সাইন ইন করুন
            </Link>
          </div>
          <p>অনুমতি ছাড়া একাউন্ট তৈরি করলে সিস্টেম স্বয়ংক্রিয়ভাবে অ্যাক্সেস ডিনাই করবে</p>
        </div>
      </div>
    </main>
  );
}
