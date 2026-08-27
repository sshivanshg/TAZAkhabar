import { useEffect, useMemo, useState } from 'react'

type PageId = 'home' | 'about' | 'privacy' | 'terms' | 'support' | 'corrections'

type PageSection = {
  title: string
  body?: string[]
  bullets?: string[]
}

type LegalPage = {
  id: Exclude<PageId, 'home'>
  eyebrow: string
  title: string
  intro: string
  updated?: string
  sections: PageSection[]
}

const readerUrl = import.meta.env.VITE_READER_URL || 'https://newsfeed-web.pages.dev/'
const siteUrl = import.meta.env.VITE_SITE_URL || 'https://tazakhabar-site.pages.dev'
const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL || '').trim()

const legalPages: Record<Exclude<PageId, 'home'>, LegalPage> = {
  about: {
    id: 'about',
    eyebrow: 'About',
    title: 'Local news, presented with less noise and more clarity',
    intro:
      'TazaKhabar is building a calm front door to city news for readers who want the important update quickly, clearly, and without account friction.',
    sections: [
      {
        title: 'Why this exists',
        body: [
          'Many local news websites are hard to read on a phone, heavy with pop-ups, or too cluttered for a quick daily check-in. TazaKhabar turns that experience into a simpler city briefing.',
          'Readers choose a city once, open the feed, and get short summaries with source credit and a direct path to the original publisher when they want more context.',
        ],
      },
      {
        title: 'How stories are prepared',
        body: [
          'TazaKhabar collects public publisher feeds, city pages, and editorial inputs. Summaries and translations may be assisted by language tooling before they are displayed in the reader.',
          'The original publisher report remains the reference point. If a summary changes the meaning of a story, readers and publishers can report it through the corrections process.',
        ],
      },
      {
        title: 'Reader commitments',
        bullets: [
          'No reader login for the current product.',
          'Large readable type and low-clutter layout.',
          'Publisher attribution stays attached to every story.',
          'No raw publisher HTML is embedded in the public reader.',
          'A visible corrections and takedown process exists before launch.',
        ],
      },
      {
        title: 'Coverage',
        body: [
          'TazaKhabar is launching city by city. Story volume and source coverage can differ between locations while the rollout expands.',
        ],
      },
    ],
  },
  privacy: {
    id: 'privacy',
    eyebrow: 'Privacy',
    title: 'Privacy policy',
    intro:
      'This policy explains what TazaKhabar handles when you use the website or mobile reader.',
    updated: '27 August 2026',
    sections: [
      {
        title: 'Information saved on your device',
        body: [
          'TazaKhabar does not require a reader account. Your city choice, appearance, reading language, bookmarks, blocked topics or sources, and a short-lived feed cache are stored on your device.',
          'You can remove that local information by clearing app or browser storage, or by uninstalling the application.',
        ],
      },
      {
        title: 'Information processed by the service',
        body: [
          'When the reader requests news, our infrastructure may process standard technical information such as IP address, request time, route, browser or device details, and request identifiers used for reliability and security logging.',
          'Article views may include a device-local session identifier so the service can reduce duplicate counts and understand which local stories are being opened. It is not tied to a reader account, phone number, or payment profile.',
        ],
      },
      {
        title: 'What we do not request',
        bullets: [
          'No reader account, password, or phone number.',
          'No GPS or precise location permission.',
          'No payment information.',
          'No contact, camera, or microphone access for ordinary reading.',
        ],
      },
      {
        title: 'External services and publisher links',
        body: [
          'TazaKhabar uses infrastructure providers to deliver the API, website, and database. They process limited technical information on our behalf under their own security and retention practices.',
          'Opening an original article sends you to the publisher website. That destination has its own privacy policy and is outside TazaKhabar control.',
        ],
      },
      {
        title: 'Retention and security',
        body: [
          'Operational information is kept only as long as reasonably needed for security, diagnostics, service measurement, and legal obligations. Published story records follow editorial retention rules. Connections are encrypted with HTTPS and database access stays restricted to the API service.',
        ],
      },
      {
        title: 'Your choices',
        body: [
          'You can reset local preferences at any time by clearing site or app storage. You may also contact us with privacy questions or a deletion request for information you believe can be linked to you.',
        ],
      },
    ],
  },
  terms: {
    id: 'terms',
    eyebrow: 'Terms',
    title: 'Terms of use',
    intro:
      'These terms apply when you access or use TazaKhabar. Continuing to use the service means you agree to them.',
    updated: '27 August 2026',
    sections: [
      {
        title: 'The service',
        body: [
          'TazaKhabar provides local news discovery, short summaries, reading tools, bookmarks, and links to original publisher reports. The service may change as city coverage expands.',
        ],
      },
      {
        title: 'Editorial accuracy',
        body: [
          'Some summaries and translations use automated language tools and may contain mistakes or omit context. For health, legal, financial, election, safety, or emergency information, verify the original source before relying on a summary.',
        ],
      },
      {
        title: 'Acceptable use',
        bullets: [
          'Do not overload, disrupt, or attempt to bypass service protections.',
          'Do not use the product in a way that violates law or another person rights.',
          'Do not present TazaKhabar summaries as your own reporting.',
          'Ordinary personal sharing through the app is welcome.',
        ],
      },
      {
        title: 'Publishers and intellectual property',
        body: [
          'Publisher names, article links, and third-party marks belong to their respective owners. TazaKhabar branding, software, and original product design belong to TazaKhabar or its licensors.',
          'Rights holders can use the corrections and takedown process to identify content and request review.',
        ],
      },
      {
        title: 'Availability and liability',
        body: [
          'We work to keep the service reliable, but cannot guarantee uninterrupted availability or equal coverage in every city. To the extent permitted by law, TazaKhabar is provided on an as-available basis.',
        ],
      },
    ],
  },
  support: {
    id: 'support',
    eyebrow: 'Support',
    title: 'Support',
    intro:
      'Tell us what happened with enough detail to reproduce it. Editorial concerns are reviewed through the corrections process.',
    sections: [
      {
        title: 'Before contacting us',
        bullets: [
          'Refresh the feed to request the latest stories.',
          'Confirm the correct city is selected inside the reader profile.',
          'Retry the action on a stable connection.',
          'If the installed web app behaves unexpectedly, reopen it in the browser once and test again.',
        ],
      },
      {
        title: 'Include these details',
        bullets: [
          'Your city and the page where the issue happened.',
          'What you expected and what happened instead.',
          'Device type, browser or app platform, and approximate time.',
          'A screenshot when it does not expose private information.',
        ],
      },
      {
        title: 'How to reach us',
        body: [
          supportEmail
            ? `Email ${supportEmail} with the details above. Avoid including passwords, payment information, or unnecessary personal data.`
            : 'The public support email is being finalized for launch. This page still sets the expected support process and the information we need in a request.',
        ],
      },
    ],
  },
  corrections: {
    id: 'corrections',
    eyebrow: 'Editorial standards',
    title: 'Corrections and takedown',
    intro:
      'We review clear reports about inaccurate summaries, attribution issues, publisher rights, privacy concerns, and urgent safety concerns.',
    updated: '27 August 2026',
    sections: [
      {
        title: 'What to send',
        bullets: [
          'The TazaKhabar headline and article link or article ID.',
          'The original publisher URL when available.',
          'A concise explanation of the issue or removal request.',
          'Supporting evidence or corrected information.',
          'Your relationship to the story or rights holder.',
        ],
      },
      {
        title: 'How we respond',
        body: [
          'We identify the stored story and source record first. Depending on the issue, we may correct the summary, update attribution, add context, archive the story, or remove it from public view while we investigate.',
          'Urgent safety, privacy, or rights concerns are prioritized. A request does not guarantee removal, but every sufficiently specific request is reviewed.',
        ],
      },
      {
        title: 'AI-assisted summaries',
        body: [
          'If an automated summary changes the meaning of an original report, tell us the exact sentence and the correct reading. We will compare it against the source and update or remove the summary as appropriate.',
        ],
      },
    ],
  },
}

