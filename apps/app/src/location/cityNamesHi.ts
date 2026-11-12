import type { CityResponse } from '@tazakhabar/shared-types'
import type { AppLanguage, TFunction } from '../i18n/runtime'

/**
 * The cities API (GET /api/cities) only returns English names, so Hindi
 * readers get a client-side map: [display name, ...search aliases].
 */
const CITY_NAMES_HI: Record<string, readonly string[]> = {
  agartala: ['अगरतला'],
  agra: ['आगरा'],
  ahmedabad: ['अहमदाबाद'],
  aizawl: ['आइजोल'],
  amritsar: ['अमृतसर'],
  bareilly: ['बरेली'],
  bengaluru: ['बेंगलुरु', 'बैंगलोर', 'बंगलौर'],
  bhopal: ['भोपाल'],
  bhubaneswar: ['भुवनेश्वर'],
  bilaspur: ['बिलासपुर'],
  chandigarh: ['चंडीगढ़'],
  chennai: ['चेन्नई', 'मद्रास'],
  coimbatore: ['कोयंबटूर'],
  cuttack: ['कटक'],
  dehradun: ['देहरादून'],
  delhi: ['दिल्ली', 'नई दिल्ली'],
  dhanbad: ['धनबाद'],
  durgapur: ['दुर्गापुर'],
  faridabad: ['फरीदाबाद'],
  gangtok: ['गंगटोक'],
  ghaziabad: ['गाज़ियाबाद', 'गाजियाबाद'],
  gorakhpur: ['गोरखपुर'],
  gurugram: ['गुरुग्राम', 'गुड़गांव'],
  guwahati: ['गुवाहाटी'],
  haridwar: ['हरिद्वार'],
  hubballi: ['हुबली'],
  hyderabad: ['हैदराबाद'],
  imphal: ['इंफाल'],
  indore: ['इंदौर'],
  itanagar: ['ईटानगर'],
  jaipur: ['जयपुर'],
  jalandhar: ['जालंधर'],
  jammu: ['जम्मू'],
  jamshedpur: ['जमशेदपुर'],
  jhansi: ['झांसी'],
  jodhpur: ['जोधपुर'],
  kanpur: ['कानपुर'],
  kochi: ['कोच्चि'],
  kohima: ['कोहिमा'],
  kolkata: ['कोलकाता', 'कलकत्ता'],
  kozhikode: ['कोझिकोड'],
  lucknow: ['लखनऊ'],
  ludhiana: ['लुधियाना'],
  madurai: ['मदुरै'],
  mangaluru: ['मंगलुरु', 'मंगलौर'],
  meerut: ['मेरठ'],
  mumbai: ['मुंबई', 'बंबई'],
  mysuru: ['मैसूरु', 'मैसूर'],
  nagpur: ['नागपुर'],
  nashik: ['नासिक'],
  noida: ['नोएडा'],
  panaji: ['पणजी'],
  patna: ['पटना'],
  'port-blair': ['पोर्ट ब्लेयर'],
  prayagraj: ['प्रयागराज', 'इलाहाबाद'],
  puducherry: ['पुडुचेरी'],
  pune: ['पुणे'],
  raipur: ['रायपुर'],
  rajkot: ['राजकोट'],
  ranchi: ['रांची'],
  salem: ['सेलम'],
  shillong: ['शिलांग'],
  shimla: ['शिमला'],
  siliguri: ['सिलीगुड़ी'],
  srinagar: ['श्रीनगर'],
  surat: ['सूरत'],
  thiruvananthapuram: ['तिरुवनंतपुरम'],
  tiruchirappalli: ['तिरुचिरापल्ली'],
  tirupati: ['तिरुपति'],
  udaipur: ['उदयपुर'],
  vadodara: ['वडोदरा'],
  varanasi: ['वाराणसी', 'बनारस'],
  vijayawada: ['विजयवाड़ा'],
  visakhapatnam: ['विशाखापत्तनम'],
  warangal: ['वारंगल'],
}

const STATE_NAMES_HI: Record<string, string> = {
  'Andaman and Nicobar Islands': 'अंडमान और निकोबार',
  'Andhra Pradesh': 'आंध्र प्रदेश',
  'Arunachal Pradesh': 'अरुणाचल प्रदेश',
  Assam: 'असम',
  Bihar: 'बिहार',
  Chandigarh: 'चंडीगढ़',
  Chhattisgarh: 'छत्तीसगढ़',
  Delhi: 'दिल्ली',
  Goa: 'गोवा',
  Gujarat: 'गुजरात',
  Haryana: 'हरियाणा',
  'Himachal Pradesh': 'हिमाचल प्रदेश',
  'Jammu and Kashmir': 'जम्मू और कश्मीर',
  Jharkhand: 'झारखंड',
  Karnataka: 'कर्नाटक',
  Kerala: 'केरल',
  'Madhya Pradesh': 'मध्य प्रदेश',
  Maharashtra: 'महाराष्ट्र',
  Manipur: 'मणिपुर',
  Meghalaya: 'मेघालय',
  Mizoram: 'मिज़ोरम',
  Nagaland: 'नगालैंड',
  Odisha: 'ओडिशा',
  Puducherry: 'पुडुचेरी',
  Punjab: 'पंजाब',
  Rajasthan: 'राजस्थान',
  Sikkim: 'सिक्किम',
  'Tamil Nadu': 'तमिलनाडु',
  Telangana: 'तेलंगाना',
  Tripura: 'त्रिपुरा',
  'Uttar Pradesh': 'उत्तर प्रदेश',
  Uttarakhand: 'उत्तराखंड',
  'West Bengal': 'पश्चिम बंगाल',
}

/** Hindi display name for a slug, if known. */
export function cityNameHi(slug: string | null | undefined): string | undefined {
  return slug ? CITY_NAMES_HI[slug.toLowerCase()]?.[0] : undefined
}

/** All Devanagari names/aliases for a slug (for search). */
export function cityAliasesHi(slug: string | null | undefined): readonly string[] {
  return (slug && CITY_NAMES_HI[slug.toLowerCase()]) || []
}

/** Reverse lookup: English name (e.g. an eyebrow) → Hindi name. */
export function cityNameHiByEnglish(name: string): string | undefined {
  return cityNameHi(name.trim().toLowerCase().replace(/\s+/g, '-'))
}

export function localizedCityName(
  city: Pick<CityResponse, 'slug' | 'name'>,
  lang: AppLanguage,
): string {
  const english = city.name ?? city.slug ?? ''
  return lang === 'hi' ? (cityNameHi(city.slug) ?? english) : english
}

/** One-line picker label: "All India" row via city.allIndia; never "X, X" duplicates. */
export function cityRowLabel(
  city: Pick<CityResponse, 'slug' | 'name' | 'state'>,
  lang: AppLanguage,
  t: TFunction,
): string {
  if (city.slug?.toLowerCase() === 'global') return t('city.allIndia')
  const name = localizedCityName(city, lang).trim() || t('common.unknownCity')
  const state = city.state?.trim() ?? ''
  const english = (city.name ?? '').toLowerCase()
  if (!state || english.includes(state.toLowerCase()) || name.toLowerCase().includes(state.toLowerCase())) {
    return name
  }
  const shownState = lang === 'hi' ? (STATE_NAMES_HI[state] ?? state) : state
  return `${name}, ${shownState}`
}
