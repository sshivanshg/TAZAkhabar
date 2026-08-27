/**
 * Chrome/Edge Android fire this when the PWA meets install criteria.
 * Calling preventDefault + storing the event lets us show our own Install CTA
 * and open the native install dialog via prompt().
 */
export type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type PromptListener = (event: BeforeInstallPromptEventLike | null) => void

let deferred: BeforeInstallPromptEventLike | null = null
let listening = false
const listeners = new Set<PromptListener>()

function notify() {
  for (const listener of listeners) {
    listener(deferred)
  }
}

function ensureListening() {
  if (listening || typeof window === 'undefined') {
    return
  }
  listening = true

  window.addEventListener('beforeinstallprompt', ((event: Event) => {
    event.preventDefault()
    deferred = event as BeforeInstallPromptEventLike
    notify()
  }) as EventListener)

  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEventLike | null {
  ensureListening()
  return deferred
}

export function subscribeInstallPrompt(listener: PromptListener): () => void {
  ensureListening()
  listeners.add(listener)
  listener(deferred)
  return () => {
    listeners.delete(listener)
  }
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  ensureListening()
  const event = deferred
  if (!event) {
    return 'unavailable'
  }
  deferred = null
  notify()
  try {
    await event.prompt()
    const choice = await event.userChoice
    return choice.outcome
  } catch {
    return 'unavailable'
  }
}
