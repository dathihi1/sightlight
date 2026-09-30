/**
 * Biểu tượng minh hoạ của SignLight: bàn tay + tia sáng (theo logo), không có khuôn mặt hoạt hình.
 * `mood` chỉ đổi tia sáng: happy = vàng, wow = vàng + hào quang, sad = xám.
 */
type Mood = "happy" | "wow" | "sad";

const FINGERS = [
  { x: 30, y: 40, h: 42 },
  { x: 46, y: 26, h: 54 },
  { x: 62, y: 22, h: 58 },
  { x: 78, y: 32, h: 48 },
];

export function Mascot({
  className = "w-28",
  mood = "happy",
  wave = false,
}: {
  className?: string;
  mood?: Mood;
  wave?: boolean;
}) {
  const spark = mood === "sad" ? "var(--color-ink-300)" : "var(--color-sun-400)";
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="64" r="52" fill={mood === "sad" ? "var(--color-ink-100)" : "var(--color-brand-50)"} />
      <g className={wave ? "animate-wave-hand" : ""} style={{ transformOrigin: "60px 100px" }}>
        <g fill={mood === "sad" ? "var(--color-ink-400)" : "var(--color-brand-500)"}>
          {FINGERS.map((f) => (
            <rect key={f.x} x={f.x} y={f.y} width="13" height={f.h} rx="6.5" />
          ))}
          <rect x="12" y="64" width="13" height="34" rx="6.5" transform="rotate(-40 18 81)" />
          <rect x="28" y="60" width="64" height="44" rx="22" />
        </g>
        <path d="M44 84 q16 10 32 0" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".55" />
      </g>
      {mood === "wow" && <circle cx="98" cy="20" r="14" fill="var(--color-sun-100)" />}
      <path d="M98 8 L101 17 L110 20 L101 23 L98 32 L95 23 L86 20 L95 17 Z" fill={spark} />
    </svg>
  );
}
