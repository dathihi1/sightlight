"use client";

import { useEffect, useMemo, useState } from "react";

const COLORS = [
  "var(--color-brand-400)",
  "var(--color-sun-400)",
  "var(--color-grape-400)",
  "var(--color-flame-400)",
  "var(--color-success-400)",
  "var(--color-danger-400)",
];

/**
 * Pháo giấy thuần CSS. `burst` bung ra từ giữa phần tử cha (cha cần `relative`); `rain` rơi phủ cả màn hình.
 * Ẩn hoàn toàn khi người dùng bật "giảm chuyển động".
 */
export function Confetti({ mode = "burst", count }: { mode?: "burst" | "rain"; count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count ?? (mode === "burst" ? 28 : 90) }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 70 + Math.random() * 110;
        return {
          i,
          color: COLORS[i % COLORS.length],
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 8,
          left: Math.random() * 100,
          dx: mode === "burst" ? Math.cos(angle) * dist : (Math.random() - 0.5) * 160,
          dy: Math.sin(angle) * dist - 50,
          rot: (Math.random() - 0.5) * 900,
          delay: Math.random() * (mode === "burst" ? 0.08 : 0.9),
          dur: mode === "burst" ? 0.8 + Math.random() * 0.4 : 2.4 + Math.random() * 1.6,
          round: Math.random() > 0.6,
        };
      }),
    [mode, count],
  );

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none overflow-visible motion-reduce:hidden ${mode === "rain" ? "fixed inset-0 z-50 overflow-hidden" : "absolute left-1/2 top-1/2 z-10 h-0 w-0"}`}
    >
      {pieces.map((p) => (
        <span
          key={p.i}
          className="absolute block"
          style={
            {
              left: mode === "rain" ? `${p.left}%` : 0,
              top: 0,
              width: p.w,
              height: p.round ? p.w : p.h,
              background: p.color,
              borderRadius: p.round ? "9999px" : "2px",
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--rot": `${p.rot}deg`,
              animation: `${mode === "burst" ? "confetti-burst" : "confetti-fall"} ${p.dur}s cubic-bezier(.2,.7,.3,1) ${p.delay}s both`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Số đếm tăng dần tới `to` (≈0.9s, chậm dần). Hiện ngay giá trị cuối nếu bật "giảm chuyển động". */
export function CountUp({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 900, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return (
    <>
      {prefix}
      {value}
      {suffix}
    </>
  );
}
