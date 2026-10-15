"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Terminal, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const { login, oauthLogin } = useAuth();
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginInput.trim() || !password) {
      setError("Please provide both identifier and passcode.");
      return;
    }

    setIsSubmitting(true);
    const result = await login({ login: loginInput.trim(), password });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Authentication failed. Check credentials.");
    } else {
      router.push(redirect);
    }
  };

  const handleOAuth = async (provider: "google" | "discord") => {
    setError(null);
    setIsSubmitting(true);
    const result = await oauthLogin(provider);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || `${provider} authentication failed`);
    } else {
      router.push(redirect);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto flex flex-col gap-6 font-mono">
      {/* Top Cyber System Header */}
      <div className="flex items-center justify-between border-b border-white/20 pb-2 text-[11px] text-gray-500 uppercase tracking-widest">
        <span className="flex items-center gap-1.5 text-cyber-cyan">
          <span className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse" />
          SYS_SEC_V2 // GATEWAY
        </span>
        <span className="text-gray-400">NODE: ALPHA_01</span>
      </div>

      {/* Main Terminal Frame */}
      <div className="bg-[#0a0a0f] border-2 border-white p-6 md:p-8 shadow-[6px_6px_0px_0px_#ffffff] flex flex-col gap-6">
        {/* Terminal Title */}
        <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-cyber-purple p-1 border border-white">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-black tracking-wider text-white uppercase">
              [ShinDB // OPERATOR_LOGIN]
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ENTER CLEARANCE IDENTIFIER & PASSCODE TO ACCESS ARCHIVE.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="border border-cyber-rose/60 bg-cyber-rose/10 p-3 text-xs text-cyber-rose flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Identifier Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>[01] USERNAME OR EMAIL</span>
              <span className="text-[10px] text-gray-500">REQUIRED</span>
            </label>
            <div className="flex items-center border border-white/30 bg-black/60 focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all">
              <div className="px-3 text-gray-500 border-r border-white/20">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="shin or shin@shindb.local"
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Passcode Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>[02] PASSCODE</span>
              <span className="text-[10px] text-gray-500">ENCRYPTED</span>
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
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full h-11 bg-white hover:bg-cyber-purple text-black hover:text-white font-extrabold text-xs uppercase tracking-widest border border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.4)] hover:shadow-[4px_4px_0px_0px_#ffffff] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">VERIFYING CLEARANCE...</span>
            ) : (
              <>
                <span>AUTHENTICATE OPERATOR</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* OAuth Section Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-white/20 w-full" />
          <span className="bg-[#0a0a0f] px-3 text-[10px] text-gray-500 uppercase tracking-widest shrink-0">
            FEDERATED CLEARANCE [PLACEHOLDER]
          </span>
        </div>

        {/* OAuth Placeholders */}
        <div className="grid grid-cols-2 gap-3 opacity-60">
          <div
            title="OAuth integration is in standby mode. Use standard credentials."
            className="h-10 border border-white/20 bg-white/5 text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2 select-none cursor-not-allowed"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>Google [Soon]</span>
          </div>
          <div
            title="OAuth integration is in standby mode. Use standard credentials."
            className="h-10 border border-white/20 bg-white/5 text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2 select-none cursor-not-allowed"
          >
            <Terminal className="w-3.5 h-3.5 text-cyber-purple" />
            <span>Discord [Soon]</span>
          </div>
        </div>

        {/* Base Account Credentials Info */}
        <div className="border border-white/10 bg-white/5 p-3 text-[11px] text-gray-400 flex flex-col gap-1">
          <span className="text-gray-300 font-bold uppercase tracking-wider">[BASE OPERATOR CREDENTIALS]:</span>
          <span>Username: <strong className="text-cyber-cyan">SENPAI_09</strong></span>
          <span>Password: <strong className="text-cyber-cyan">password123</strong></span>
        </div>

        {/* Enrollment Link */}
        <div className="border-t border-white/10 pt-4 text-center">
          <Link
            href={`/register?redirect=${encodeURIComponent(redirect)}`}
            className="text-xs text-gray-400 hover:text-cyber-cyan transition-colors uppercase tracking-wider"
          >
            NEW OPERATOR? <span className="underline font-bold text-white">INITIALIZE CLEARANCE -&gt;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="font-mono text-center text-xs text-gray-500 py-12">LOADING TERMINAL...</div>}>
      <LoginForm />
    </Suspense>
  );
}
