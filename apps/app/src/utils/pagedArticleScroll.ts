/** Eased page-to-page duration for the article reader (CSS snap is much faster). */
export const ARTICLE_PAGE_TRANSITION_MS = 700

export function pageTransitionDuration(reducedMotion: boolean): number {
  return reducedMotion ? 0 : ARTICLE_PAGE_TRANSITION_MS
}

export function nextPageIndex(
  currentOffset: number,
  pageHeight: number,
  direction: 1 | -1,
  pageCount: number,
): number {
  if (pageHeight <= 0 || pageCount <= 0) {
    return 0
  }
  const current = Math.round(currentOffset / pageHeight)
  return Math.max(0, Math.min(pageCount - 1, current + direction))
}

export function easeInOutCubic(t: number): number {
  if (t <= 0) {
    return 0
  }
  if (t >= 1) {
    return 1
  }
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

type WheelLike = {
  deltaY: number
  target: unknown
  preventDefault: () => void
}

type WebScrollElement = {
  scrollTop: number
  clientHeight: number
  scrollHeight: number
  style: { scrollSnapType: string }
  addEventListener: (
    type: string,
    listener: (event: WheelLike) => void,
    options?: { passive?: boolean },
  ) => void
  removeEventListener: (type: string, listener: (event: WheelLike) => void) => void
  querySelectorAll?: (selector: string) => ArrayLike<WebScrollElement & { style: { overflowY?: string } }>
}

type AttachOptions = {
  getPageHeight: () => number
  getPageCount: () => number
  reducedMotion?: boolean
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isScrollable(el: { scrollHeight: number; clientHeight: number }): boolean {
  return el.scrollHeight > el.clientHeight + 8
}

function innerCanConsumeWheel(target: unknown, deltaY: number): boolean {
  if (!target || typeof target !== 'object' || !('closest' in target)) {
    return false
  }
  const inner = (
    target as { closest: (selector: string) => WebScrollElement | null }
  ).closest('[data-testid="article-inner-scroll"]')
  if (!inner || !isScrollable(inner)) {
    return false
  }
  if (deltaY > 0) {
    return inner.scrollTop + inner.clientHeight < inner.scrollHeight - 1
  }
  return inner.scrollTop > 1
}

function animateScrollTo(
  el: WebScrollElement,
  to: number,
  duration: number,
  onDone: () => void,
): () => void {
  const from = el.scrollTop
  const delta = to - from
  if (delta === 0 || duration <= 0) {
    el.scrollTop = to
    onDone()
    return () => {}
  }

  let frame = 0
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    el.scrollTop = from + delta * easeInOutCubic(t)
    if (t < 1) {
      frame = requestAnimationFrame(tick)
    } else {
      onDone()
    }
  }
  frame = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(frame)
}

/**
 * Wheel/trackpad paging with a slower ease than CSS scroll-snap.
 * Touch still uses native snap; inner article overflow still scrolls first.
 */
export function attachWebArticlePaging(
  el: WebScrollElement,
  options: AttachOptions,
): () => void {
  let locked = false
  let cancel = () => {}
  const previousSnap = el.style.scrollSnapType

  const onWheel = (event: WheelLike) => {
    if (innerCanConsumeWheel(event.target, event.deltaY)) {
      return
    }
    event.preventDefault()
    if (locked || Math.abs(event.deltaY) < 10) {
      return
    }

    const pageHeight = options.getPageHeight()
    const pageCount = options.getPageCount()
    const next = nextPageIndex(
      el.scrollTop,
      pageHeight,
      event.deltaY > 0 ? 1 : -1,
      pageCount,
    )
    const target = next * pageHeight
    if (Math.abs(target - el.scrollTop) < 2) {
      return
    }

    locked = true
    el.style.scrollSnapType = 'none'
    const duration = pageTransitionDuration(
      options.reducedMotion ?? prefersReducedMotion(),
    )
    cancel = animateScrollTo(el, target, duration, () => {
      el.style.scrollSnapType = previousSnap
      locked = false
    })
  }

  el.addEventListener('wheel', onWheel, { passive: false })
  return () => {
    cancel()
    el.removeEventListener('wheel', onWheel)
    el.style.scrollSnapType = previousSnap
  }
}
