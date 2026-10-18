// src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-slate-900">
      <div className="mb-6 text-center text-white">
        <h1 className="text-2xl font-bold">BD F-Commerce Admin Portal</h1>
        <p className="text-sm text-slate-400 mt-1">শুধুমাত্র অনুমোদিত স্টাফদের জন্য (Invite-Only)</p>
      </div>
      <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/admin/orders" />
    </div>
  );
}
