import manifest from "../../theme.json"

type Field = {
  key?: string
  type: string
  default?: unknown
  options?: { value: string }[]
  min?: number
  max?: number
}

export type ThemeConfig = {
  backgroundEnabled: boolean
  lightBackgroundUrl: string
  darkBackgroundUrl: string
  backgroundBlur: number
  backgroundPosition: "center" | "top" | "bottom" | "left" | "right"
  backgroundOverlay: number
  glassEnabled: boolean
  glassOpacity: number
  glassBlur: number
  glassSaturation: number
}

function fits(field: Field, value: unknown): boolean {
  switch (field.type) {
    case "boolean":
      return typeof value === "boolean"
    case "number":
      return typeof value === "number" && Number.isFinite(value)
        && value >= (field.min ?? -Infinity) && value <= (field.max ?? Infinity)
    case "select":
      return !!field.options?.some((option) => option.value === value)
    default:
      return typeof value === "string"
  }
}

const fields = (manifest.config as Field[]).filter(
  (field): field is Field & { key: keyof ThemeConfig; default: unknown } =>
    field.type !== "title" && typeof field.key === "string" && "default" in field,
)

export const defaultConfig = Object.fromEntries(
  fields.map((field) => [field.key, field.default]),
) as ThemeConfig

/** Invalid, missing and old saved values fall back to this release's manifest. */
export function mergeConfig(saved: Record<string, unknown>): ThemeConfig {
  return Object.fromEntries(
    fields.map((field) => [field.key, fits(field, saved[field.key]) ? saved[field.key] : field.default]),
  ) as ThemeConfig
}

/** Theme settings are optional; a failure must never block the public page. */
export async function loadConfig(): Promise<ThemeConfig> {
  try {
    const response = await fetch(`/api/themes/${manifest.short}/config`)
    if (response.ok) return mergeConfig(await response.json() as Record<string, unknown>)
  } catch {
    // The public page remains usable with manifest defaults while offline.
  }
  return defaultConfig
}
