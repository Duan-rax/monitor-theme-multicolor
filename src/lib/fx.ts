import type { Node } from "./api.ts"
import { daysUntil } from "./format.ts"

export const FX_URL = "https://api.frankfurter.dev/v2/rates?base=USD"
export const FX_CACHE_KEY = "monitor-theme-multicolor:usd-rates"
export const FX_CACHE_TTL = 12 * 60 * 60 * 1000

export type FxSnapshot = {
  date: string
  rates: Record<string, number>
  savedAt: number
}

type FxRow = { date?: unknown; base?: unknown; quote?: unknown; rate?: unknown }

const CYCLE_DAYS: Record<string, number> = {
  monthly: 30,
  quarterly: 365 / 4,
  semiannual: 365 / 2,
  yearly: 365,
  biennial: 365 * 2,
  triennial: 365 * 3,
}

export function parseUsdRates(value: unknown, savedAt = Date.now()): FxSnapshot {
  if (!Array.isArray(value)) throw new Error("汇率响应格式错误")
  const rates: Record<string, number> = { USD: 1 }
  let date = ""
  for (const row of value as FxRow[]) {
    const quote = typeof row.quote === "string" ? row.quote.toUpperCase() : ""
    if (row.base !== "USD" || !quote || typeof row.rate !== "number" || !Number.isFinite(row.rate) || row.rate <= 0) continue
    rates[quote] = row.rate
    if (typeof row.date === "string" && row.date > date) date = row.date
  }
  if (!rates.CNY || !date) throw new Error("汇率响应缺少 CNY")
  return { date, rates, savedAt }
}

export function toCny(amount: number, currency: string, rates: Record<string, number>): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null
  const source = rates[currency.toUpperCase()]
  const cny = rates.CNY
  return source > 0 && cny > 0 ? (amount / source) * cny : null
}

/** Remaining prepaid value in the node's billing currency. */
export function remainingAmount(node: Pick<Node, "price" | "billing_cycle" | "expires_in" | "expires_at">): number | null {
  if (!Number.isFinite(node.price) || node.price <= 0) return null
  const days = node.expires_in !== undefined ? node.expires_in : daysUntil(node.expires_at)
  if (node.billing_cycle === "once") return days === null || days >= 0 ? node.price : 0
  const cycle = CYCLE_DAYS[node.billing_cycle]
  if (!cycle || days === null) return null
  return node.price * Math.max(0, days) / cycle
}

export function remainingCny(node: Node, rates: Record<string, number>): number | null {
  const amount = remainingAmount(node)
  return amount === null ? null : toCny(amount, node.currency, rates)
}

export async function fetchUsdRates(signal?: AbortSignal): Promise<FxSnapshot> {
  const response = await fetch(FX_URL, { signal })
  if (!response.ok) throw new Error(`汇率服务返回 ${response.status}`)
  return parseUsdRates(await response.json())
}

export function readFxCache(): FxSnapshot | null {
  try {
    return parseCached(JSON.parse(localStorage.getItem(FX_CACHE_KEY) || "null"))
  } catch {
    return null
  }
}

export function writeFxCache(snapshot: FxSnapshot) {
  try {
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify(snapshot))
  } catch {
    // Storage may be unavailable in private browsing; the in-memory value still works.
  }
}

function parseCached(value: unknown): FxSnapshot | null {
  if (!value || typeof value !== "object") return null
  const candidate = value as Partial<FxSnapshot>
  if (typeof candidate.date !== "string" || typeof candidate.savedAt !== "number" || !candidate.rates || typeof candidate.rates !== "object") return null
  if (!Number.isFinite(candidate.rates.CNY) || candidate.rates.CNY <= 0) return null
  return candidate as FxSnapshot
}
