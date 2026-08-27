export type PublicPageId = 'about' | 'privacy' | 'terms' | 'support' | 'corrections'

export type PublicPageSection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

export type PublicPage = {
  id: PublicPageId
  eyebrow: string
  title: string
  intro: string
  updated?: string
  sections: PublicPageSection[]
}

export const PUBLIC_PAGES: Record<PublicPageId, PublicPage> = {
  about: {
    id: 'about',
    eyebrow: 'About TazaKhabar',
    title: 'Local news, made easier to read',
    intro:
      'TazaKhabar brings short, city-specific news summaries into a calm, readable experience built for everyday use.',
    sections: [
      {
        title: 'Why we built it',
        paragraphs: [
          'Local news matters, but many newspaper websites are crowded, slow, or difficult to use on a phone. TazaKhabar helps readers find the important stories from their city without an account, a paywall, or a complicated setup.',
          'Choose a city once, read the latest summaries, save useful stories on your device, and share them with family through the share sheet or WhatsApp.',
        ],
      },
      {
        title: 'How stories are prepared',
        paragraphs: [
          'We collect stories from public publisher feeds, city pages, and editorial uploads. Summaries may be assisted by automated language tools, then handled according to the source workflow. Publisher attribution and a link to the original report remain attached to every story.',
          'Automated summaries can make mistakes. The original publisher report is the reference, and readers can send us a correction request whenever something looks wrong.',
        ],
      },
      {
        title: 'Our reader commitments',
        bullets: [
          'No reader login for the current service.',
          'Readable text, large tap targets, and a low-clutter interface.',
          'Clear publisher attribution and links to original reports.',
          'No raw publisher HTML embedded inside the reader.',
          'A visible process for corrections, rights concerns, and takedown requests.',
        ],
      },
      {
        title: 'Coverage',
        paragraphs: [
          'TazaKhabar is in an early city-by-city rollout. Coverage and story volume can differ by location while we validate sources and build publisher relationships.',
        ],
      },
    ],
  },
  privacy: {
    id: 'privacy',
    eyebrow: 'Privacy',
    title: 'Privacy policy',
    intro:
      'This policy explains what information TazaKhabar handles when you use the website or mobile application.',
    updated: '27 August 2026',
    sections: [
      {
        title: 'Information saved on your device',
        paragraphs: [
          'TazaKhabar does not require a reader account. Your selected city, appearance, reading language, bookmarks, blocked topics or sources, and a short-lived feed cache are stored on your device so the service can remember your preferences.',
          'You can remove this local information by clearing the site or app storage, or by uninstalling the application.',
        ],
      },
      {
        title: 'Information processed by our service',
        paragraphs: [
          'When the app requests news, our infrastructure may receive standard technical information such as an IP address, request time, requested route, device or browser information, and a request identifier used for reliability and security logs.',
          'When you open a story, the app may send a randomly generated device-local session identifier with the article view. We use this to reduce duplicate counts and understand which local stories are useful. It is not tied to a name, phone number, or reader account.',
        ],
      },
      {
        title: 'What we do not request',
        bullets: [
          'No reader account, password, or phone number.',
          'No GPS or precise location permission; you choose a city manually.',
          'No payment information.',
          'No access to contacts, camera, or microphone for ordinary reading.',
        ],
      },
      {
        title: 'Service providers and external links',
        paragraphs: [
          'We use infrastructure providers to deliver the website, API, and database. Those providers process limited technical data on our behalf under their own security and retention practices.',
          'Stories link to publisher websites. When you open an original report, that publisher receives your request and its own privacy policy applies. TazaKhabar does not control publisher websites.',
        ],
      },
      {
        title: 'Retention and security',
        paragraphs: [
          'We retain operational information only for as long as it is reasonably needed for security, diagnostics, service measurement, and legal obligations. Published story records are subject to our editorial retention rules. We use encrypted HTTPS connections and restrict database access to the API service.',
        ],
      },
      {
        title: 'Your choices',
        paragraphs: [
          'You can reset device-local preferences at any time by clearing site or app storage. You may also contact us to ask about privacy, request deletion of information you believe can be linked to you, or raise a concern about a story.',
        ],
      },
      {
        title: 'Changes to this policy',
        paragraphs: [
          'We may update this policy as the product changes. The current effective date will remain visible on this page.',
        ],
      },
    ],
  },
  terms: {
    id: 'terms',
    eyebrow: 'Terms',
    title: 'Terms of use',
    intro:
      'These terms apply when you access or use TazaKhabar. By continuing to use the service, you agree to them.',
    updated: '27 August 2026',
    sections: [
      {
        title: 'The service',
        paragraphs: [
          'TazaKhabar provides local news discovery, short summaries, reading tools, bookmarks, and links to original publisher reports. The service is currently offered without a reader account and may change as city coverage expands.',
        ],
      },
      {
        title: 'Editorial accuracy',
        paragraphs: [
          'Some summaries and translations use automated language tools and may contain errors or omit context. TazaKhabar is not the original publisher of linked reports. Check the original source before relying on a story, particularly for health, legal, financial, safety, election, or emergency information.',
        ],
      },
      {
        title: 'Acceptable use',
        bullets: [
          'Do not disrupt, overload, scrape excessively, or attempt to bypass security controls.',
          'Do not use the service to violate law or another person’s rights.',
          'Do not misrepresent TazaKhabar summaries as your own original reporting.',
          'Ordinary personal sharing through the app is welcome.',
        ],
      },
      {
        title: 'Publishers and intellectual property',
        paragraphs: [
          'Publisher names, article links, and third-party marks belong to their respective owners. TazaKhabar’s product design, software, and original branding belong to TazaKhabar or its licensors.',
          'Rights holders can use our corrections and takedown process to identify content and explain the requested action.',
        ],
      },
      {
        title: 'Availability and external services',
        paragraphs: [
          'We work to keep the service reliable, but do not guarantee uninterrupted availability or that every city will have the same volume of news. External publisher links and services are outside our control.',
        ],
      },
      {
        title: 'Liability',
        paragraphs: [
          'To the extent permitted by law, TazaKhabar is provided on an “as available” basis. We are not responsible for decisions made solely from a summary, losses caused by unavailable external services, or content on publisher websites.',
        ],
      },
      {
        title: 'Changes and contact',
        paragraphs: [
          'We may update these terms as the service changes. Material updates will be reflected by the effective date. Contact support if you have questions about these terms.',
        ],
      },
    ],
  },
  support: {
    id: 'support',
    eyebrow: 'Help',
    title: 'Support',
    intro:
      'Tell us what went wrong and include enough detail for us to reproduce it. We will route editorial concerns through the corrections process.',
    sections: [
      {
        title: 'Before contacting us',
        bullets: [
          'Pull down on the Home feed to request the latest stories.',
          'Confirm the correct city is selected under Profile.',
          'Check your connection and retry the action.',
          'If the installed web app behaves unexpectedly, reopen it in the browser and try again.',
        ],
      },
      {
        title: 'Include these details',
        bullets: [
          'Your city and the page where the issue occurred.',
          'What you expected and what happened instead.',
          'Device type, browser or app platform, and approximate time.',
          'A screenshot when it does not expose private information.',
        ],
      },
      {
        title: 'Story corrections or rights concerns',
        paragraphs: [
          'Use the Corrections & takedown page for an inaccurate summary, incorrect attribution, copyright concern, publisher request, or removal request.',
        ],
      },
    ],
  },
  corrections: {
    id: 'corrections',
    eyebrow: 'Editorial standards',
    title: 'Corrections & takedown',
    intro:
      'We review clear reports about inaccurate summaries, source attribution, publisher rights, privacy, and safety.',
    updated: '27 August 2026',
    sections: [
      {
        title: 'What to send',
        bullets: [
          'The TazaKhabar headline and article link or numeric article ID.',
          'The original publisher link, if available.',
          'A concise explanation of what is inaccurate or why removal is requested.',
          'Supporting evidence or the corrected information.',
          'Your relationship to the story or rights holder.',
        ],
      },
      {
        title: 'How we respond',
        paragraphs: [
          'We first identify the stored story and its source record. Depending on the issue, we may correct the summary, update attribution, add context, archive the story, or remove it from public view while we investigate.',
          'Urgent safety, privacy, or rights concerns are prioritized. A request does not guarantee removal when the material is lawful, properly attributed, and in the public interest, but every sufficiently specific request will be reviewed.',
        ],
      },
      {
        title: 'Publisher requests',
        paragraphs: [
          'Publishers and authorized representatives should identify the publication, provide a business contact, and include the affected URLs. We may ask for reasonable verification before changing or removing content.',
        ],
      },
      {
        title: 'AI-assisted summaries',
        paragraphs: [
          'If an automated summary changes the meaning of an original report, tell us the exact sentence and the correct reading. We will compare it with the source and update or remove the summary as appropriate.',
        ],
      },
    ],
  },
}

export const PUBLIC_PAGE_LINKS: { id: PublicPageId; label: string; href: `/${PublicPageId}` }[] = [
  { id: 'about', label: 'About', href: '/about' },
  { id: 'privacy', label: 'Privacy', href: '/privacy' },
  { id: 'terms', label: 'Terms', href: '/terms' },
  { id: 'support', label: 'Support', href: '/support' },
  { id: 'corrections', label: 'Corrections', href: '/corrections' },
]
