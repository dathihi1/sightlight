import React from "react";

interface InitialsAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Generate consistent HSL color based on the person's name
function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-14 h-14 text-base",
};

export function InitialsAvatar({
  name,
  size = "md",
  className = "",
}: InitialsAvatarProps) {
  const hue = nameToHue(name);
  const bg = `hsl(${hue}, 48%, 38%)`;
  const initials = getInitials(name);

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white select-none shadow-2xs ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: bg }}
      aria-label={name}
      title={name}
    >
      {initials}
    </span>
  );
}
