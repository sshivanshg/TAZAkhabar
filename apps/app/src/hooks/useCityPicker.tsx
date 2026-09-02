import { useCallback, useMemo, useState, type ReactNode, type RefObject } from 'react'
import { View } from 'react-native'
import type { CityResponse } from '@tazakhabar/shared-types'
import { apiClient } from '../api/client'
import { useAsyncResource } from '../api/useAsyncResource'
import {
  CityPickerDropdown,
  captureCityButtonAnchor,
  type CityPickerAnchor,
} from '../components/CityPickerDropdown'
import { getCurrentCoordinates } from '../location/getCurrentCoordinates'
import { findNearestCity } from '../location/nearestCity'
import { setStoredCitySlug, GLOBAL_CITY_SLUG, createGlobalCity } from '../storage/cityPreference'

const EMPTY_CITIES: CityResponse[] = []
const TEST_CITY_SLUG = 'emptyville'

function isSelectableCity(city: CityResponse): boolean {
  return Boolean(city.slug && city.slug !== TEST_CITY_SLUG)
}

type Options = {
  citySlug: string | null
  onCitySelected: (city: CityResponse) => void
  mobile: boolean
  cityButtonRef?: RefObject<View | null>
  /** Always use a bottom sheet (e.g. Profile has no header anchor). */
  forceSheet?: boolean
}

export function useCityPicker({
  citySlug,
  onCitySelected,
  mobile,
  cityButtonRef,
  forceSheet = false,
}: Options): {
  openCityPicker: () => void
  closeCityPicker: () => void
  picker: ReactNode
  pickerOpen: boolean
} {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<CityPickerAnchor | null>(null)
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)

  const cityList = useAsyncResource(() => apiClient.getCities(), [citySlug, open], {
    enabled: open,
    initialData: EMPTY_CITIES,
  })

  const selectableCities = useMemo(() => {
    const fromApi = cityList.data.filter(
      (city) => isSelectableCity(city) && city.slug?.toLowerCase() !== GLOBAL_CITY_SLUG,
    )
    return [createGlobalCity(), ...fromApi]
  }, [cityList.data])

  const closeCityPicker = useCallback(() => {
    setOpen(false)
    setAnchor(null)
    setLocationMessage(null)
  }, [])

  const openCityPicker = useCallback(() => {
    const useSheet = forceSheet || mobile
    if (!useSheet && cityButtonRef?.current) {
      captureCityButtonAnchor(cityButtonRef.current, (nextAnchor) => {
        setAnchor(nextAnchor)
        setOpen(true)
      })
      return
    }
    setAnchor(null)
    setOpen(true)
  }, [cityButtonRef, forceSheet, mobile])

  const selectCity = useCallback(
    async (city: CityResponse) => {
      if (!city.slug || savingSlug) {
        return
      }
      if (city.slug === citySlug) {
        closeCityPicker()
        return
      }
      setSavingSlug(city.slug)
      try {
        await setStoredCitySlug(city.slug)
        onCitySelected(city)
        closeCityPicker()
      } finally {
        setSavingSlug(null)
      }
    },
    [citySlug, closeCityPicker, onCitySelected, savingSlug],
  )

  const detectLocation = useCallback(async () => {
    if (detectingLocation || selectableCities.length === 0) {
      return
    }
    setDetectingLocation(true)
    setLocationMessage(null)
    try {
      const coordinates = await getCurrentCoordinates()
      const match = findNearestCity(coordinates, selectableCities)
      if (!match) {
        setLocationMessage('Could not match your location.')
        return
      }
      await selectCity(match.city)
    } catch {
      setLocationMessage('Location unavailable. Pick a city below.')
    } finally {
      setDetectingLocation(false)
    }
  }, [detectingLocation, selectableCities, selectCity])

  const picker = (
    <CityPickerDropdown
      visible={open}
      anchor={anchor}
      cities={selectableCities}
      loading={open && cityList.loading}
      error={open && cityList.error ? 'Could not load cities.' : null}
      selectedSlug={citySlug}
      savingSlug={savingSlug}
      onSelect={(city) => void selectCity(city)}
      onDetectLocation={() => void detectLocation()}
      detectingLocation={detectingLocation}
      locationMessage={locationMessage}
      onClose={closeCityPicker}
      sheet={forceSheet || mobile}
    />
  )

  return { openCityPicker, closeCityPicker, picker, pickerOpen: open }
}
