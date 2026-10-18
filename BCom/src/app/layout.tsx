// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Hind_Siliguri, Inter } from 'next/font/google';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} ${inter.variable}`}>
      <body className="antialiased min-h-dvh flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
