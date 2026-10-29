import * as React from "react"
import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { color, font, radius } from "../theme"

type Tone = "default" | "success" | "error"
interface ToastApi {
  show: (message: string, tone?: Tone) => void
}

const Ctx = React.createContext<ToastApi>({ show: () => {} })

/** A single toast at the top of the screen; a new one replaces the old. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets()
  const [toast, setToast] = React.useState<{ message: string; tone: Tone; key: number } | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const api = React.useMemo<ToastApi>(
    () => ({
      show: (message, tone = "default") => {
        clearTimeout(timer.current)
        setToast({ message, tone, key: Date.now() })
        timer.current = setTimeout(() => setToast(null), 2600)
      },
    }),
    []
  )

  React.useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <Ctx.Provider value={api}>
      {children}
      {toast && (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.wrap, { top: insets.top + 8 }]}
        >
          <View style={[styles.toast, toast.tone === "error" && styles.error]}>
            {toast.tone === "success" && <View style={styles.dot} />}
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </View>
      )}
    </Ctx.Provider>
  )
}

export function useToast() {
  return React.useContext(Ctx)
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, alignItems: "center", zIndex: 100 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: color.ink,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingVertical: 11,
    maxWidth: 420,
  },
  error: { backgroundColor: color.negative },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.brandOnDark },
  text: { color: "#fff", fontSize: font.small, fontWeight: "500" },
})
