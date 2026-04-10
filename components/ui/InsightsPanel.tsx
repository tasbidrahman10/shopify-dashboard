import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorBanner } from "./ErrorBanner";
import type { InsightItem, InsightsState, InsightType } from "@/lib/types";

interface InsightsPanelProps {
  state: InsightsState;
  insights: InsightItem[];
  onRetry: () => void;
}

const typeStyles: Record<
  InsightType,
  { border: string; badge: string; badgeText: string; icon: string }
> = {
  positive: {
    border: "border-l-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400",
    badgeText: "Positive",
    icon: "✦",
  },
  opportunity: {
    border: "border-l-indigo-400",
    badge: "bg-indigo-500/15 text-indigo-400",
    badgeText: "Opportunity",
    icon: "◈",
  },
  warning: {
    border: "border-l-amber-400",
    badge: "bg-amber-500/15 text-amber-400",
    badgeText: "Warning",
    icon: "▲",
  },
  suggestion: {
    border: "border-l-violet-400",
    badge: "bg-violet-500/15 text-violet-400",
    badgeText: "Suggestion",
    icon: "◆",
  },
};

function InsightCard({
  insight,
  index,
}: {
  insight: InsightItem;
  index: number;
}) {
  const styles = typeStyles[insight.type] ?? typeStyles.suggestion;
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] border-l-4 ${styles.border} bg-white/[0.04] p-5 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.07]`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.badge}`}
        >
          {styles.badgeText}
        </span>
      </div>
      <p className="text-sm font-semibold leading-snug text-white">
        {insight.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">
        {insight.body}
      </p>
    </div>
  );
}

export function InsightsPanel({
  state,
  insights,
  onRetry,
}: InsightsPanelProps) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30">
          <svg
            className="h-5 w-5 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">AI Insights</h3>
          <p className="text-sm text-gray-500">
            Powered by Gemini · Actionable recommendations
          </p>
        </div>
      </div>

      {/* Loading */}
      {state === "loading" && (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner
            size="lg"
            label="Analyzing your store data with AI…"
          />
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="py-4">
          <ErrorBanner
            message="AI insights are unavailable right now. Your charts are unaffected."
            onRetry={onRetry}
          />
        </div>
      )}

      {/* Idle (shouldn't normally show) */}
      {state === "idle" && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-gray-500">
            Insights will appear here after upload.
          </p>
        </div>
      )}

      {/* Success */}
      {state === "success" && insights.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
