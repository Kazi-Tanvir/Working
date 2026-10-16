"use client";

import React, { useState, useEffect } from "react";
import { Terminal, AlertTriangle, CheckCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "warning" | "error" | "info" | "system";
  duration?: number;
}

export function showToast(message: string, type: ToastMessage["type"] = "success", duration = 3000) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("sys-toast", {
      detail: { message, type, duration }
    });
    window.dispatchEvent(event);
  }
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: ToastMessage["type"]; duration?: number }>;
      const { message, type, duration = 3000 } = customEvent.detail;
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };

    window.addEventListener("sys-toast", handleToastEvent);
    return () => window.removeEventListener("sys-toast", handleToastEvent);
  }, []);

  const getToastStyles = (type: ToastMessage["type"]) => {
    switch (type) {
      case "success":
        return {
          border: "border-cyber-green",
          shadow: "shadow-[4px_4px_0px_0px_var(--cyber-green)]",
          bg: "bg-black",
          text: "text-cyber-green",
          icon: <CheckCircle className="w-4 h-4 text-cyber-green" />
        };
      case "error":
        return {
          border: "border-cyber-red",
          shadow: "shadow-[4px_4px_0px_0px_var(--cyber-red)]",
          bg: "bg-black",
          text: "text-cyber-red",
          icon: <AlertTriangle className="w-4 h-4 text-cyber-red" />
        };
      case "warning":
        return {
          border: "border-cyber-yellow",
          shadow: "shadow-[4px_4px_0px_0px_var(--cyber-yellow)]",
          bg: "bg-black",
          text: "text-cyber-yellow",
          icon: <AlertTriangle className="w-4 h-4 text-cyber-yellow" />
        };
      case "system":
        return {
          border: "border-cyber-purple",
          shadow: "shadow-[4px_4px_0px_0px_var(--cyber-purple)]",
          bg: "bg-[#09090b]",
          text: "text-cyber-purple",
          icon: <Terminal className="w-4 h-4 text-cyber-purple animate-pulse" />
        };
      case "info":
      default:
        return {
          border: "border-cyber-cyan",
          shadow: "shadow-[4px_4px_0px_0px_var(--cyber-cyan)]",
          bg: "bg-black",
          text: "text-cyber-cyan",
          icon: <Info className="w-4 h-4 text-cyber-cyan" />
        };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm w-full pointer-events-none select-none font-mono">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        const duration = toast.duration || 3000;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 border-2 p-4 animate-slide-in-right ${styles.bg} ${styles.border} ${styles.shadow}`}
          >
            <div className="shrink-0 mt-0.5">{styles.icon}</div>
            <div className="flex-grow flex flex-col gap-1 pr-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold">
                {toast.type === "system" ? "SYSTEM LOG" : `NOTIFICATION::${toast.type.toUpperCase()}`}
              </span>
              <p className="text-xs text-white uppercase tracking-wider">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="shrink-0 text-gray-500 hover:text-white transition-colors cursor-pointer p-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Countdown progress bar */}
            <div
              className={`absolute bottom-0 left-0 h-1 ${styles.bg.includes("green") ? "bg-cyber-green" : toast.type === "error" ? "bg-cyber-red" : toast.type === "warning" ? "bg-cyber-yellow" : toast.type === "system" ? "bg-cyber-purple" : "bg-cyber-cyan"}`}
              style={{
                animation: `toastProgress ${duration}ms linear forwards`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