const pageMeta: Record<PageId, { title: string; description: string }> = {
  home: {
    title: 'TazaKhabar — Your city. Clearly told.',
    description:
      'A calm local-news reader with city-specific updates, clear sourcing, and launch-ready public information.',
  },
  about: { title: 'About TazaKhabar', description: legalPages.about.intro },
  privacy: { title: 'Privacy policy — TazaKhabar', description: legalPages.privacy.intro },
  terms: { title: 'Terms of use — TazaKhabar', description: legalPages.terms.intro },
  support: { title: 'Support — TazaKhabar', description: legalPages.support.intro },
  corrections: {
    title: 'Corrections and takedown — TazaKhabar',
    description: legalPages.corrections.intro,
  },
}

const footerLinks: { id: Exclude<PageId, 'home'>; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'terms', label: 'Terms' },
  { id: 'support', label: 'Support' },
  { id: 'corrections', label: 'Corrections' },
]

function getPageFromPath(pathname: string): PageId {
  const trimmed = pathname.replace(/\/+$/, '') || '/'
  if (trimmed === '/') return 'home'
  const slug = trimmed.slice(1)
  if (slug in legalPages) return slug as Exclude<PageId, 'home'>
  return 'home'
}

function hrefFor(page: PageId) {
  return page === 'home' ? '/' : `/${page}`
}

