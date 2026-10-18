// src/components/PrintButton.tsx
'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
    >
      <span>🖨️</span> এখনই প্রিন্ট করুন
    </button>
  );
}
