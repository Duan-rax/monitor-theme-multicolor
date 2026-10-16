export type HistoryRange = { hours: number; label: string }

const CANDIDATES: HistoryRange[] = [
  { hours: 1, label: "1 小时" },
  { hours: 6, label: "6 小时" },
  { hours: 24, label: "24 小时" },
  { hours: 168, label: "7 天" },
  { hours: 336, label: "14 天" },
  { hours: 720, label: "30 天" },
]

/** Never offer a range the hub will silently shorten to its retention limit. */
export function historyRanges(historyDays: number): HistoryRange[] {
  const days = Number.isFinite(historyDays) ? Math.max(1, historyDays) : 7
  const limit = days * 24
  return CANDIDATES.filter((range) => range.hours <= limit)
}
