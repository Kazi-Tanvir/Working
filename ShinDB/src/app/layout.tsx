import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Toast from "@/components/common/Toast";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "ShinDB // obsidian-style media tracker",
  description: "A premium, high-contrast cyber-neobrutalist dashboard for tracking Anime, Manga, Video Games, Movies, and TV Series.",
  keywords: ["anime tracker", "manga tracker", "backloggd tracker", "obsidian media dashboard", "cyberpunk myanimelist"],
  authors: [{ name: "NEO_DEVELOPER" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased dark">
      <body className="min-h-full flex flex-col bg-black text-white font-sans selection:bg-cyber-purple selection:text-white">
        <AuthProvider>
          {/* Navigation Shell */}
          <Navbar />

          {/* Core Content Container */}
          <main className="flex-grow flex flex-col max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-12">
            {children}
          </main>

          {/* System Logs Footer */}
          <Footer />

          {/* Global System Notifications */}
          <Toast />
        </AuthProvider>
      </body>
    </html>
  );
}
