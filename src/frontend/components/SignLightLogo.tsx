export function SignLightLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="signLightLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="var(--color-brand-100)" />
        </linearGradient>
        <filter id="signLightGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="var(--color-brand-800)" floodOpacity="0.4" />
        </filter>
      </defs>
      <rect width="200" height="200" rx="52" fill="var(--color-brand-700)" /><rect width="200" height="188" rx="52" fill="var(--color-brand-400)" />
      <g filter="url(#signLightGlow)">
        {/* Light spark / beacon radiating light */}
        <path d="M100 28 L104 46 L122 50 L104 54 L100 72 L96 54 L78 50 L96 46 Z" fill="var(--color-sun-400)" />
        {/* Stylized hand gesture conveying 'Light' & 'Sign' connection */}
        <path
          d="M72 145 C65 145 60 138 60 128 L60 92 C60 86 64 82 70 82 C76 82 80 86 80 92 L80 120"
          stroke="url(#signLightLogoGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M80 102 L80 72 C80 66 84 62 90 62 C96 62 100 66 100 72 L100 120"
          stroke="url(#signLightLogoGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M100 106 L100 78 C100 72 104 68 110 68 C116 68 120 72 120 78 L120 122"
          stroke="url(#signLightLogoGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M120 114 L120 88 C120 82 124 78 130 78 C136 78 140 82 140 88 L140 125 C140 148 122 165 98 165 C80 165 72 155 72 145 Z"
          fill="none"
          stroke="url(#signLightLogoGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="100" cy="50" r="3" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
