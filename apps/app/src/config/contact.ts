import { getPublicSiteUrl } from '../utils/publicSiteUrl'

/** Official developer contact email (also on the public site /contact page and the Play listing). */
export const CONTACT_EMAIL = (process.env.EXPO_PUBLIC_CONTACT_EMAIL || 'contact@khabro.in').trim()

/** Publisher / developer name shown on the Contact us screen. */
export const DEVELOPER_NAME = 'Khabro'

export function getContactPageUrl(): string {
  return `${getPublicSiteUrl()}/contact`
}
