import { useState } from "react"

import type { ThemeConfig } from "@/lib/config"

export function Background({ config, dark }: { config: ThemeConfig; dark: boolean }) {
  const lightUrl = config.lightBackgroundUrl.trim()
  const darkUrl = config.darkBackgroundUrl.trim()
  const url = config.backgroundEnabled ? (dark ? darkUrl || lightUrl : lightUrl || darkUrl) : ""
  const [failedUrl, setFailedUrl] = useState("")

  if (!url || failedUrl === url) return null

  const bleed = Math.ceil(config.backgroundBlur * 1.5)
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <img
        key={url}
        src={url}
        alt=""
        onError={() => setFailedUrl(url)}
        className="absolute max-w-none object-cover"
        style={{
          inset: -bleed,
          width: `calc(100% + ${bleed * 2}px)`,
          height: `calc(100% + ${bleed * 2}px)`,
          filter: config.backgroundBlur ? `blur(${config.backgroundBlur}px)` : undefined,
        }}
      />
      {config.backgroundOverlay > 0 && (
        <div className="absolute inset-0 bg-black" style={{ opacity: config.backgroundOverlay / 100 }} />
      )}
    </div>
  )
}
