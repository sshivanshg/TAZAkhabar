const DEFAULT_PUBLIC_SITE_URL = 'https://site.newsfeed-web.pages.dev'

export function getPublicSiteUrl(): string {
  return (process.env.EXPO_PUBLIC_SITE_URL ?? DEFAULT_PUBLIC_SITE_URL).replace(/\/+$/, '')
}
