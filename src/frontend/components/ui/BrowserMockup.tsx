import React from "react";

interface BrowserMockupProps {
  children: React.ReactNode;
  url?: string;
  className?: string;
}

export function BrowserMockup({
  children,
  url = "signlight.vn/luyen-ai",
  className = "",
}: BrowserMockupProps) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      {/* Screen Frame */}
      <div className="rounded-t-2xl bg-ink-900 p-[3px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.45)] ring-1 ring-white/10">
        {/* Browser Top Chrome Bar */}
        <div className="rounded-t-xl bg-ink-800 px-3.5 py-2.5 flex items-center gap-3">
          {/* Traffic Light Dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28CA42] block" />
          </div>

          {/* Active Tab */}
          <div className="hidden sm:flex items-center gap-1.5 bg-ink-50 rounded-t-md px-3 py-1 text-[11px] font-bold text-ink-900 border-t border-x border-ink-200">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <span>SignLight</span>
          </div>

          {/* Address Bar */}
          <div className="flex-1 bg-ink-950 rounded-md px-3 py-1 text-[11px] text-ink-400 font-mono flex items-center gap-1.5 border border-ink-700/50">
            <svg
              className="w-3 h-3 text-brand-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="truncate">{url}</span>
          </div>
        </div>

        {/* Browser Viewport Screen Area */}
        <div className="rounded-b-sm overflow-hidden bg-white aspect-video relative flex flex-col">
          {children}
        </div>
      </div>

      {/* Laptop Hinge & Keyboard Base */}
      <div className="h-[6px] bg-ink-800 rounded-b-sm mx-2 shadow-xs" />
      <div className="h-[5px] bg-ink-800 rounded-b-xl mx-[-3px] shadow-sm" />
      <div className="h-[14px] bg-ink-900 rounded-b-2xl mx-[-8px] shadow-xl flex items-center justify-center border-t border-ink-700">
        <div className="w-20 h-[3px] rounded-full bg-ink-700" />
      </div>
    </div>
  );
}
