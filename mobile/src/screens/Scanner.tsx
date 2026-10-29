import { useIsFocused } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import {
  Ban,
  Camera as CameraIcon,
  CircleCheck,
  CircleDashed,
  CloudOff,
  CornerDownLeft,
  Flag,
  Info,
  Keyboard,
  PackageCheck,
  ScanLine,
  TriangleAlert,
  Undo2,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react-native"
import * as React from "react"
import { FlatList, Linking, Pressable, StyleSheet, TextInput, Vibration, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from "react-native-vision-camera"

import { clock, dayDiff } from "../core/format"
import { getAsset, personName } from "../core/lookup"
import { PHASES } from "../core/phases"
import { getEventProgress } from "../core/progress"
import type { ScanResult } from "../core/scan"
import type { RootStackParamList } from "../navigation"
import { useAppStore } from "../store"
import { color, font, mono, radius, tabular } from "../theme"
import { Header, IconButton, ManifestGrid, SyncStatus } from "../ui/domain"
import { PhaseCompleteSheet } from "../ui/phase-complete"
import { Badge, Button, Callout, Chip, EmptyState, Text } from "../ui/primitives"
import { useToast } from "../ui/toast"
import { NotFound } from "./NotFound"

type Feedback = ScanResult & { name?: string; key: number; shownAt: number }

const UNDO_WINDOW_MS = 8000
/** The same code held in frame is ignored for this long. */
const REPEAT_MS = 2500

export function ScannerScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Scanner">) {
  const { eventId } = route.params
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const store = useAppStore()
  const { events, scan, undoScan, userId, online } = store
  const event = events.find((e) => e.id === eventId)

  const [manual, setManual] = React.useState("")
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [cameraOn, setCameraOn] = React.useState(false)
  const [list, setList] = React.useState<"pending" | "done">("pending")
  const [sheet, setSheet] = React.useState(false)
  const [, rerender] = React.useReducer((x: number) => x + 1, 0)
  const counter = React.useRef(0)
  const last = React.useRef({ code: "", at: 0 })

  const focused = useIsFocused()
  const device = useCameraDevice("back")
  const { hasPermission, requestPermission } = useCameraPermission()

  const handleCode = React.useCallback(
    (code: string) => {
      const result = scan(eventId, code)
      const ok = result.status === "ok"
      Vibration.vibrate(ok ? 35 : [0, 70, 50, 70])
      setFeedback({ ...result, name: getAsset(result.code)?.name, key: ++counter.current, shownAt: Date.now() })
    },
    [eventId, scan]
  )

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
      toast.show("Camera not allowed. Type the code, or allow it in Settings.", "error")
      Linking.openSettings().catch(() => {})
      return
    }
    if (!device) return toast.show("No camera found. Type the code.", "error")
    setCameraOn(true)
  }

  if (!event) return <NotFound onBack={() => navigation.goBack()} />
  const progress = getEventProgress(event, store)
  const phase = PHASES[event.phaseIndex]
  const assigned = event.crew.some((c) => c.personId === userId)

  if (!assigned || !progress || !phase?.requiresScan) {
    return (
      <View style={{ flex: 1 }}>
        <Header title={event.couple} onBack={() => navigation.goBack()} />
        <EmptyState
          icon={!assigned ? Ban : Info}
          title={!assigned ? "You're not on this crew" : phase ? `${phase.label} doesn't need scanning` : "This event is closed"}
        />
      </View>
    )
  }

  const cleared = progress.scanned + progress.reported
  const doneCodes = event.assetCodes.filter((c) => progress.byAsset[c].state !== "pending")
  const next = PHASES[event.phaseIndex + 1]
  const daysAway = dayDiff(event.date)
  const canUndo =
    feedback?.status === "ok" && Date.now() - feedback.shownAt < UNDO_WINDOW_MS && progress.byAsset[feedback.code]?.state === "scanned"
  const codes = list === "pending" ? progress.pending : doneCodes

  const simulate = () => {
    const code = progress.pending[Math.floor(Math.random() * progress.pending.length)]
    if (code) handleCode(code)
  }

  const capture = (
    <View style={{ backgroundColor: color.dark, paddingTop: insets.top }}>
      <SyncStatus dark />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 56, paddingHorizontal: 12 }}>
        <IconButton icon={X} label="Close scanner" tone="dark" onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }}>
          <Text variant="strong" style={{ color: "#fff" }} accessibilityRole="header" numberOfLines={1}>{phase.label}</Text>
          <Text variant="meta" style={{ color: "rgba(255,255,255,0.7)" }} numberOfLines={1}>{event.couple}</Text>
        </View>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "600", ...tabular }}>
          {cleared}
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{`/${progress.total}`}</Text>
        </Text>
      </View>
      <ManifestGrid progress={progress} codes={event.assetCodes} dark legend={false} cellHeight={10} style={{ marginHorizontal: 16 }} />

      {/* The viewfinder is the camera switch: one big target instead of a button and a sentence. */}
      <View style={styles.viewfinder}>
        {cameraOn && device && (
          <Camera style={StyleSheet.absoluteFill} device={device} isActive={focused && cameraOn && !sheet} codeScanner={codeScanner} />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cameraOn ? "Turn camera off" : "Turn camera on"}
          onPress={toggleCamera}
          style={StyleSheet.absoluteFill}
        >
          <Corners />
          {!cameraOn && (
            <View style={styles.tapHint}>
              {device ? <CameraIcon size={16} color="rgba(255,255,255,0.85)" /> : <Keyboard size={16} color="rgba(255,255,255,0.85)" />}
              <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "500" }}>{device ? "Tap to scan" : "Type the code"}</Text>
            </View>
          )}
        </Pressable>
        {!online && (
          <View style={styles.offline}>
            <CloudOff size={12} color="#fcd34d" />
            <Text style={{ color: "#fcd34d", fontSize: font.tiny, fontWeight: "600" }}>Offline</Text>
          </View>
        )}
        <View style={styles.feedbackWrap} pointerEvents="box-none">
          <ScanFeedback
            feedback={feedback}
            canUndo={canUndo}
            onUndo={() => {
              if (!feedback) return
              undoScan(event.id, feedback.code)
              toast.show(`Undone: ${feedback.code}`)
              setFeedback(null)
            }}
            onReport={() => navigation.navigate("NewReport", { eventId: event.id, type: "issue" })}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, padding: 16 }}>
        <TextInput
          value={manual}
          onChangeText={setManual}
          placeholder="KRS-TFG-01"
          placeholderTextColor="rgba(255,255,255,0.45)"
          accessibilityLabel="Type a code"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
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

  const header = (
    <View>
      {capture}
      <View style={{ paddingHorizontal: 16, gap: 10, paddingTop: 12 }}>
        {phase.key === "load_out" && daysAway > 1 && <Callout icon={Info} tone="info">{`Event in ${daysAway} days. Right truck?`}</Callout>}
        {progress.flagged.length > 0 && <Callout icon={TriangleAlert}>{`${progress.flagged.length} skipped the last checkpoint. Flagged for the lead.`}</Callout>}
        <View style={{ flexDirection: "row", gap: 6, paddingBottom: 10 }}>
          <Chip label="Left" count={progress.pending.length} selected={list === "pending"} onPress={() => setList("pending")} />
          <Chip label="Done" count={doneCodes.length} selected={list === "done"} onPress={() => setList("done")} />
        </View>
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <FlatList
        data={codes}
        keyExtractor={(c) => c}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState icon={list === "pending" ? PackageCheck : ScanLine} title={list === "pending" ? "All recorded" : "Nothing scanned yet"} />}
        renderItem={({ item: code, index }) => {
          const asset = getAsset(code)!
          const st = progress.byAsset[code]
          const flagged = progress.flagged.includes(code)
          return (
            <View style={[styles.listRow, index === 0 && styles.listFirst, index === codes.length - 1 && styles.listLast]}>
              {st.state === "scanned" ? (
                flagged ? <TriangleAlert size={20} color={color.warning} /> : <CircleCheck size={20} color={color.brand} />
              ) : st.state === "reported" ? (
                <TriangleAlert size={20} color={color.warning} />
              ) : (
                <CircleDashed size={20} color={color.faint} />
              )}
              <Pressable style={{ flex: 1, minWidth: 0 }} onPress={() => navigation.navigate("ItemDetail", { code, eventId: event.id })}>
                <Text variant="strong" numberOfLines={1}>{asset.name}</Text>
                <Text variant="meta" numberOfLines={1}>
                  <Text style={{ fontFamily: mono, fontSize: 12, color: color.muted }}>{code}</Text>
                  {` · ${asset.unit}`}
                </Text>
              </Pressable>
              {st.state === "pending" && (
                <IconButton icon={Flag} label={`Report ${asset.name} damaged or missing`} onPress={() => navigation.navigate("NewReport", { eventId: event.id, type: "damage", assetCode: code })} />
              )}
              {st.state === "scanned" && (
                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    {st.record.synced === false && <CloudOff size={11} color={color.muted} />}
                    <Text variant="tiny" style={tabular}>{clock(st.record.at)}</Text>
                  </View>
                  <Text variant="tiny">{personName(st.record.by).split(" ")[0]}</Text>
                </View>
              )}
              {st.state === "reported" && <Badge label={st.report.category} variant="warning" />}
            </View>
          )
        }}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          size="lg"
          disabled={!progress.complete}
          title={progress.complete ? (next ? next.label : "Close event") : `${progress.pending.length} left`}
          onPress={() => {
            setCameraOn(false)
            setSheet(true)
          }}
        />
      </View>

      <PhaseCompleteSheet event={event} progress={progress} visible={sheet} onClose={() => setSheet(false)} onDone={() => navigation.goBack()} />
    </View>
  )
}

