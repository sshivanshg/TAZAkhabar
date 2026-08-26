/** Uppercase location from a city slug, e.g. `jhansi` → `JHANSI`. */
export function formatLocationLabel(slug: string | null | undefined): string | undefined {
  const value = slug?.trim()
  if (!value) {
    return undefined
  }
  return value.replace(/[-_]+/g, ' ').toUpperCase()
}
