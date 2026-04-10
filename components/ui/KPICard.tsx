import type { ReactNode } from "react";

type AccentColor = "indigo" | "emerald" | "amber" | "pink";

interface KPICardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accentColor: AccentColor;
  subtitle?: string;
}

const accentStyles: Record<
  AccentColor,
  { icon: string; border: string; shadow: string; text: string }
> = {
  indigo: {
    icon: "bg-indigo-500/15 text-indigo-400",
    border: "hover:border-indigo-500/30",
    shadow: "hover:shadow-glow-indigo",
    text: "text-indigo-400",
  },
  emerald: {
    icon: "bg-emerald-500/15 text-emerald-400",
    border: "hover:border-emerald-500/30",
    shadow: "hover:shadow-glow-emerald",
    text: "text-emerald-400",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-400",
    border: "hover:border-amber-500/30",
    shadow: "hover:shadow-glow-amber",
    text: "text-amber-400",
  },
  pink: {
    icon: "bg-pink-500/15 text-pink-400",
    border: "hover:border-pink-500/30",
    shadow: "hover:shadow-glow-pink",
    text: "text-pink-400",
  },
};

export function KPICard({
  label,
  value,
  icon,
  accentColor,
  subtitle,
}: KPICardProps) {
  const styles = accentStyles[accentColor];

  return (
    <div
      className={`relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md transition-all duration-300 ${styles.border} ${styles.shadow}`}
    >
      {/* Subtle top gradient line */}
      <div
        className={`absolute inset-x-0 top-0 h-px rounded-t-2xl opacity-50 ${
          accentColor === "indigo"
            ? "bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
            : accentColor === "emerald"
              ? "bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
              : accentColor === "amber"
                ? "bg-gradient-to-r from-transparent via-amber-500 to-transparent"
                : "bg-gradient-to-r from-transparent via-pink-500 to-transparent"
        }`}
      />

      <div className={`inline-flex rounded-xl p-3 ${styles.icon}`}>{icon}</div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-400">{label}</p>
      {subtitle && <p className={`mt-1 text-xs ${styles.text}`}>{subtitle}</p>}
    </div>
  );
}
