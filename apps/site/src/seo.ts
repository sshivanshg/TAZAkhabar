import seoPages from './seo-pages.json'

export type PageId = keyof typeof seoPages.pages

export type PageSeo = {
  path: string
  title: string
  description: string
  ogType?: string
}

export const siteName = seoPages.siteName
export const defaultOgImagePath = seoPages.defaultOgImagePath
export const siteLocale = seoPages.locale

export const pageSeo = seoPages.pages as Record<PageId, PageSeo>

export function hrefFor(page: PageId): string {
  return pageSeo[page].path
}

export function absoluteUrl(siteOrigin: string, page: PageId): string {
  const origin = siteOrigin.replace(/\/+$/, '')
  const path = hrefFor(page)
  return path === '/' ? `${origin}/` : `${origin}${path}`
}

function ensureMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function ensureLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function ensureJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export function applyPageSeo(page: PageId, siteOrigin: string, readerUrl: string) {
  const meta = pageSeo[page]
  const pageUrl = absoluteUrl(siteOrigin, page)
  const imageUrl = `${siteOrigin.replace(/\/+$/, '')}${defaultOgImagePath}`

  document.title = meta.title
  document.documentElement.lang = 'en-IN'

  ensureMeta('name', 'description', meta.description)
  ensureMeta('name', 'robots', 'index,follow,max-image-preview:large')
  ensureMeta('property', 'og:type', meta.ogType || 'website')
  ensureMeta('property', 'og:site_name', siteName)
  ensureMeta('property', 'og:locale', siteLocale)
  ensureMeta('property', 'og:title', meta.title)
  ensureMeta('property', 'og:description', meta.description)
  ensureMeta('property', 'og:url', pageUrl)
  ensureMeta('property', 'og:image', imageUrl)
  ensureMeta('property', 'og:image:alt', `${siteName} — local news for your city`)
  ensureMeta('name', 'twitter:card', 'summary_large_image')
  ensureMeta('name', 'twitter:title', meta.title)
  ensureMeta('name', 'twitter:description', meta.description)
  ensureMeta('name', 'twitter:image', imageUrl)
  ensureMeta('name', 'twitter:image:alt', `${siteName} — local news for your city`)
  ensureLink('canonical', pageUrl)

  const orgId = `${siteOrigin.replace(/\/+$/, '')}/#organization`
  const websiteId = `${siteOrigin.replace(/\/+$/, '')}/#website`
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: meta.title,
      description: meta.description,
      isPartOf: { '@id': websiteId },
      about: { '@id': orgId },
      inLanguage: 'en-IN',
    },
  ]

  if (page === 'home') {
    graph.unshift(
      {
        '@type': 'Organization',
        '@id': orgId,
        name: siteName,
        url: `${siteOrigin.replace(/\/+$/, '')}/`,
        logo: `${siteOrigin.replace(/\/+$/, '')}/khabro-mark.svg`,
        description: pageSeo.home.description,
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: siteName,
        url: `${siteOrigin.replace(/\/+$/, '')}/`,
        inLanguage: 'en-IN',
        publisher: { '@id': orgId },
        potentialAction: {
          '@type': 'ReadAction',
          target: readerUrl,
        },
      },
    )
  }

  ensureJsonLd('khabro-jsonld', {
    '@context': 'https://schema.org',
    '@graph': graph,
  })
}
