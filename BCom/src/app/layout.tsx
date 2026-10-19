// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Hind_Siliguri, Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const hindSiliguri = Hind_Siliguri({
  weight: ['400', '600', '700'],
  subsets: ['bengali', 'latin'],
  display: 'swap',
  variable: '--font-hind',
});

const inter = Inter({
  weight: ['500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#15803D',
};

export const metadata: Metadata = {
  title: 'সুকুন কালেকশন | প্রিমিয়াম ফ্যাশন ও লাইফস্টাইল',
  description: 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা ও ১০০% প্রিমিয়াম সুতি কাপড়ের নিশ্চয়তা।',
};

const clerkAppearance = {
  variables: {
    colorPrimary: '#15803D', // Emerald Green 700 (WCAG AA 5.1:1)
    colorText: '#0F172A', // Slate 900
    colorTextSecondary: '#475569', // Slate 600
    colorBackground: '#FFFFFF',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#0F172A',
    colorDanger: '#B91C1C', // Red 700
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-hind), var(--font-inter), system-ui, sans-serif',
  },
  elements: {
    card: 'shadow-2xl border border-slate-200/80 rounded-2xl bg-white',
    headerTitle: 'text-slate-900 font-bold text-xl tracking-tight',
    headerSubtitle: 'text-slate-600 text-sm font-normal',
    formButtonPrimary:
      'bg-green-700 hover:bg-green-800 text-white font-semibold text-sm shadow-sm transition-all duration-200 py-2.5 rounded-xl border-0 ring-offset-2 focus:ring-2 focus:ring-green-700',
    formFieldInput:
      'rounded-xl border border-slate-300 focus:border-green-700 focus:ring-2 focus:ring-green-700/20 text-slate-900 text-base transition-colors duration-150',
    formFieldLabel: 'text-slate-700 text-sm font-medium',
    footerActionLink: 'text-green-700 hover:text-green-800 hover:underline font-semibold transition-colors',
    socialButtonsBlockButton:
      'border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-medium rounded-xl transition-all',
    identityPreviewText: 'text-slate-800 font-medium',
    dividerLine: 'bg-slate-200',
    dividerText: 'text-slate-400 text-xs uppercase font-medium',
    alertText: 'text-sm font-medium',
    userButtonAvatarBox: 'w-8 h-8 rounded-full ring-2 ring-green-600/30',
    userButtonPopoverCard: 'shadow-2xl border border-slate-200 rounded-2xl p-1',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="bn" className={`${hindSiliguri.variable} ${inter.variable}`}>
        <body className="antialiased min-h-dvh flex flex-col bg-slate-50 text-slate-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
