import type { ReadingLanguageCode } from '../../storage/languagePreference'
import { ReadingLanguageToggle } from '../ReadingLanguageToggle'

type Props = {
  value: ReadingLanguageCode
  onChange: (code: ReadingLanguageCode) => void
}

/** Article reader wrapper — same control, reader palette. */
export function LanguageSegment({ value, onChange }: Props) {
  return <ReadingLanguageToggle value={value} onChange={onChange} palette="reader" />
}
