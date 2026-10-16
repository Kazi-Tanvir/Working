"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Terminal,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

interface GoogleProfileData {
  email: string;
  name: string;
  avatarUrl: string | null;
  suggestedUsername: string;
}

function ChooseUsernameContent() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [googleProfile, setGoogleProfile] = useState<GoogleProfileData | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchOnboardingSession() {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/login/google/onboarding");
        const json = await res.json();

        if (!res.ok || !json.success) {
          setSessionError(
            json.error || "No active Google onboarding session found. Please sign in again."
          );
          return;
        }

        setGoogleProfile(json.data);
        setUsername(json.data.suggestedUsername || "");
        setDisplayName(json.data.name || "");
      } catch {
        setSessionError("Failed to verify Google onboarding session. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchOnboardingSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) {
      setFormError("Username is required.");
      return;
    }

    if (cleanUsername.length < 3) {
      setFormError("Username must be at least 3 characters.");
      return;
    }

    if (cleanUsername.length > 30) {
      setFormError("Username cannot exceed 30 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setFormError("Username can only contain alphanumeric characters and underscores.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login/google/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          displayName: displayName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to set username. Please try another.");
        setIsSubmitting(false);
        return;
      }

      // Success! Update auth state and redirect
      await refreshUser();
      router.push("/");
      router.refresh();
    } catch {
      setFormError("Network error completing registration. Please retry.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto my-auto flex flex-col gap-6 font-mono">
        <div className="bg-[#0a0a0f] border-2 border-white p-8 shadow-[6px_6px_0px_0px_#ffffff] text-center flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
          <div className="text-xs uppercase tracking-widest text-cyber-cyan animate-pulse">
            [SYS_AUTH] VERIFYING GOOGLE ENROLLMENT TOKEN...
          </div>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="w-full max-w-md mx-auto my-auto flex flex-col gap-6 font-mono">
        <div className="bg-[#0a0a0f] border-2 border-cyber-rose p-6 shadow-[6px_6px_0px_0px_#ff0055] flex flex-col gap-4">
          <div className="flex items-center gap-2 text-cyber-rose">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <h2 className="text-sm font-black uppercase tracking-wider">
              ENROLLMENT SESSION EXPIRED
            </h2>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{sessionError}</p>
          <div className="pt-2 border-t border-white/10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-cyber-purple hover:bg-white hover:text-black px-4 py-2 border border-white transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>RETURN TO LOGIN</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto my-auto flex flex-col gap-6 font-mono">
      {/* Top Cyber System Header */}
      <div className="flex items-center justify-between border-b border-white/20 pb-2 text-[11px] text-gray-500 uppercase tracking-widest">
        <span className="flex items-center gap-1.5 text-cyber-cyan">
          <span className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse" />
          SYS_SEC_V2 // GOOGLE_ONBOARDING
        </span>
        <span className="text-gray-400">NODE: ALPHA_01</span>
      </div>

      {/* Main Terminal Frame */}
      <div className="bg-[#0a0a0f] border-2 border-white p-6 md:p-8 shadow-[6px_6px_0px_0px_#ffffff] flex flex-col gap-6">
        {/* Terminal Title */}
        <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-cyber-cyan p-1 border border-white">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <h1 className="text-lg font-black tracking-wider text-white uppercase">
              CHOOSE YOUR USERNAME
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            FIRST-TIME SIGN IN DETECTED. CLAIM YOUR UNIQUE USERNAME.
          </p>
        </div>

        {/* Google Verified Account Badge */}
        {googleProfile && (
          <div className="border border-cyber-cyan/40 bg-cyber-cyan/10 p-3.5 flex items-center gap-3">
            {googleProfile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={googleProfile.avatarUrl}
                alt="Google avatar"
                className="w-10 h-10 rounded border border-white shrink-0 object-cover"
              />
            ) : (
              <div className="w-10 h-10 border border-white bg-cyber-purple flex items-center justify-center font-black text-sm text-white shrink-0">
                {googleProfile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] text-cyber-cyan font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>GOOGLE ACCOUNT VERIFIED</span>
              </div>
              <div className="text-xs text-white font-bold truncate">{googleProfile.name}</div>
              <div className="text-[11px] text-gray-400 truncate">{googleProfile.email}</div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {formError && (
          <div className="border border-cyber-rose/60 bg-cyber-rose/10 p-3 text-xs text-cyber-rose flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Username Selection Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>[01] USERNAME</span>
              <span className="text-[10px] text-cyber-cyan">UNIQUE HANDLE</span>
            </label>
            <div className="flex items-center border border-white/30 bg-black/60 focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all">
              <div className="px-3 text-cyber-cyan font-bold border-r border-white/20 select-none">
                @
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="shin_pilot"
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                autoComplete="off"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <span className="text-[10px] text-gray-500 uppercase">
              3-30 CHARACTERS (LETTERS, NUMBERS, UNDERSCORES ONLY)
            </span>
          </div>

          {/* Display Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>[02] CALLSIGN / DISPLAY NAME</span>
              <span className="text-[10px] text-gray-500">OPTIONAL</span>
            </label>
            <div className="flex items-center border border-white/30 bg-black/60 focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all">
              <div className="px-3 text-gray-500 border-r border-white/20">
                <Check className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Major Motoko"
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || !username.trim()}
            className="mt-3 w-full h-11 bg-white hover:bg-cyber-cyan text-black font-extrabold text-xs uppercase tracking-widest border border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.4)] hover:shadow-[4px_4px_0px_0px_#ffffff] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">CONFIRMING CLEARANCE...</span>
            ) : (
              <>
                <span>CONFIRM USERNAME &amp; ENTER ARCHIVE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Cancel / Switch Account */}
        <div className="border-t border-white/10 pt-4 text-center">
          <Link
            href="/login"
            className="text-xs text-gray-400 hover:text-cyber-rose transition-colors uppercase tracking-wider"
          >
            WRONG GOOGLE ACCOUNT? <span className="underline font-bold text-white">CANCEL &amp; SWITCH -&gt;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ChooseUsernamePage() {
  return (
    <Suspense
      fallback={
        <div className="font-mono text-center text-xs text-gray-500 py-12">
          SETTING UP YOUR PROFILE...
        </div>
      }
    >
      <ChooseUsernameContent />
    </Suspense>
  );
}
