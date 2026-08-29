const DEFAULT_PUBLIC_SITE_URL = 'https://tazakhabar-site.pages.dev'

export function getPublicSiteUrl(): string {
  return (process.env.EXPO_PUBLIC_SITE_URL ?? DEFAULT_PUBLIC_SITE_URL).replace(/\/+$/, '')
}
