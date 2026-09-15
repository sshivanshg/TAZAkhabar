import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { applyPageSeo, hrefFor, type PageId } from './seo'

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

const readerUrl = import.meta.env.VITE_READER_URL || 'https://khabro.in/'
const siteUrl = import.meta.env.VITE_SITE_URL || 'https://site.khabro.in'
const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL || '').trim()

const legalPages: Record<Exclude<PageId, 'home'>, LegalPage> = {
  about: {
    id: 'about',
    eyebrow: 'About',
    title: 'Local news, presented with less noise and more clarity',
    intro:
      'Khabro is building a calm front door to city news for readers who want the important update quickly, clearly, and without account friction.',
    sections: [
      {
        title: 'Why this exists',
        body: [
          'Many local news websites are hard to read on a phone, heavy with pop-ups, or too cluttered for a quick daily check-in. Khabro turns that experience into a simpler city briefing.',
          'Readers choose a city once, open the feed, and get short summaries with source credit and a direct path to the original publisher when they want more context.',
        ],
      },
      {
        title: 'How stories are prepared',
        body: [
          'Khabro collects public publisher feeds, city pages, and editorial inputs. Summaries and translations may be assisted by language tooling before they are displayed in the reader.',
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
          'Khabro supports 75 major Indian cities. Story volume and source depth can differ between locations while direct publisher coverage expands.',
        ],
      },
    ],
  },
  privacy: {
    id: 'privacy',
    eyebrow: 'Privacy',
    title: 'Privacy policy',
    intro:
      'This policy explains what Khabro handles when you use the website or mobile reader.',
    updated: '27 August 2026',
    sections: [
      {
        title: 'Information saved on your device',
        body: [
          'Khabro does not require a reader account. Your city choice, appearance, reading language, bookmarks, blocked topics or sources, and a short-lived feed cache are stored on your device.',
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
        title: 'Optional location access',
        body: [
          'If you tap “Use my current location,” the reader asks for foreground location permission and uses the result once on your device to choose the nearest supported city. Your precise coordinates are not sent to or stored by Khabro.',
          'Location access is optional. If you decline, turn off location services, or the lookup fails, you can always search for and choose a city manually.',
        ],
      },
      {
        title: 'What we do not require',
        bullets: [
          'No reader account, password, or phone number.',
          'No mandatory GPS or precise location access for reading.',
          'No payment information.',
          'No contact, camera, or microphone access for ordinary reading.',
        ],
      },
      {
        title: 'External services and publisher links',
        body: [
          'Khabro uses infrastructure providers to deliver the API, website, and database. They process limited technical information on our behalf under their own security and retention practices.',
          'Opening an original article sends you to the publisher website. That destination has its own privacy policy and is outside Khabro control.',
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
          'You can deny or revoke location permission in your browser or device settings and choose a city manually. You can reset local preferences at any time by clearing site or app storage. You may also contact us with privacy questions or a deletion request for information you believe can be linked to you.',
        ],
      },
    ],
  },
  terms: {
    id: 'terms',
    eyebrow: 'Terms',
    title: 'Terms of use',
    intro:
      'These terms apply when you access or use Khabro. Continuing to use the service means you agree to them.',
    updated: '27 August 2026',
    sections: [
      {
        title: 'The service',
        body: [
          'Khabro provides local news discovery, short summaries, reading tools, bookmarks, and links to original publisher reports. The service may change as city coverage expands.',
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
          'Do not present Khabro summaries as your own reporting.',
          'Ordinary personal sharing through the app is welcome.',
        ],
      },
      {
        title: 'Publishers and intellectual property',
        body: [
          'Publisher names, article links, and third-party marks belong to their respective owners. Khabro branding, software, and original product design belong to Khabro or its licensors.',
          'Rights holders can use the corrections and takedown process to identify content and request review.',
        ],
      },
      {
        title: 'Availability and liability',
        body: [
          'We work to keep the service reliable, but cannot guarantee uninterrupted availability or equal coverage in every city. To the extent permitted by law, Khabro is provided on an as-available basis.',
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
          'The Khabro headline and article link or article ID.',
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

const footerLinks: { id: Exclude<PageId, 'home'>; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'terms', label: 'Terms' },
  { id: 'support', label: 'Support' },
  { id: 'corrections', label: 'Corrections' },
]

const categories = [
  { label: 'India', text: 'Policy, public services, elections, and the civic changes that shape daily life.' },
  { label: 'World', text: 'Global events explained through the lens of what changes for Indian readers.' },
  { label: 'Business', text: 'Company moves, consumer prices, jobs, and local economy signals.' },
  { label: 'Technology', text: 'Startups, platforms, policy, and useful digital shifts without hype.' },
  { label: 'Sports', text: 'The result, the turning point, and what to watch next.' },
  { label: 'Culture', text: 'Entertainment, festivals, civic life, and the softer pulse of the city.' },
]

const demoTabs = [
  {
    label: 'Quick brief',
    title: 'RBI keeps policy rate unchanged, flags food inflation risk',
    body: 'The decision keeps borrowing conditions stable for now, while households may still feel pressure from food prices.',
    meta: '2 min read',
  },
  {
    label: 'Context',
    title: 'Why it matters',
    body: 'Banks often price loans from this signal. A pause can help borrowers plan, but inflation commentary still affects market expectations.',
    meta: 'Plain-language background',
  },
  {
    label: 'Timeline',
    title: 'What changed today',
    body: 'Morning statement, market reaction by noon, and expected follow-up comments from banks and economists through the week.',
    meta: 'Updated as the story moves',
  },
  {
    label: 'Sources',
    title: 'Original reporting stays visible',
    body: 'Khabro keeps publisher attribution attached so readers can check the original article whenever they want more detail.',
    meta: 'Source credited',
  },
]

function getPageFromPath(pathname: string): PageId {
  const trimmed = pathname.replace(/\/+$/, '') || '/'
  if (trimmed === '/') return 'home'
  const slug = trimmed.slice(1)
  if (slug in legalPages) return slug as Exclude<PageId, 'home'>
  return 'home'
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
    applyPageSeo(page, siteUrl, readerUrl)
  }, [page])
}

function navigate(next: PageId, setPage: (page: PageId) => void) {
  setPage(next)
  window.history.pushState({}, '', hrefFor(next))
}

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0
}

function NavLink({
  page,
  setPage,
  children,
  className,
  currentPage,
  'aria-label': ariaLabel,
}: {
  page: PageId
  setPage: (page: PageId) => void
  children: ReactNode
  className?: string
  currentPage?: PageId
  'aria-label'?: string
}) {
  return (
    <a
      href={hrefFor(page)}
      className={className}
      aria-label={ariaLabel}
      aria-current={currentPage === page ? 'page' : undefined}
      onClick={(event) => {
        if (isModifiedClick(event)) return
        event.preventDefault()
        navigate(page, setPage)
      }}
    >
      {children}
    </a>
  )
}

function NewsStack() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  function handlePointerMove(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -10
    setTilt({ x, y })
  }

  const style = {
    '--tilt-x': `${tilt.y}deg`,
    '--tilt-y': `${tilt.x}deg`,
  } as CSSProperties

  return (
    <div
      className="news-stack"
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      aria-label="Layered Khabro news interface preview"
    >
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <article className="stack-card stack-card-primary">
        <div className="stack-topline">
          <span>Live brief</span>
          <strong>Delhi</strong>
        </div>
        <h2>Metro timing changes begin from Monday</h2>
        <p>The useful update, why it matters for commuters, and the original source in one calm view.</p>
        <div className="brief-block">
          <span>Why it matters</span>
          <p>Peak-hour riders should plan an extra 12 minutes on two interchange-heavy routes.</p>
        </div>
        <div className="source-row">
          <span>Source credited</span>
          <span>2 min read</span>
        </div>
      </article>
      <article className="stack-card stack-card-back stack-card-india">
        <span>India</span>
        <strong>Policy brief</strong>
      </article>
      <article className="stack-card stack-card-back stack-card-tech">
        <span>Technology</span>
        <strong>Startup update</strong>
      </article>
      <article className="stack-card stack-card-back stack-card-sports">
        <span>Sports</span>
        <strong>Match context</strong>
      </article>
      <div className="signal-node signal-node-one">National</div>
      <div className="signal-node signal-node-two">World</div>
      <div className="signal-node signal-node-three">Markets</div>
    </div>
  )
}

function HomeView({ setPage }: { setPage: (page: PageId) => void }) {
  const [activeDemo, setActiveDemo] = useState(0)
  const demo = demoTabs[activeDemo]

  return (
    <>
      <section className="hero shell" id="home">
        <div className="hero-copy reveal">
          <p className="status-pill"><span /> News, without the noise</p>
          <h1>Understand what&apos;s happening. Without reading everything.</h1>
          <p className="lede">
            Khabro turns crowded reporting into a calmer daily briefing for Indian cities, with short
            summaries, visible sourcing, and context that respects your time.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href={readerUrl}>Explore Khabro</a>
            <a className="button button-secondary" href="#how-it-works">See how it works</a>
          </div>
          <p className="trust-line">No reader login <i /> City-first updates <i /> Publisher attribution preserved</p>
        </div>

        <div className="hero-stage reveal reveal-delay">
          <NewsStack />
        </div>
      </section>

      <section className="proof shell" aria-label="Khabro product commitments">
        <div className="proof-intro reveal">
          <p>A modern operating system for understanding what changed around you.</p>
        </div>
        <div className="reveal"><strong>75</strong><span>Indian cities in the launch catalog</span></div>
        <div className="reveal"><strong>0</strong><span>reader accounts needed for the MVP</span></div>
        <div className="reveal"><strong>1 tap</strong><span>to share a useful brief on WhatsApp</span></div>
      </section>

      <section className="story-layout shell" id="why">
        <div className="section-heading reveal">
          <p className="eyebrow"><span /> Why Khabro exists</p>
          <h2>Too much news. Too little understanding.</h2>
          <p>
            Traditional news homepages ask readers to do the work: sort repeated headlines,
            dodge clutter, compare sources, and guess what actually matters.
          </p>
        </div>
        <div className="friction-grid">
          <article className="feature-card reveal">
            <p className="feature-kicker">01</p>
            <h3>Information overload</h3>
            <p>Important updates are mixed with repetition, pop-ups, and low-value noise.</p>
          </article>
          <article className="feature-card feature-offset reveal reveal-delay">
            <p className="feature-kicker">02</p>
            <h3>Missing context</h3>
            <p>A headline tells you what happened, but rarely what changed for your day.</p>
          </article>
          <article className="feature-card reveal">
            <p className="feature-kicker">03</p>
            <h3>Endless scrolling</h3>
            <p>Readers lose time moving between stories that say nearly the same thing.</p>
          </article>
        </div>
      </section>

      <section className="clarity-band">
        <div className="shell clarity-grid">
          <div className="reveal">
            <p className="eyebrow"><span /> The Khabro method</p>
            <h2>Khabro turns information into clarity.</h2>
          </div>
          <p className="reveal reveal-delay">
            The reader keeps the daily experience simple: choose your city, scan the important
            updates, open context when you need it, and share clean summaries without sending
            people into a cluttered maze.
          </p>
        </div>
      </section>

      <section className="how shell" id="how-it-works">
        <div className="section-heading reveal">
          <p className="eyebrow"><span /> How it works</p>
          <h2>Three quiet steps from update to understanding.</h2>
        </div>
        <div className="workflow">
          <article className="workflow-step reveal">
            <span>01</span>
            <h3>Discover</h3>
            <p>Khabro watches city, state, national, and topic sources so readers do not start from a blank search box.</p>
          </article>
          <article className="workflow-step reveal reveal-delay">
            <span>02</span>
            <h3>Understand</h3>
            <p>Stories become concise briefs with plain context, source links, and the next thing to watch.</p>
          </article>
          <article className="workflow-step reveal">
            <span>03</span>
            <h3>Stay updated</h3>
            <p>Readers return to a local feed that remembers their city and stays readable on mobile.</p>
          </article>
        </div>
      </section>

      <section className="demo shell" id="demo">
        <div className="demo-copy reveal">
          <p className="eyebrow"><span /> Product preview</p>
          <h2>One story, four useful ways to read it.</h2>
          <p>
            Khabro is designed for the moment after a headline catches your eye:
            the quick version, the context, the timeline, and the original source.
          </p>
          <div className="demo-tabs" role="tablist" aria-label="Product preview modes">
            {demoTabs.map((tab, index) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={activeDemo === index}
                onClick={() => setActiveDemo(index)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <article className="demo-panel reveal reveal-delay">
          <div className="demo-phone-top">
            <span>Khabro</span>
            <strong>Business</strong>
          </div>
          <p className="feature-kicker">{demo.label}</p>
          <h3>{demo.title}</h3>
          <p>{demo.body}</p>
          <div className="source-row">
            <span>{demo.meta}</span>
            <span>Original source</span>
          </div>
        </article>
      </section>

      <section className="categories shell" id="categories">
        <div className="section-heading reveal">
          <p className="eyebrow"><span /> Coverage</p>
          <h2>Designed for the full shape of a reader&apos;s day.</h2>
        </div>
        <div className="category-board">
          {categories.map((category, index) => (
            <article key={category.label} className={`category-tile category-${index + 1} reveal`}>
              <span>{category.label}</span>
              <p>{category.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="personal shell">
        <div className="personal-card reveal">
          <p className="eyebrow"><span /> Personal news</p>
          <h2>Your news. Your priorities.</h2>
          <p>
            Start with a city, then follow the topics that matter at home: local civic updates,
            business, health, education, markets, sports, and the stories relatives will ask about.
          </p>
        </div>
        <div className="preference-panel reveal reveal-delay">
          {['Delhi', 'Health', 'Startups', 'Cricket', 'Markets'].map((item) => (
            <span key={item}>{item}</span>
          ))}
          <div>
            <strong>Readable by default</strong>
            <p>Large type, calm contrast, and simple choices for the 40+ reader Khabro is built around.</p>
          </div>
        </div>
      </section>

      <section className="trust shell">
        <div className="section-heading reveal">
          <p className="eyebrow"><span /> Trust and formalities</p>
          <h2>Useful summaries still need visible standards.</h2>
          <p>
            The public site keeps launch context, privacy, terms, support, and corrections separate
            from the reader so these pages stay shareable and crawlable.
          </p>
        </div>
        <div className="formalities-grid">
          {footerLinks.map((link) => (
            <NavLink key={link.id} className="formal-card reveal" page={link.id} setPage={setPage}>
              <span>{link.label}</span>
              <strong>{legalPages[link.id].title}</strong>
              <p>{legalPages[link.id].intro}</p>
            </NavLink>
          ))}
        </div>
      </section>

      <section className="closing shell reveal">
        <div>
          <p className="eyebrow"><span /> Launch</p>
          <h2>Open the reader and check today&apos;s city briefing.</h2>
        </div>
        <div className="closing-panel">
          <p>The reader stays at <code>khabro.in</code>. This site tells the product story and hosts the public trust pages.</p>
          <div className="hero-actions">
            <a className="button button-primary" href={readerUrl}>Open reader</a>
            <NavLink className="button button-secondary" page="support" setPage={setPage}>Support and contact</NavLink>
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
            <NavLink key={link.id} className="related-link" page={link.id} setPage={setPage}>
              <span>{link.label}</span>
              <strong>{legalPages[link.id].title}</strong>
            </NavLink>
          ))}
        </div>
      </div>
    </section>
  )
}

export function App() {
  const [page, setPage] = useCurrentPage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  usePageMeta(page)

  const closeMenu = (next: PageId) => {
    setIsMenuOpen(false)
    setPage(next)
  }

  return (
    <main className="page-shell">
      <a className="skip-link" href="#home">Skip to content</a>
      <header className="topbar shell">
        <NavLink className="brand" page="home" setPage={closeMenu} currentPage={page} aria-label="Khabro home">
          <img src="/khabro-mark.svg" alt="" />
          <span>Khabro</span>
        </NavLink>
        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
        <nav className={`topnav ${isMenuOpen ? 'topnav-open' : ''}`} aria-label="Primary">
          <a href="#home" onClick={() => setIsMenuOpen(false)}>Home</a>
          <a href="#demo" onClick={() => setIsMenuOpen(false)}>Latest</a>
          <a href="#categories" onClick={() => setIsMenuOpen(false)}>India</a>
          <a href="#categories" onClick={() => setIsMenuOpen(false)}>World</a>
          <a href="#categories" onClick={() => setIsMenuOpen(false)}>Business</a>
          <a href="#categories" onClick={() => setIsMenuOpen(false)}>Technology</a>
          <a href="#categories" onClick={() => setIsMenuOpen(false)}>Sports</a>
          <NavLink page="about" setPage={closeMenu} currentPage={page}>About</NavLink>
        </nav>
        <a className="nav-cta" href={readerUrl}>Open reader</a>
      </header>

      {page === 'home' ? <HomeView setPage={setPage} /> : <LegalView page={legalPages[page]} setPage={setPage} />}

      <footer className="site-footer shell">
        <div>
          <p className="footer-kicker">Khabro</p>
          <p className="footer-copy">A clearer way to check what changed in your city today.</p>
        </div>
        <div className="footer-links" aria-label="Footer">
          {footerLinks.map((link) => (
            <NavLink key={link.id} page={link.id} setPage={setPage}>{link.label}</NavLink>
          ))}
          <a href={readerUrl}>Reader</a>
        </div>
      </footer>
    </main>
  )
}
