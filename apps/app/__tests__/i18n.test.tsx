import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react-native'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}))
jest.mock('@gluestack-ui/themed', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Text: ({ children, ...props }: { children?: ReactNode }) =>
      React.createElement(Text, props, children),
  }
})
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  Stack: { Screen: () => null },
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

import ContactScreen from '../app/contact'
import { en } from '../src/i18n/en'
import { hi } from '../src/i18n/hi'
import { getAppLanguage, setAppLanguage, translate, translateIn } from '../src/i18n'
import { CONTACT_EMAIL } from '../src/config/contact'
import {
  LanguagePreferenceContext,
  type LanguagePreferenceContextValue,
} from '../src/preferences/languagePreferenceContextObject'

const placeholders = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort()

describe('string catalog', () => {
  const enKeys = Object.keys(en) as (keyof typeof en)[]

  it('has every English key in Hindi, with no empty values', () => {
    for (const key of enKeys) {
      expect(hi).toHaveProperty([key])
      expect(hi[key].trim()).not.toBe('')
    }
    expect(Object.keys(hi).sort()).toEqual([...enKeys].sort())
  })

  it('keeps the same {params} in both languages', () => {
    for (const key of enKeys) {
      expect([key, placeholders(hi[key])]).toEqual([key, placeholders(en[key])])
    }
  })

  it('interpolates params and follows the app language outside components', () => {
    expect(translateIn('hi', 'city.savedToast', { city: 'Jhansi' })).toBe(
      'अब Jhansi की खबरें दिख रही हैं',
    )
    const previous = getAppLanguage()
    setAppLanguage('hi')
    expect(translate('toast.saved')).toBe(hi['toast.saved'])
    setAppLanguage('en')
    expect(translate('toast.saved')).toBe('Saved')
    setAppLanguage(previous)
  })
})

describe('Hindi app chrome', () => {
  function renderIn(lang: 'en' | 'hi') {
    const value: LanguagePreferenceContextValue = {
      ready: true,
      hasSelectedLanguage: true,
      preferredLanguage: lang,
      setPreferredLanguage: jest.fn(),
    }
    return render(
      <LanguagePreferenceContext.Provider value={value}>
        <ContactScreen />
      </LanguagePreferenceContext.Provider>,
    )
  }

  it('renders the Contact screen labels in Hindi and keeps the email as is', () => {
    renderIn('hi')
    expect(screen.getByText('हमसे संपर्क करें')).toBeTruthy()
    expect(screen.getByText(hi['contact.email'])).toBeTruthy()
    expect(screen.getByText(hi['contact.aboutContent'])).toBeTruthy()
    expect(screen.getByLabelText(hi['common.goBack'])).toBeTruthy()
    expect(screen.getByText(CONTACT_EMAIL)).toBeTruthy()
    expect(screen.queryByText('Contact us')).toBeNull()
  })

  it('renders English when English is chosen', () => {
    renderIn('en')
    expect(screen.getByText('Contact us')).toBeTruthy()
    expect(screen.queryByText('हमसे संपर्क करें')).toBeNull()
  })
})
