import '@expo/metro-runtime'
import { registerRootComponent } from 'expo'

import App from './App'

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// Works for Expo Go, native builds, and React Native Web.
registerRootComponent(App)
