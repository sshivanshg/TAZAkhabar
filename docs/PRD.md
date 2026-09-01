Product Requirements Document
Localized News Digest App

1. Problem Statement

People consume daily news through cluttered, ad-heavy newspaper sites and apps that are optimized for young, mobile-native users. There is no product that combines:

Short, digestible daily news summaries
Deep localization down to city/neighborhood level
A simple, low-friction experience designed for readers above 40
An ad-free (or low-ad) reading experience
Easy one-tap sharing to WhatsApp, where most Indian news is actually redistributed informally
2. Goal / Vision
Build a localized news digest platform that delivers short, city-specific news summaries to readers, starting with an underserved 40+ demographic, distributed initially through offline QR-code outreach rather than app-store discovery alone.
3. Target Users
Primary persona: Reader aged 40+, in a tier-2/tier-3 Indian city, currently reads a physical or digital local newspaper, moderately comfortable with smartphones and WhatsApp, values simplicity and low clutter over rich features.

Secondary persona (later): Younger relatives (20s-30s) who install it for their parents, or who share it forward.
4. Market Context (Competitive Landscape)
Product
Strength
Gap we can exploit
Inshorts
60-word summaries, huge scale, one-tap share
Not localized to city/ward level; UX skews younger
Way2News
Strong hyperlocal + vernacular coverage
Ad-heavy-ish UX, not designed for 40+ readability
Dailyhunt
Broad free coverage
Very ad-heavy, cluttered
TheReader.AI
Ad-free, AI-summarized, regional depth
Modern minimalist UX still not tailored to older readers; app-only discovery

Differentiation: (1) UX explicitly designed for 40+ readability (larger text, simple nav, minimal decision fatigue), (2) hyperlocal below city level where possible, (3) offline-to-online acquisition via QR flyers, (4) ad-light/ad-free positioning.
5. Scope — MVP (Phase 1)
5.1 In Scope
Web app (mobile-responsive), used as the MVP surface before native app
Coverage: India-wide catalog of 75 major cities, seeded with a city-specific discovery RSS source; deepen publisher coverage city by city
Content sourced via RSS (where available) from local newspapers, or direct partnership with 1-2 local outlets per pilot city
Original short-form summaries for RSS/PDF (Claude); scrape stores an OpenAI-rewritten digest (summary + body) with source attribution and link-back (falls back to extracted plain text when rewrite is unavailable)
City selection on first use with an optional, explicit foreground-location permission to detect the nearest supported city; searchable manual selection always remains available
Feed view: headline + 2-4 line summary + source attribution; tap opens an in-app swipe reader (full body when stored)
Share button → WhatsApp (deep link / share intent)
Basic categories: Local, State, National (optional), a couple of interest tags (e.g. Business, Health)
Simple onboarding flow optimized for low digital literacy
QR code landing page for the flyer campaign (tracks scan → install/visit conversion)
- Opt-in city alerts for breaking news across web/PWA/native, with a respectful prompt that backs off after dismissal or denial
5.2 Out of Scope (Phase 1)
Native mobile app (React Native build comes Phase 2, once web MVP validates demand)
Personalized ML-based recommendation engine
User accounts / login (consider anonymous + local-storage preference for MVP; login can come later)
Comments, social features, user-generated content
Paid subscriptions / paywall
Audio/video news formats
6. Core User Flows
First visit (via QR scan): Land on web app → optionally detect nearest city or select one manually → land on localized feed → no login required
Daily use: Open app/bookmark → scroll short summaries → tap to read in the swipe reader (full extracted text when stored) → tap share → send to WhatsApp
QR flyer flow: Printed flyer dropped at home → scan QR → lands on mobile web view → optionally prompted to "Add to Home Screen" (PWA-style) instead of a full native install for MVP
7. Functional Requirements
ID
Requirement
Priority
FR-1
System ingests articles via RSS/scraping pipeline per source, tagged by city
Must
FR-2
System generates a short original summary for RSS/PDF (review queue). Scrape rewrites extracted content via OpenAI into an original digest summary + body (auto-published; falls back to extract on failure).
Must
FR-3
User can select/change their city on the web app
Must
FR-3A
User can explicitly grant one-time foreground location access to select the nearest supported city; denial, timeout, or unavailable services must fall back to manual selection and raw coordinates must not be sent to the API
Must
FR-4
Feed displays summaries newest-first, filterable by city
Must
FR-5
User can tap "Share" to send a formatted summary + link to WhatsApp
Must
FR-6
Each summary links back to original source article
Must
FR-7
QR landing page logs scan source (flyer batch/location) for attribution
Should
FR-8
Readability mode: adjustable text size, high-contrast option
Should
FR-9
Basic admin panel for content team to review/edit/publish summaries before they go live
Must
FR-10
Search by keyword/locality within the app
Could

