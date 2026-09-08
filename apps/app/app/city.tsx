import { Redirect } from 'expo-router'

/** Legacy route — city selection now lives in the home header dropdown. */
export default function CityRoute() {
  return <Redirect href={{ pathname: '/(tabs)', params: { pickCity: '1' } }} />
}
