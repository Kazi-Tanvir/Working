import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Toast from "@/components/common/Toast";
import NetworkStatusBanner from "@/components/common/NetworkStatusBanner";
import IdlePrefetcher from "@/components/common/IdlePrefetcher";
import { AuthProvider } from "@/context/AuthContext";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

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
        <ClerkProvider
          appearance={{
            ...dark,
            variables: {
              ...dark.variables,
              colorPrimary: "#8b5cf6",
              colorBackground: "#0d0d0f",
              colorForeground: "#ffffff",
              colorMutedForeground: "#a1a1aa",
              fontFamily: "'Space Grotesk', Arial, sans-serif",
              borderRadius: "0px",
            },
            elements: {
              ...dark.elements,
              card: "border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] bg-[#0d0d0f] rounded-none",
              formButtonPrimary:
                "bg-cyber-purple hover:bg-[#7c3aed] text-white border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] font-mono uppercase tracking-wider rounded-none font-bold transition-all",
              formFieldInput:
                "border-2 border-white/40 focus:border-cyber-purple bg-black text-white rounded-none font-mono",
              footerActionLink: "text-cyber-cyan hover:text-white font-mono",
              headerTitle: "font-mono uppercase tracking-widest text-lg font-black text-white",
              headerSubtitle: "text-gray-400 font-mono text-xs",
              dividerLine: "bg-white/20",
              dividerText: "text-gray-400 font-mono text-xs uppercase",
              socialButtonsBlockButton:
                "border-2 border-white/40 hover:border-white bg-black text-white rounded-none shadow-[2px_2px_0px_0px_#ffffff] font-mono transition-all",
              socialButtonsBlockButtonText: "font-mono font-bold text-xs uppercase tracking-wider",
              userButtonPopoverCard:
                "border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] bg-[#0d0d0f] rounded-none",
              userPreviewMainIdentifier: "font-mono font-bold text-white",
              userPreviewSecondaryIdentifier: "font-mono text-xs text-gray-400",
            },
          }}
        >
          <AuthProvider>
            {/* Background Idle Route Prefetcher */}
            <IdlePrefetcher />

            {/* Top Network Status Banner for Offline Detection */}
            <NetworkStatusBanner />

            {/* Navigation Shell */}
            <Navbar />

            {/* Core Content Container with Page Transition Animation */}
            <main className="flex-grow flex flex-col max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 animate-page-in">
              {children}
            </main>

            {/* System Logs Footer */}
            <Footer />

            {/* Global System Notifications */}
            <Toast />
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
