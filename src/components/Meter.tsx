import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Tone = "cpu" | "memory" | "disk" | "traffic"
type Props = { label: ReactNode; pct: number | null; foot: ReactNode; empty?: ReactNode; tone: Tone }

const TONES: Record<Tone, { bar: string; text: string }> = {
  cpu: { bar: "bg-cpu", text: "text-cpu" },
  memory: { bar: "bg-memory", text: "text-memory" },
  disk: { bar: "bg-disk", text: "text-disk" },
  traffic: { bar: "bg-traffic", text: "text-traffic" },
}

/**
 * One metric: name and percentage on top, bar in the middle, raw numbers
 * underneath. Monochrome, since the length of the bar carries the message.
 */
export function Meter({ label, pct, foot, empty = "—", tone }: Props) {
  // null means the metric has no ceiling to fill, so the bar stays empty rather
  // than reporting 0%. What replaces the percentage depends on the reason:
  // unknown for a node with no metrics, ∞ for a plan with no limit.
  const filled = pct === null ? 0 : Math.min(100, Math.max(0, pct))
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">{label}</span>
        <span className={cn("tnum text-xs font-medium", pct !== null && TONES[tone].text)}>
          {pct === null ? empty : `${filled < 10 ? filled.toFixed(1) : filled.toFixed(0)}%`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-[width] duration-500", TONES[tone].bar)} style={{ width: `${filled}%` }} />
      </div>
      <div className="tnum mt-1.5 truncate text-xs text-muted-foreground">{foot}</div>
    </div>
  )
}