1. Non-Functional Requirements

Performance: Feed loads in under 2 seconds on 4G
Accessibility: Large tap targets, minimum 16px base font, WCAG AA contrast — critical given the 40+ target audience
Reliability: Content pipeline must handle source site downtime/layout changes gracefully (fallback/error logging, not a broken feed)
Legal/Compliance: Always attribute and link to source; maintain a takedown process if a publisher objects. Scrape stores plain-text digests (OpenAI rewrite or extracted body from already-fetched HTML — never raw HTML). RSS/PDF remain digest-first with editorial review.
- Permission UX: notification prompts should be calm and non-coercive; do not keep re-requesting after the user says no.
9. Content Sourcing & Legal Notes
Prioritize sources with public RSS feeds
For sources without RSS, scrape list pages and store extracted plain text for in-app reading; keep a takedown process
RSS/PDF summaries are independently written (Claude); scrape digests are independently rewritten (OpenAI) from extracted plain text, with extract fallback when rewrite is off or fails
Keep an editorial log of source-to-article mapping in case of publisher disputes
10. Tech Stack (as decided)
Frontend (MVP): Web app, mobile-responsive (PWA-capable for "Add to Home Screen" flow)
Frontend (Phase 2): React Native for native iOS/Android
Backend: C# (.NET)
Content pipeline: RSS ingestion + summarization service + manual review queue
11. Go-to-Market — Phase 1 Distribution
Print QR-code flyers, distribute door-to-door / via local vendors in pilot city neighborhoods
Each flyer batch tagged with a unique QR/UTM for attribution tracking
Track scan → landing → return-visit conversion as core early metric
12. Success Metrics (MVP)
Metric
Target (illustrative — set real target after pilot sizing)
QR scan → active user conversion
TBD post-pilot
Weekly return rate (readers coming back 3+ days/week)
TBD post-pilot
WhatsApp shares per user per week
TBD post-pilot
Summary accuracy / editorial complaint rate
Near zero tolerance

(Fill in real target numbers once pilot city sizing and flyer budget are decided — flagging these as placeholders rather than guessing numbers for you.)
13. Open Questions
Which city clusters should receive direct publisher partnerships first beyond the seeded discovery feeds?
Is any local publisher partnership already in conversation, or all still cold outreach?
PWA "Add to Home Screen" vs. pushing straight to a native app for MVP — which does the team prefer, given the audience's comfort level with browser vs. app installs?
Anonymous usage vs. lightweight signup (e.g. phone number) for MVP — affects ability to re-engage users and measure retention
Monetization plan post-MVP (ads, subscription, sponsored local content, or purely acquisition-for-later-model)?
14. Milestones (Draft)
Phase
Deliverable
Phase 0
Launch 75-city catalog, location-assisted selection, and baseline discovery feeds; define source-quality monitoring by city
Phase 1
Deepen first-party/local publisher coverage in priority city clusters; keep QR flyer pilots measurable by city
Phase 2
Expand flyer distribution based on Phase 1 conversion data
Phase 3
React Native native app build, based on validated web demand
Phase 4
Formal publisher partnerships, expand city count
