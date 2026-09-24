import { useEffect, useState } from "react"
import { ArrowDown, ArrowDownUp, ArrowUp, Gauge, Server, WalletCards } from "lucide-react"

import { Card } from "@/components/ui/card"
import { speedHistory, type Node } from "@/lib/api"
import { bytes, rate } from "@/lib/format"
import {
  fetchUsdRates, FX_CACHE_TTL, readFxCache, remainingCny, type FxSnapshot, writeFxCache,
} from "@/lib/fx"
import { cn } from "@/lib/utils"

function Tile({ icon: Icon, label, tone, children }: {
  icon: typeof Server; label: string; tone: string; children: React.ReactNode
}) {
  return (
    <Card className="gap-0 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className={cn("size-3.5", tone)} />
        {label}
      </div>
      {children}
    </Card>
  )
}

/**
 * In and out side by side, the form every traffic figure on this page takes.
 * Stacked below sm, where two tiles share a phone's width and "23.3 MB" has
 * roughly 70px available.
 */
function Flow({ down, up, className }: { down: string; up: string; className?: string }) {
  return (
    <div className={cn("tnum grid grid-cols-1 gap-x-2 sm:grid-cols-2", className)}>
      <span className="inline-flex items-center gap-1">
        <ArrowDown className="size-3 shrink-0 text-download" />
        {down}
      </span>
      <span className="inline-flex items-center gap-1">
        <ArrowUp className="size-3 shrink-0 text-upload" />
        {up}
      </span>
    </div>
  )
}

/**
 * A bare polyline with no axes or tooltips: at this size only the shape is
 * legible, and recharts would bring a full chart's machinery for it. Series share
 * one scale so the two throughput lines remain comparable.
 */
function Spark({ series }: { series: { values: number[]; className: string }[] }) {
  const top = Math.max(...series.flatMap((s) => s.values), 1)
  const width = Math.max(...series.map((s) => s.values.length), 2) - 1
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-7 w-full" aria-hidden>
      {series.map((s, i) => (
        <polyline
          key={i}
          className={s.className}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
          points={s.values.map((v, x) => `${(x / width) * 100},${23 - (v / top) * 22}`).join(" ")}
        />
      ))}
    </svg>
  )
}

/** `group` picks the throughput series: null for every node, else the tab's group. */
export function Summary({ nodes, group }: { nodes: Node[]; group: string | null }) {
  const online = nodes.filter((n) => n.online)
  const sum = (pick: (n: Node) => number) => nodes.reduce((total, n) => total + pick(n), 0)
  const [fx, setFx] = useState<FxSnapshot | null>(() => readFxCache())
  const [fxFailed, setFxFailed] = useState(false)

  useEffect(() => {
    if (fx && Date.now() - fx.savedAt < FX_CACHE_TTL) return
    const controller = new AbortController()
    fetchUsdRates(controller.signal)
      .then((snapshot) => {
        setFx(snapshot)
        setFxFailed(false)
        writeFxCache(snapshot)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setFxFailed(true)
      })
    return () => controller.abort()
  }, [fx])

  const values = fx ? nodes.map((node) => remainingCny(node, fx.rates)).filter((value): value is number => value !== null) : []
  const remaining = values.reduce((total, value) => total + value, 0)
  const cny = new Intl.NumberFormat("zh-CN", {
    style: "currency", currency: "CNY", maximumFractionDigits: remaining >= 1000 ? 0 : 2,
  }).format(remaining)
  // The same push produced `nodes` and this sample, so the figure above the line
  // is that line's last point.
  const history = speedHistory.get(group) ?? []
  const now = history.at(-1) ?? { rx: 0, tx: 0 }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile icon={Server} label="节点" tone={online.length === nodes.length ? "text-online" : "text-warn"}>
        <div className="tnum mt-1 text-xl font-semibold">
          {online.length} / {nodes.length}
        </div>
        <div className="mt-auto pt-1 text-xs text-muted-foreground">
          {nodes.length - online.length > 0 ? `${nodes.length - online.length} 个离线` : "全部在线"}
        </div>
      </Tile>

      <Tile icon={WalletCards} label="剩余价值" tone="text-disk">
        <div className="tnum mt-1 text-xl font-semibold text-disk">{fx ? cny : "—"}</div>
        <div className="mt-auto truncate pt-1 text-xs text-muted-foreground">
          {fx ? `${values.length} 台计价 · 汇率 ${fx.date.slice(5)}` : fxFailed ? "汇率暂不可用" : "正在获取人民币汇率"}
        </div>
      </Tile>

      <Tile icon={ArrowDownUp} label="今日流量" tone="text-traffic">
        <Flow
          down={bytes(sum((n) => n.day_rx))}
          up={bytes(sum((n) => n.day_tx))}
          className="mt-1 text-sm font-semibold"
        />
        <div className="mt-2 text-xs text-muted-foreground">总流量</div>
        <Flow down={bytes(sum((n) => n.total_rx))} up={bytes(sum((n) => n.total_tx))} className="mt-0.5 text-sm" />
      </Tile>

      <Tile icon={Gauge} label="实时网速" tone="text-memory">
        <Flow down={rate(now.rx)} up={rate(now.tx)} className="mt-1 text-sm font-semibold" />
        <div className="mt-auto pt-1">
          <Spark
            series={[
              { values: history.map((s) => s.rx), className: "text-download" },
              { values: history.map((s) => s.tx), className: "text-upload" },
            ]}
          />
        </div>
      </Tile>
    </div>
  )
}
