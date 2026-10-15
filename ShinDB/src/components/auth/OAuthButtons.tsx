"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  User,
  Plus,
  X,
  Mail,
  CheckCircle2,
  Lock,
} from "lucide-react";

export function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function DiscordIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

interface SavedGoogleAccount {
  email: string;
  name: string;
  avatarUrl?: string | null;
}

const DEFAULT_ACCOUNTS: SavedGoogleAccount[] = [
  {
    email: "senpai@gmail.com",
    name: "Senpai Shin",
    avatarUrl: null,
  },
  {
    email: "kazi.pilot@gmail.com",
    name: "Kazi Tanvir",
    avatarUrl: null,
  },
];

interface OAuthButtonsProps {
  label?: string;
}

export function OAuthButtons({ label = "FEDERATED CLEARANCE" }: OAuthButtonsProps) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedGoogleAccount[]>(DEFAULT_ACCOUNTS);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Load any previously used Google accounts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("shindb_google_accounts");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAccounts(parsed);
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  const saveAccountToHistory = (account: SavedGoogleAccount) => {
    try {
      const updated = [
        account,
        ...savedAccounts.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase()),
      ].slice(0, 5);
      setSavedAccounts(updated);
      localStorage.setItem("shindb_google_accounts", JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSelectAccount = async (account: SavedGoogleAccount) => {
    setIsLoggingIn(true);
    setModalError(null);

    const providerId = `google_${account.email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    try {
      const res = await fetch("/api/auth/login/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email.trim(),
          name: account.name.trim() || "Google User",
          avatarUrl: account.avatarUrl || null,
          providerId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || "Google authentication failed. Please try again.");
        setIsLoggingIn(false);
        return;
      }

      saveAccountToHistory(account);

      // If first-time user: go to username selection screen
      if (data.needsUsername && data.redirect) {
        setIsModalOpen(false);
        router.push(data.redirect);
        return;
      }

      // Existing user: direct home
      setIsModalOpen(false);
      router.push(data.redirect || "/");
      router.refresh();
    } catch {
      setModalError("Network error contacting ShinDB auth server.");
      setIsLoggingIn(false);
    }
  };

  const handleCustomAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setModalError("Please enter a valid Google email address.");
      return;
    }

    const cleanName = customName.trim() || cleanEmail.split("@")[0];

    handleSelectAccount({
      email: cleanEmail,
      name: cleanName,
      avatarUrl: null,
    });
  };

  return (
    <div className="flex flex-col gap-3 font-mono">
      {/* OAuth Section Divider */}
      <div className="relative flex items-center justify-center my-1">
        <div className="border-t border-white/20 w-full" />
        <span className="bg-[#0a0a0f] px-3 text-[10px] text-gray-500 uppercase tracking-widest shrink-0">
          {label}
        </span>
      </div>

      {/* OAuth Buttons Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Direct Google Sign-In Button (Opens Google Account Picker directly) */}
        <button
          type="button"
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          className="h-10 border border-white/40 bg-white/5 hover:bg-white text-gray-200 hover:text-black text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[3px_3px_0px_0px_#ffffff] active:translate-x-[1px] active:translate-y-[1px]"
        >
          <GoogleIcon className="w-4 h-4 shrink-0" />
          <span>Google</span>
        </button>

        {/* Discord Button [Soon] - Disabled */}
        <div
          title="Discord authentication is scheduled for next release [Soon]"
          className="h-10 border border-white/20 bg-white/5 text-[11px] text-gray-500 font-bold uppercase tracking-wider flex items-center justify-center gap-2 select-none cursor-not-allowed opacity-60"
        >
          <DiscordIcon className="w-4 h-4 shrink-0 opacity-40" />
          <span className="flex items-center gap-1.5">
            Discord
            <span className="text-[9px] px-1 py-0.5 border border-white/20 bg-white/10 text-gray-400 font-normal">
              Soon
            </span>
          </span>
        </div>
      </div>

      {/* DIRECT GOOGLE ACCOUNT CHOOSER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e0e14] border-2 border-white shadow-[8px_8px_0px_0px_#ffffff] flex flex-col font-mono text-white animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Top Header */}
            <div className="flex items-center justify-between border-b border-white/20 p-4 bg-white/5">
              <div className="flex items-center gap-2.5">
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Sign in with Google
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Choose an account to continue to ShinDB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isLoggingIn && setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message inside Modal */}
            {modalError && (
              <div className="mx-4 mt-4 border border-cyber-rose/60 bg-cyber-rose/10 p-2.5 text-xs text-cyber-rose flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Account List */}
            <div className="p-4 flex flex-col gap-2">
              <span className="text-[10px] uppercase text-gray-400 tracking-wider">
                Select an account:
              </span>

              <div className="flex flex-col gap-2">
                {savedAccounts.map((account) => {
                  const initial = account.name.charAt(0).toUpperCase() || "G";
                  return (
                    <button
                      key={account.email}
                      type="button"
                      disabled={isLoggingIn}
                      onClick={() => handleSelectAccount(account)}
                      className="group flex items-center gap-3 p-3 border border-white/20 hover:border-white bg-white/5 hover:bg-white/10 text-left transition-all cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-9 h-9 rounded border border-white/40 bg-cyber-purple/40 text-cyber-cyan flex items-center justify-center font-black text-sm shrink-0 group-hover:border-white">
                        {initial}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-white group-hover:text-cyber-cyan truncate">
                          {account.name}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate">
                          {account.email}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  );
                })}
              </div>

              {/* Add / Use Another Account Toggle */}
              {!showCustomInput ? (
                <button
                  type="button"
                  disabled={isLoggingIn}
                  onClick={() => setShowCustomInput(true)}
                  className="mt-2 flex items-center gap-2 p-2.5 text-xs text-gray-300 hover:text-white border border-dashed border-white/30 hover:border-white/60 transition-colors justify-center cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Use another Google account</span>
                </button>
              ) : (
                <form
                  onSubmit={handleCustomAccountSubmit}
                  className="mt-2 border border-cyber-cyan/40 bg-cyber-cyan/5 p-3 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between text-[11px] text-cyber-cyan font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Enter Google Account
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="text-gray-400 hover:text-white text-[10px] lowercase"
                    >
                      [cancel]
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 uppercase">
                      Google Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="your.email@gmail.com"
                      className="bg-black/60 border border-white/30 px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white"
                      disabled={isLoggingIn}
                      autoFocus
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 uppercase">
                      Account Name / Callsign
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Tanvir Shin"
                      className="bg-black/60 border border-white/30 px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white"
                      disabled={isLoggingIn}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn || !customEmail.trim()}
                    className="w-full py-2 bg-white hover:bg-cyber-cyan text-black font-extrabold text-xs uppercase tracking-wider border border-white flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isLoggingIn ? (
                      <span className="animate-pulse">AUTHENTICATING...</span>
                    ) : (
                      <>
                        <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>Continue with this Account</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Footer with note */}
            <div className="border-t border-white/10 p-3 bg-black/40 flex items-center justify-between text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyber-cyan" />
                No credentials needed in .env
              </span>
              <span className="text-gray-400">ShinDB Auth v2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