function Corners() {
  const c = { position: "absolute" as const, width: 32, height: 32, borderColor: "rgba(255,255,255,0.9)" }
  return (
    <View style={styles.cornersBox} pointerEvents="none">
      <View style={[c, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 }]} />
      <View style={[c, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 }]} />
      <View style={[c, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 }]} />
      <View style={[c, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 }]} />
    </View>
  )
}

function ScanFeedback({
  feedback,
  canUndo,
  onUndo,
  onReport,
}: {
  feedback: Feedback | null
  canUndo: boolean
  onUndo: () => void
  onReport: () => void
}) {
  if (!feedback) return null
  const warnOk = feedback.status === "ok" && (!!feedback.skippedPrevious || !!feedback.conditionNote)
  const bg = feedback.status === "ok" ? (warnOk ? "#8a4b0b" : color.brand) : feedback.status === "duplicate" ? "#3a3a3c" : "#b42318"

  let title = ""
  let detail = ""
  let Icon: LucideIcon = X
  switch (feedback.status) {
    case "ok":
      Icon = warnOk ? TriangleAlert : CircleCheck
      title = feedback.name ?? feedback.code
      detail = feedback.skippedPrevious
        ? `Skipped ${PHASES.find((p) => p.key === feedback.skippedPrevious)?.short} · flagged`
        : feedback.conditionNote
          ? `Check: ${feedback.conditionNote}`
          : feedback.code
      break
    case "duplicate":
      Icon = Info
      title = "Already scanned"
      detail = `${feedback.name} · ${clock(feedback.at)} · ${personName(feedback.by).split(" ")[0]}`
      break
    case "other-event":
      title = "Wrong event"
      detail = feedback.eventName ? `${feedback.code} → ${feedback.eventName}. Don't load.` : `${feedback.code} not on this list`
      break
    case "still-out":
      title = "Still out"
      detail = `${feedback.code} is still at ${feedback.eventName}`
      break
    case "unknown":
      title = "Unknown code"
      detail = `${feedback.code} not in inventory`
      break
    case "invalid":
      title = "Wrong format"
      detail = "Like KRS-TFG-01"
      break
    default:
      Icon = Info
      title = "No scan in this phase"
  }
  const reportable = feedback.status === "unknown" || feedback.status === "other-event"

  return (
    <View key={feedback.key} accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.feedback, { backgroundColor: bg }]}>
      <Icon size={20} color="#fff" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="strong" style={{ color: "#fff" }} numberOfLines={1}>{title}</Text>
        {!!detail && <Text variant="meta" style={{ color: "rgba(255,255,255,0.9)" }} numberOfLines={2}>{detail}</Text>}
      </View>
      {canUndo && <Pill icon={Undo2} label="Undo" onPress={onUndo} />}
      {reportable && <Pill icon={Flag} label="Report" onPress={onReport} />}
    </View>
  )
}

function Pill({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={6} style={styles.pill}>
      <Icon size={14} color="#fff" />
      <Text style={{ color: "#fff", fontSize: font.meta, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  viewfinder: {
    marginHorizontal: 16,
    marginTop: 16,
    aspectRatio: 16 / 11,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: color.darkSurface,
  },
  cornersBox: { position: "absolute", top: "18%", bottom: "26%", left: "24%", right: "24%" },
  tapHint: { position: "absolute", left: 0, right: 0, bottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  offline: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: radius.control,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  feedbackWrap: { position: "absolute", left: 12, right: 12, bottom: 12 },
  feedback: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 10, minHeight: 60 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  codeInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: radius.control,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontFamily: mono,
    fontSize: 15,
    paddingHorizontal: 12,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: color.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: color.border,
    borderTopColor: color.rule,
  },
  listFirst: { borderTopColor: color.border, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card },
  listLast: { borderBottomWidth: 1, borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.border, paddingHorizontal: 16, paddingTop: 12 },
})
