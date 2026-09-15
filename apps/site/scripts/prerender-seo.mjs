#!/usr/bin/env node
/**
 * After Vite build, write per-route HTML shells with crawlable meta tags.
 * Cloudflare Pages serves these static files ahead of the SPA fallback.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const siteDir = path.resolve(rootDir, '..')
const distDir = path.join(siteDir, 'dist')
const seoPath = path.join(siteDir, 'src', 'seo-pages.json')

const siteUrl = (process.env.VITE_SITE_URL || 'https://site.khabro.in').replace(/\/+$/, '')
const readerUrl = process.env.VITE_READER_URL || 'https://khabro.in/'

const seo = JSON.parse(fs.readFileSync(seoPath, 'utf8'))
const indexHtmlPath = path.join(distDir, 'index.html')

if (!fs.existsSync(indexHtmlPath)) {
  console.error('prerender-seo: dist/index.html missing — run vite build first')
  process.exit(1)
}

const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8')

function absoluteUrl(pathname) {
  if (pathname === '/') return `${siteUrl}/`
  return `${siteUrl}${pathname}`
}

function absoluteAsset(assetPath) {
  return `${siteUrl}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`
}

function buildJsonLd(pageId, page) {
  const pageUrl = absoluteUrl(page.path)
  const org = {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: seo.siteName,
    url: `${siteUrl}/`,
    logo: absoluteAsset('/khabro-mark.svg'),
    description: seo.pages.home.description,
  }
  const website = {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: seo.siteName,
    url: `${siteUrl}/`,
    inLanguage: 'en-IN',
    publisher: { '@id': `${siteUrl}/#organization` },
    potentialAction: {
      '@type': 'ReadAction',
      target: readerUrl,
    },
  }
  const webpage = {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: page.title,
    description: page.description,
    isPartOf: { '@id': `${siteUrl}/#website` },
    about: { '@id': `${siteUrl}/#organization` },
    inLanguage: 'en-IN',
  }
  return {
    '@context': 'https://schema.org',
    '@graph': pageId === 'home' ? [org, website, webpage] : [webpage],
  }
}

function upsertMeta(html, attr, key, content) {
  const re = new RegExp(`<meta[^>]*${attr}=["']${key}["'][^>]*>`, 'i')
  const tag = `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`
  if (re.test(html)) {
    return html.replace(re, tag)
  }
  return html.replace('</head>', `    ${tag}\n  </head>`)
}

function upsertLink(html, rel, href) {
  const re = new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*>`, 'i')
  const tag = `<link rel="${rel}" href="${escapeAttr(href)}" />`
  if (re.test(html)) {
    return html.replace(re, tag)
  }
  return html.replace('</head>', `    ${tag}\n  </head>`)
}

function upsertTitle(html, title) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  }
  return html.replace('</head>', `    <title>${escapeHtml(title)}</title>\n  </head>`)
}

function upsertJsonLd(html, data) {
  const script = `<script type="application/ld+json">${JSON.stringify(data)}</script>`
  if (/<script type="application\/ld\+json">[\s\S]*?<\/script>/i.test(html)) {
    return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, script)
  }
  return html.replace('</head>', `    ${script}\n  </head>`)
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function applyPageMeta(html, pageId, page) {
  const pageUrl = absoluteUrl(page.path)
  const imageUrl = absoluteAsset(seo.defaultOgImagePath)
  let next = html
  next = next.replace(/<html lang="[^"]*"/i, '<html lang="en-IN"')
  next = upsertTitle(next, page.title)
  next = upsertMeta(next, 'name', 'description', page.description)
  next = upsertMeta(next, 'name', 'robots', 'index,follow,max-image-preview:large')
  next = upsertMeta(next, 'property', 'og:type', page.ogType || 'website')
  next = upsertMeta(next, 'property', 'og:site_name', seo.siteName)
  next = upsertMeta(next, 'property', 'og:locale', seo.locale)
  next = upsertMeta(next, 'property', 'og:title', page.title)
  next = upsertMeta(next, 'property', 'og:description', page.description)
  next = upsertMeta(next, 'property', 'og:url', pageUrl)
  next = upsertMeta(next, 'property', 'og:image', imageUrl)
  next = upsertMeta(next, 'property', 'og:image:alt', `${seo.siteName} — local news for your city`)
  next = upsertMeta(next, 'name', 'twitter:card', 'summary_large_image')
  next = upsertMeta(next, 'name', 'twitter:title', page.title)
  next = upsertMeta(next, 'name', 'twitter:description', page.description)
  next = upsertMeta(next, 'name', 'twitter:image', imageUrl)
  next = upsertMeta(next, 'name', 'twitter:image:alt', `${seo.siteName} — local news for your city`)
  next = upsertLink(next, 'canonical', pageUrl)
  next = upsertJsonLd(next, buildJsonLd(pageId, page))
  return next
}

function writeSitemap() {
  const urls = Object.values(seo.pages)
    .map((page) => {
      const loc = absoluteUrl(page.path)
      const priority = page.path === '/' ? '1.0' : '0.8'
      const changefreq = page.path === '/' ? 'weekly' : 'monthly'
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    })
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml)
}

function writeRobots() {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  fs.writeFileSync(path.join(distDir, 'robots.txt'), body)
}

for (const [pageId, page] of Object.entries(seo.pages)) {
  const html = applyPageMeta(baseHtml, pageId, page)
  if (page.path === '/') {
    fs.writeFileSync(indexHtmlPath, html)
    continue
  }
  const outDir = path.join(distDir, page.path.replace(/^\//, ''))
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'index.html'), html)
  console.log(`prerender-seo: wrote ${page.path}/index.html`)
}

writeSitemap()
writeRobots()
console.log(`prerender-seo: wrote sitemap.xml and robots.txt for ${siteUrl}`)
