import * as React from "react"
import { ActivityIndicator, StatusBar, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { RootNavigator } from "./src/navigation"
import { AppStoreProvider } from "./src/store"
import { color } from "./src/theme"
import { ToastProvider } from "./src/ui/toast"

/** Shown for the moment it takes to read saved state from the phone. */
function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.ground }}>
      <ActivityIndicator color={color.brand} />
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={color.ground} />
      <ToastProvider>
        <AppStoreProvider fallback={<Loading />}>
          <RootNavigator />
        </AppStoreProvider>
      </ToastProvider>
    </SafeAreaProvider>
  )
}
