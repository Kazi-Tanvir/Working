"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Terminal, Lock, User, Mail, AlertCircle, ArrowRight, Check } from "lucide-react";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "EMPTY", color: "bg-gray-700" };
    if (pass.length < 6) return { score: 1, label: "INSUFFICIENT (MIN 6 CHARS)", color: "bg-cyber-rose" };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);
    if (pass.length >= 10 && hasNum && hasSpecial) {
      return { score: 3, label: "MAXIMUM CYBER CLEARANCE", color: "bg-cyber-lime" };
    }
    if (pass.length >= 8 && (hasNum || hasSpecial)) {
      return { score: 2, label: "STANDARD OPERATIONAL", color: "bg-cyber-cyan" };
    }
    return { score: 1, label: "BASIC ACCEPTABLE", color: "bg-cyber-amber" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !email.trim() || !password) {
      setError("Username, email, and passcode are required.");
      return;
    }

    if (password.length < 6) {
      setError("Passcode must contain at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      username: username.trim(),
      email: email.trim(),
      displayName: displayName.trim() || undefined,
      password,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Enrollment failed. Please check your data.");
    } else {
      router.push(redirect);
    }
  };



  return (
    <div className="w-full max-w-md mx-auto my-auto flex flex-col gap-6 font-mono">
      {/* Top Cyber System Header */}
      <div className="flex items-center justify-between border-b border-white/20 pb-2 text-[11px] text-gray-500 uppercase tracking-widest">
        <span className="flex items-center gap-1.5 text-cyber-purple">
          <span className="w-2 h-2 bg-cyber-purple rounded-full animate-pulse" />
          ENROLLMENT_PROTOCOL // REGISTRY
        </span>
        <span className="text-gray-400">CLEARANCE: INIT</span>
      </div>

      {/* Main Terminal Frame */}
      <div className="bg-[#0a0a0f] border-2 border-white p-6 md:p-8 shadow-[6px_6px_0px_0px_#ffffff] flex flex-col gap-6">
        {/* Terminal Title */}
        <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-cyber-lime p-1 border border-white">
              <Terminal className="w-4 h-4 text-black" />
            </div>
            <h1 className="text-lg font-black tracking-wider text-white uppercase">
              [ShinDB // ENROLL_OPERATOR]
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ESTABLISH NEW SECURE IDENTITY ON NODE 01.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="border border-cyber-rose/60 bg-cyber-rose/10 p-3 text-xs text-cyber-rose flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Enrollment Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>[01] OPERATOR USERNAME</span>
              <span className="text-[10px] text-gray-500">3-30 CHARS</span>
            </label>
            <div className="flex items-center border border-white/30 bg-black/60 focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all">
              <div className="px-3 text-gray-500 border-r border-white/20">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. unit_01"
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>[02] COMMS EMAIL</span>
              <span className="text-[10px] text-gray-500">PRIMARY</span>
            </label>
            <div className="flex items-center border border-white/30 bg-black/60 focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all">
              <div className="px-3 text-gray-500 border-r border-white/20">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pilot@domain.com"
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>[03] CALLSIGN / DISPLAY NAME</span>
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

          {/* Passcode */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>[04] ACCESS PASSCODE</span>
              <span className="text-[10px] text-gray-500">MIN 6 CHARS</span>
            </label>
            <div className="flex items-center border border-white/30 bg-black/60 focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all">
              <div className="px-3 text-gray-500 border-r border-white/20">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            </div>

            {/* Strength Meter Bar */}
            {password && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex gap-1 h-1 w-full bg-white/10">
                  <div className={`h-full flex-1 ${strength.score >= 1 ? strength.color : "bg-transparent"}`} />
                  <div className={`h-full flex-1 ${strength.score >= 2 ? strength.color : "bg-transparent"}`} />
                  <div className={`h-full flex-1 ${strength.score >= 3 ? strength.color : "bg-transparent"}`} />
                </div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  STRENGTH: {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 w-full h-11 bg-white hover:bg-cyber-lime text-black font-extrabold text-xs uppercase tracking-widest border border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.4)] hover:shadow-[4px_4px_0px_0px_#ffffff] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">ENROLLING OPERATOR...</span>
            ) : (
              <>
                <span>INITIALIZE IDENTITY</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* OAuth Federated Section */}
        <OAuthButtons label="FEDERATED ENROLLMENT" />

        {/* Login Link */}
        <div className="border-t border-white/10 pt-4 text-center">
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="text-xs text-gray-400 hover:text-cyber-cyan transition-colors uppercase tracking-wider"
          >
            ALREADY ENROLLED? <span className="underline font-bold text-white">AUTHENTICATE HERE -&gt;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="font-mono text-center text-xs text-gray-500 py-12">LOADING TERMINAL...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