function useCurrentPage() {
  const [page, setPage] = useState<PageId>(() => getPageFromPath(window.location.pathname))

  useEffect(() => {
    const onPop = () => setPage(getPageFromPath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return [page, setPage] as const
}

function usePageMeta(page: PageId) {
  useEffect(() => {
    const meta = pageMeta[page]
    document.title = meta.title
    const description = document.querySelector('meta[name="description"]')
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDescription = document.querySelector('meta[property="og:description"]')
    const ogUrl = document.querySelector('meta[property="og:url"]')
    const twitterTitle = document.querySelector('meta[name="twitter:title"]')
    const twitterDescription = document.querySelector('meta[name="twitter:description"]')
    if (description) description.setAttribute('content', meta.description)
    if (ogTitle) ogTitle.setAttribute('content', meta.title)
    if (ogDescription) ogDescription.setAttribute('content', meta.description)
    if (ogUrl) ogUrl.setAttribute('content', `${siteUrl}${hrefFor(page)}`)
    if (twitterTitle) twitterTitle.setAttribute('content', meta.title)
    if (twitterDescription) twitterDescription.setAttribute('content', meta.description)
  }, [page])
}

function navigate(next: PageId, setPage: (page: PageId) => void) {
  setPage(next)
  window.history.pushState({}, '', hrefFor(next))
}

function HomeView({ setPage }: { setPage: (page: PageId) => void }) {
  return (
    <>
      <section className="hero shell">
        <div className="hero-copy reveal">
          <p className="eyebrow"><span /> Local news, made readable</p>
          <h1>Your city. Clearly told.</h1>
          <p className="lede">
            TazaKhabar turns crowded local reporting into a cleaner daily read, with city-specific updates,
            visible sourcing, and zero account friction for readers.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href={readerUrl}>Read today&apos;s feed</a>
            <button className="button button-secondary" onClick={() => navigate('about', setPage)}>See how it works</button>
          </div>
          <p className="trust-line">No login required <i /> Publisher links included <i /> Designed for readable daily use</p>
        </div>

        <div className="hero-stage reveal reveal-delay">
          <div className="signal signal-top">
            <span>Built for daily reading</span>
            <strong>16px+</strong>
          </div>
          <div className="phone-card">
            <div className="phone-top">
              <span>TazaKhabar</span>
              <b>Delhi</b>
            </div>
            <div className="phone-alert"><span /> Fresh this morning</div>
            <article className="lead-card">
              <div className="lead-visual">
                <div className="sun" />
                <div className="road" />
              </div>
              <p>LOCAL BRIEF</p>
              <h2>The useful city update, without the usual clutter</h2>
              <small>2 min read · Source credited</small>
            </article>
            <div className="story-line">
              <div>
                <span>CITY</span>
                <h3>Know what changed before the day gets noisy</h3>
              </div>
              <b>01</b>
            </div>
            <div className="story-line">
              <div>
                <span>STATE</span>
                <h3>Plain-language summaries with the original link right there</h3>
              </div>
              <b>02</b>
            </div>
          </div>
          <div className="signal signal-bottom">
            <span>Launch surface</span>
            <strong>Web + mobile</strong>
          </div>
        </div>
      </section>

      <section className="proof shell">
        <div className="proof-intro">
          <p>Made for readers who want the update, not the maze around it.</p>
        </div>
        <div><strong>1 city</strong><span>chosen once, remembered locally</span></div>
        <div><strong>0 accounts</strong><span>needed for the MVP reader</span></div>
        <div><strong>Every story</strong><span>keeps attribution and original context</span></div>
      </section>

      <section className="story-layout shell">
        <div className="section-heading reveal">
          <p className="eyebrow"><span /> Product direction</p>
          <h2>A landing page that explains the product, not the app chrome</h2>
        </div>
        <div className="zig-grid">
          <article className="feature-card reveal">
            <p className="feature-kicker">01</p>
            <h3>Calm entry point</h3>
            <p>The public website gives launch context, trust signals, and formal pages without crowding the actual news-reading experience.</p>
          </article>
          <article className="feature-card feature-offset reveal reveal-delay">
            <p className="feature-kicker">02</p>
            <h3>Reader stays focused</h3>
            <p>The Expo app behaves like the product itself: city selection, feed, bookmarks, and profile, with public pages linked out instead of embedded.</p>
          </article>
          <article className="feature-card reveal">
            <p className="feature-kicker">03</p>
            <h3>Launch-ready formalities</h3>
            <p>Privacy, terms, support, and corrections live on their own URLs so links can be shared, indexed, and updated independently.</p>
          </article>
        </div>
      </section>

      <section className="operating-band">
        <div className="shell operating-grid">
          <div className="reveal">
            <p className="eyebrow"><span /> Editorial trust</p>
            <h2>Summaries are useful only when the source remains visible.</h2>
          </div>
          <div className="standards-card reveal reveal-delay">
            <ul>
              <li>Original publishers stay credited and linkable.</li>
              <li>AI-assisted summaries can be challenged and corrected.</li>
              <li>No raw publisher HTML is embedded in the public reader.</li>
              <li>Rights holders have a documented review path before launch.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="formalities shell">
        <div className="section-heading reveal">
          <p className="eyebrow"><span /> Formalities</p>
          <h2>Everything public-facing lives here</h2>
        </div>
        <div className="formalities-grid">
          {footerLinks.map((link) => (
            <button key={link.id} className="formal-card reveal" onClick={() => navigate(link.id, setPage)}>
              <span>{link.label}</span>
              <strong>{legalPages[link.id].title}</strong>
              <p>{legalPages[link.id].intro}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="closing shell reveal">
        <div>
          <p className="eyebrow"><span /> Launch</p>
          <h2>A proper TazaKhabar website, separate from the reader app.</h2>
        </div>
        <div className="closing-panel">
          <p>The reader stays at <code>newsfeed-web.pages.dev</code>. This site becomes the public brand and policy surface on its own subdomain.</p>
          <div className="hero-actions">
            <a className="button button-primary" href={readerUrl}>Open reader</a>
            <button className="button button-secondary" onClick={() => navigate('support', setPage)}>Support and contact</button>
          </div>
        </div>
      </section>
    </>
  )
}

function LegalView({
  page,
  setPage,
}: {
  page: LegalPage
  setPage: (page: PageId) => void
}) {
  const related = useMemo(() => footerLinks.filter((link) => link.id !== page.id), [page.id])
  const showContactCard = page.id === 'support' || page.id === 'corrections' || page.id === 'privacy'

  return (
    <section className="legal shell">
      <div className="legal-hero reveal">
        <p className="eyebrow"><span /> {page.eyebrow}</p>
        <h1 className="legal-title">{page.title}</h1>
        <p className="legal-intro">{page.intro}</p>
        {page.updated ? <p className="legal-date">Effective {page.updated}</p> : null}
      </div>

      <div className="legal-body">
        {page.sections.map((section, index) => (
          <article key={section.title} className="legal-section reveal">
            <div className="section-index">{String(index + 1).padStart(2, '0')}</div>
            <div>
              <h2>{section.title}</h2>
              {section.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="legal-rail reveal reveal-delay">
        {showContactCard ? (
          <div className="contact-card">
            <p className="feature-kicker">Contact</p>
            <h3>{supportEmail ? `Email ${supportEmail}` : 'Public support email is being finalized'}</h3>
            <p>
              {supportEmail
                ? 'Use this address for support, privacy questions, or editorial review requests.'
                : 'The launch site still renders a clear fallback until the final public inbox is configured.'}
            </p>
            {supportEmail ? <a className="button button-primary" href={`mailto:${supportEmail}`}>Email us</a> : null}
          </div>
        ) : null}
        <div className="related-card">
          <p className="feature-kicker">More</p>
          {related.map((link) => (
            <button key={link.id} className="related-link" onClick={() => navigate(link.id, setPage)}>
              <span>{link.label}</span>
              <strong>{legalPages[link.id].title}</strong>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export function App() {
  const [page, setPage] = useCurrentPage()

  usePageMeta(page)

  return (
    <main className="page-shell">
      <div className="bg-orb bg-orb-one" />
      <div className="bg-orb bg-orb-two" />
      <header className="topbar shell">
        <button className="brand" onClick={() => navigate('home', setPage)} aria-label="TazaKhabar home">
          <img src="/tazakhabar-mark.svg" alt="" />
          <span>TazaKhabar</span>
        </button>
        <nav className="topnav" aria-label="Primary">
          <button onClick={() => navigate('about', setPage)}>About</button>
          <button onClick={() => navigate('privacy', setPage)}>Privacy</button>
          <button onClick={() => navigate('support', setPage)}>Support</button>
        </nav>
        <a className="nav-cta" href={readerUrl}>Open reader</a>
      </header>

      {page === 'home' ? <HomeView setPage={setPage} /> : <LegalView page={legalPages[page]} setPage={setPage} />}

      <footer className="site-footer shell">
        <div>
          <p className="footer-kicker">TazaKhabar</p>
          <p className="footer-copy">A clearer way to check what changed in your city today.</p>
        </div>
        <div className="footer-links" aria-label="Footer">
          {footerLinks.map((link) => (
            <button key={link.id} onClick={() => navigate(link.id, setPage)}>{link.label}</button>
          ))}
          <a href={readerUrl}>Reader</a>
        </div>
      </footer>
    </main>
  )
}
