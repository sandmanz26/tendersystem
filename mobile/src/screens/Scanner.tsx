import { useIsFocused } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Ban, Camera as CameraIcon, CircleCheck, CloudOff, CornerDownLeft, Info, Keyboard, PackageCheck, Undo2, Wand2, X, type LucideIcon } from "lucide-react-native"
import * as React from "react"
import { FlatList, Linking, Pressable, StyleSheet, TextInput, Vibration, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from "react-native-vision-camera"

import { fmtNum } from "../core/format"
import { isWaiting, type ScanResult } from "../core/rules"
import type { RootStackParamList } from "../navigation"
import { eventView, unitOf } from "../selectors"
import { useAppStore } from "../store"
import { color, font, mono, radius, tabular } from "../theme"
import { Header, IconButton, LineRow, ScanBar, SyncStatus } from "../ui/domain"
import { Button, Chip, EmptyState, Text } from "../ui/primitives"
import { Sheet } from "../ui/sheet"
import { useToast } from "../ui/toast"
import { NotFound } from "./NotFound"

type Feedback = ScanResult & { key: number; shownAt: number }

const UNDO_WINDOW_MS = 8000
/** The same code held in frame is ignored for this long. */
const REPEAT_MS = 2500

export function ScannerScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Scanner">) {
  const { eventKey } = route.params
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const store = useAppStore()
  const { scan, scanLines, undoScan, online } = store
  const event = store.events.find((e) => `${e.date} | ${e.name.toUpperCase()}` === eventKey)

  const [manual, setManual] = React.useState("")
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [choose, setChoose] = React.useState<number[] | null>(null)
  const [cameraOn, setCameraOn] = React.useState(false)
  const [list, setList] = React.useState<"waiting" | "done">("waiting")
  const [, rerender] = React.useReducer((x: number) => x + 1, 0)
  const counter = React.useRef(0)
  const last = React.useRef({ code: "", at: 0 })

  const focused = useIsFocused()
  const device = useCameraDevice("back")
  const { hasPermission, requestPermission } = useCameraPermission()

  const show = React.useCallback((result: ScanResult) => {
    const ok = result.status === "ok"
    Vibration.vibrate(ok ? 35 : result.status === "choose" ? 20 : [0, 70, 50, 70])
    if (result.status === "choose") setChoose(result.lineIds)
    setFeedback({ ...result, key: ++counter.current, shownAt: Date.now() })
  }, [])

  const handleCode = React.useCallback((code: string) => show(scan(eventKey, code)), [eventKey, scan, show])

  const codeScanner = useCodeScanner({
    codeTypes: ["qr", "code-128", "code-39", "ean-13"],
    onCodeScanned: (codes) => {
      const value = codes[0]?.value
      const now = Date.now()
      if (!value || (value === last.current.code && now - last.current.at < REPEAT_MS)) return
      last.current = { code: value, at: now }
      handleCode(value)
    },
  })

  // Expire the undo button.
  React.useEffect(() => {
    if (feedback?.status !== "ok") return
    const t = setTimeout(rerender, UNDO_WINDOW_MS + 50)
    return () => clearTimeout(t)
  }, [feedback])

  const toggleCamera = async () => {
    if (cameraOn) return setCameraOn(false)
    if (!hasPermission && !(await requestPermission())) {
      toast.show("Camera not allowed. Type the SKU, or allow it in Settings.", "error")
      Linking.openSettings().catch(() => {})
      return
    }
    if (!device) return toast.show("No camera found. Type the SKU.", "error")
    setCameraOn(true)
  }

  if (!event) return <NotFound onBack={() => navigation.goBack()} />
  const v = eventView(event, store, store.stages)
  const mode = v.mode
  if (!mode || !store.writable) {
    return (
      <View style={{ flex: 1 }}>
        <Header title={event.name} onBack={() => navigation.goBack()} />
        <EmptyState icon={!store.writable ? Ban : Info} title={!store.writable ? "View only" : `${v.stage.status} doesn't need scanning`} />
      </View>
    )
  }

  const waitingLines = v.lines.filter((l) => isWaiting(l, mode))
  const doneLines = v.lines.filter((l) => !isWaiting(l, mode))
  const shown = list === "waiting" ? waitingLines : doneLines
  const canUndo = feedback?.status === "ok" && Date.now() - feedback.shownAt < UNDO_WINDOW_MS
  const boxOf = (id: number) => v.packages.find((p) => p.itemIds.includes(id))

  // Demo: scan the label of a random waiting line (or its box), as the camera would.
  const simulate = () => {
    const l = waitingLines[Math.floor(Math.random() * waitingLines.length)]
    if (!l) return
    const box = boxOf(l.id)
    handleCode(box ? `emi:box:${event.id}:${box.id}` : `emi:line:${event.id}:${l.id}`)
  }

  const capture = (
    <View style={{ backgroundColor: color.dark, paddingTop: insets.top }}>
      <SyncStatus dark />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, height: 56, paddingHorizontal: 12 }}>
        <IconButton icon={X} label="Close scanner" tone="dark" onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }}>
          <Text variant="label" style={{ color: mode === "in" ? "#a5b4fc" : "#fdba74" }}>
            {mode === "in" ? "SCAN IN" : "SCAN OUT"}
          </Text>
          <Text variant="strong" style={{ color: "#fff" }} numberOfLines={1} accessibilityRole="header">
            {event.name}
          </Text>
        </View>
        <Text style={[{ color: "#fff", fontSize: 22, fontWeight: "700" }, tabular]}>
          {doneLines.length}
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: "500" }}>{`/${v.lines.length}`}</Text>
        </Text>
      </View>
      <ScanBar done={doneLines.length} total={v.lines.length} dark style={{ marginHorizontal: 16 }} />

      {/* The viewfinder is the camera switch: one big target. */}
      <View style={styles.viewfinder}>
        {cameraOn && device && <Camera style={StyleSheet.absoluteFill} device={device} isActive={focused && cameraOn && !choose} codeScanner={codeScanner} />}
        <Pressable accessibilityRole="button" accessibilityLabel={cameraOn ? "Turn camera off" : "Turn camera on"} onPress={toggleCamera} style={StyleSheet.absoluteFill}>
          <Corners />
          {!cameraOn && (
            <View style={styles.tapHint}>
              {device ? <CameraIcon size={16} color="rgba(255,255,255,0.85)" /> : <Keyboard size={16} color="rgba(255,255,255,0.85)" />}
              <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>{device ? "Tap to scan" : "Type the SKU"}</Text>
            </View>
          )}
        </Pressable>
        {!online && (
          <View style={styles.offline}>
            <CloudOff size={12} color="#fdba74" />
            <Text style={{ color: "#fdba74", fontSize: font.tiny, fontWeight: "700" }}>Offline</Text>
          </View>
        )}
        <View style={styles.feedbackWrap} pointerEvents="box-none">
          <ScanFeedback
            feedback={feedback}
            canUndo={canUndo}
            onUndo={() => {
              if (feedback?.status !== "ok") return
              undoScan(eventKey, feedback.lineIds)
              toast.show(`Undone: ${feedback.label}`)
              setFeedback(null)
            }}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, padding: 16 }}>
        <TextInput
          value={manual}
          onChangeText={setManual}
          placeholder="SKU, e.g. WTC-053"
          placeholderTextColor="rgba(255,255,255,0.4)"
          accessibilityLabel="Type a SKU or code"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="send"
          onSubmitEditing={() => {
            if (!manual.trim()) return
            handleCode(manual)
            setManual("")
          }}
          style={styles.codeInput}
        />
        <Button
          size="icon"
          variant="secondary"
          icon={CornerDownLeft}
          accessibilityLabel="Submit code"
          disabled={!manual.trim()}
          onPress={() => {
            handleCode(manual)
            setManual("")
          }}
        />
        <IconButton icon={Wand2} label="Scan demo" tone="dark" onPress={simulate} />
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <FlatList
        data={shown}
        keyExtractor={(l) => String(l.id)}
        ListHeaderComponent={
          <View>
            {capture}
            <View style={{ flexDirection: "row", gap: 6, padding: 16, paddingBottom: 10 }}>
              <Chip label="Waiting" count={waitingLines.length} selected={list === "waiting"} onPress={() => setList("waiting")} />
              <Chip label="Done" count={doneLines.length} selected={list === "done"} onPress={() => setList("done")} />
            </View>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState icon={PackageCheck} title={list === "waiting" ? `Everything is scanned ${mode}` : "Nothing scanned yet"} />}
        renderItem={({ item: l, index }) => (
          <View style={[styles.listRow, index === 0 && styles.listFirst, index === shown.length - 1 && styles.listLast]}>
            <LineRow line={l} unit={unitOf(l.name)} mode={mode} boxName={boxOf(l.id)?.name.split(" – ")[0]} />
          </View>
        )}
      />
      {waitingLines.length === 0 && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Button size="lg" variant="positive" title="All scanned · back to event" onPress={() => navigation.goBack()} />
        </View>
      )}

      <Sheet visible={!!choose} onClose={() => setChoose(null)} title="Which one?" subtitle="This item is on several areas. Pick the one in your hands.">
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
          {(choose ?? []).map((id) => {
            const l = v.lines.find((x) => x.id === id)
            if (!l) return null
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                onPress={() => {
                  scanLines(eventKey, [id])
                  setChoose(null)
                  show({ status: "ok", lineIds: [id], label: `${l.name} · ${l.area}` })
                }}
                style={({ pressed }) => [
                  { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.control, borderWidth: 1, borderColor: color.border },
                  pressed && { backgroundColor: color.raised },
                ]}
              >
                <Text style={[{ fontSize: 17, fontWeight: "700", width: 44, textAlign: "right" }, tabular]}>{fmtNum(l.qty)}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="strong">{l.area}</Text>
                  <Text variant="tiny">{[l.subArea, l.pic].filter(Boolean).join(" · ") || "No sub area"}</Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </Sheet>
    </View>
  )
}

function Corners() {
  const c = { position: "absolute" as const, width: 26, height: 26, borderColor: "rgba(255,255,255,0.75)" }
  return (
    <>
      <View style={[c, { top: 18, left: 18, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 }]} />
      <View style={[c, { top: 18, right: 18, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 }]} />
      <View style={[c, { bottom: 18, left: 18, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 }]} />
      <View style={[c, { bottom: 18, right: 18, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 }]} />
    </>
  )
}

function ScanFeedback({ feedback, canUndo, onUndo }: { feedback: Feedback | null; canUndo: boolean; onUndo: () => void }) {
  if (!feedback) return null
  const f = feedback
  const map: Record<ScanResult["status"], { bg: string; icon: LucideIcon; title: string; body?: string }> = {
    ok: { bg: color.green, icon: CircleCheck, title: f.status === "ok" ? f.label : "", body: f.status === "ok" && f.lineIds.length > 1 ? `${f.lineIds.length} lines in the box` : undefined },
    choose: { bg: color.brand, icon: Info, title: "Pick the area", body: f.status === "choose" ? f.label : undefined },
    already: { bg: "#374151", icon: Info, title: "Already scanned", body: f.status === "already" ? f.label : undefined },
    "not-on-event": { bg: color.red, icon: Ban, title: "Not on this event", body: f.status === "not-on-event" ? f.label : undefined },
    "other-event": { bg: color.red, icon: Ban, title: "Belongs to another event", body: f.status === "other-event" ? f.eventName : undefined },
    unknown: { bg: color.red, icon: Ban, title: "Unknown code", body: f.status === "unknown" ? f.code : undefined },
  }
  const m = map[f.status]
  return (
    <View key={f.key} accessibilityRole="alert" style={[styles.feedback, { backgroundColor: m.bg }]}>
      <m.icon size={20} color="#fff" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="strong" style={{ color: "#fff" }} numberOfLines={1}>
          {m.title}
        </Text>
        {m.body && (
          <Text variant="tiny" style={{ color: "rgba(255,255,255,0.85)", fontFamily: f.status === "unknown" ? mono : undefined }} numberOfLines={1}>
            {m.body}
          </Text>
        )}
      </View>
      {f.status === "ok" && canUndo && (
        <Pressable accessibilityRole="button" accessibilityLabel="Undo" onPress={onUndo} hitSlop={8} style={styles.undo}>
          <Undo2 size={14} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Undo</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  viewfinder: { height: 220, marginHorizontal: 16, marginTop: 14, borderRadius: radius.card, overflow: "hidden", backgroundColor: color.darkSurface },
  tapHint: { position: "absolute", alignSelf: "center", top: 88, flexDirection: "row", alignItems: "center", gap: 6 },
  offline: { position: "absolute", top: 10, alignSelf: "center", flexDirection: "row", gap: 4, alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  feedbackWrap: { position: "absolute", left: 10, right: 10, bottom: 10 },
  feedback: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: radius.control, paddingHorizontal: 12, paddingVertical: 10 },
  undo: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.18)" },
  codeInput: { flex: 1, height: 44, borderRadius: radius.control, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", color: "#fff", paddingHorizontal: 12, fontFamily: mono, fontSize: 15 },
  listRow: { marginHorizontal: 16, backgroundColor: color.surface, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: color.border },
  listFirst: { borderTopWidth: 1, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card },
  listLast: { borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.border },
})
