import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { healthLevel, type HealthLevel } from "@/lib/health"

type Props = { label: ReactNode; pct: number | null; foot: ReactNode; empty?: ReactNode; level?: HealthLevel }

const LEVELS: Record<HealthLevel, { bar: string; text: string; label: string }> = {
  healthy: { bar: "bg-health", text: "text-health", label: "健康" },
  load: { bar: "bg-load", text: "text-load", label: "负载" },
  severe: { bar: "bg-severe", text: "text-severe", label: "严重" },
  danger: { bar: "bg-danger", text: "text-danger", label: "危险" },
}

/**
 * One metric: name and percentage on top, bar in the middle, raw numbers
 * underneath. The colour is a shared health scale across every percentage:
 * healthy < 60, load < 75, severe < 90, danger >= 90.
 */
export function Meter({ label, pct, foot, empty = "—", level: forcedLevel }: Props) {
  // null means the metric has no ceiling to fill, so the bar stays empty rather
  // than reporting 0%. What replaces the percentage depends on the reason:
  // unknown for a node with no metrics, ∞ for a plan with no limit.
  const filled = pct === null ? 0 : Math.min(100, Math.max(0, pct))
  const level = LEVELS[forcedLevel ?? healthLevel(filled)]
  return (
    <div className="min-w-0" title={pct === null ? undefined : `${level.label} · ${filled.toFixed(1)}%`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">{label}</span>
        <span className={cn("tnum text-xs font-medium", pct !== null && level.text)}>
          {pct === null ? empty : `${filled < 10 ? filled.toFixed(1) : filled.toFixed(0)}%`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-[width] duration-500", level.bar)} style={{ width: `${filled}%` }} />
      </div>
      <div className="tnum mt-1.5 truncate text-xs text-muted-foreground">{foot}</div>
    </div>
  )
}
