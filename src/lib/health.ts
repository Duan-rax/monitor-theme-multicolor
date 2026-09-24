export type HealthLevel = "healthy" | "load" | "severe" | "danger"

const RANK: Record<HealthLevel, number> = {
  healthy: 0,
  load: 1,
  severe: 2,
  danger: 3,
}

/** Shared utilisation thresholds for CPU, load, memory, disk and traffic. */
export function healthLevel(value: number): HealthLevel {
  const pct = Number.isFinite(value) ? Math.max(0, value) : 0
  if (pct >= 90) return "danger"
  if (pct >= 75) return "severe"
  if (pct >= 60) return "load"
  return "healthy"
}

/** 1-minute load expressed as saturation of the available CPU cores. */
export function loadPercent(load1: number, cores: number): number {
  if (!Number.isFinite(load1) || !Number.isFinite(cores) || cores <= 0) return 0
  return Math.max(0, load1 / cores * 100)
}

/** Highest health level among all finite utilisation values. */
export function worstHealth(values: Array<number | null | undefined>): HealthLevel {
  return values
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .map(healthLevel)
    .reduce((worst, level) => (RANK[level] > RANK[worst] ? level : worst), "healthy")
}
