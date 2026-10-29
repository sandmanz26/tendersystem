import { CircleCheck, PenLine, TriangleAlert, X } from "lucide-react-native"
import * as React from "react"
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { PHASES } from "../core/phases"
import type { PhaseProgress } from "../core/progress"
import type { WeddingEvent } from "../core/types"
import { useAppStore } from "../store"
import { color, font, radius, tabular } from "../theme"
import { Button, Callout, Text } from "./primitives"
import { SignaturePad, type Signature } from "./signature-pad"
import { useToast } from "./toast"

/**
 * Bottom sheet that closes the current phase. Phases with a handover need the
 * receiving party's name and signature before the button unlocks.
 */
export function PhaseCompleteSheet({
  event,
  progress,
  visible,
  onClose,
  onDone,
}: {
  event: WeddingEvent
  progress: PhaseProgress
  visible: boolean
  onClose: () => void
  onDone?: () => void
}) {
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const { advancePhase } = useAppStore()
  const { phase } = progress
  const next = PHASES[event.phaseIndex + 1]
  const [name, setName] = React.useState("")
  const [signature, setSignature] = React.useState<Signature | null>(null)
  const [drawing, setDrawing] = React.useState(false)

  const needsHandover = !!phase.handover
  const ready = progress.complete && (!needsHandover || (name.trim().length >= 3 && !!signature))

  const submit = () => {
    if (!ready) return
    const ok = advancePhase(
      event.id,
      needsHandover
        ? {
            name: name.trim(),
            party: phase.handover!.party,
            signature: signature!.path,
            signatureSize: { width: signature!.width, height: signature!.height },
          }
        : undefined
    )
    onClose()
    if (!ok) {
      toast.show("Can't close yet. Data changed, check the list.", "error")
      return
    }
    toast.show(next ? `Moved to ${next.label}` : "Event closed", "success")
    onDone?.()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView pointerEvents="box-none" behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetWrap}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text variant="heading">Complete {phase.label}</Text>
              <Text variant="meta">{next ? `Next: ${next.label} · can't be undone` : "All items back · closes the event"}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8}>
              <X size={22} color={color.muted} />
            </Pressable>
          </View>

          <ScrollView scrollEnabled={!drawing} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingTop: 12 }}>
            {phase.requiresScan ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Stat value={progress.scanned} label="Scanned" />
                <Stat value={progress.reported} label="Reported" />
                <Stat value={progress.flagged.length} label="Flagged" warn={progress.flagged.length > 0} />
              </View>
            ) : (
              <Callout icon={CircleCheck} tone="accent">
                {`${progress.tasksDone.length} checklist items done`}
              </Callout>
            )}

            {progress.flagged.length > 0 && (
              <Callout icon={TriangleAlert}>{`${progress.flagged.length} skipped the last checkpoint · flagged`}</Callout>
            )}

            {needsHandover && (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <PenLine size={16} color={color.ink} />
                  <Text variant="strong">Handover · {phase.handover!.party}</Text>
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Receiver's full name"
                  placeholderTextColor={color.muted}
                  accessibilityLabel="Receiver's name"
                  autoCapitalize="words"
                  style={styles.input}
                />
                <SignaturePad onChange={setSignature} onDrawingChange={setDrawing} />
              </View>
            )}
          </ScrollView>

          <Button
            size="lg"
            title={next ? `Continue to ${next.label}` : "Close event"}
            disabled={!ready}
            onPress={submit}
            style={{ marginTop: 12 }}
          />
          {needsHandover && !ready && (
            <Text variant="meta" style={{ textAlign: "center", marginTop: 6 }}>
              Name + signature needed
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function Stat({ value, label, warn }: { value: number; label: string; warn?: boolean }) {
  return (
    <View style={[styles.stat, warn && { backgroundColor: color.pillWarningBg }]}>
      <Text style={{ fontSize: 22, fontWeight: "600", color: warn ? color.pillWarningInk : color.ink, ...tabular }}>{value}</Text>
      <Text variant="meta">{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheetWrap: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.card + 4,
    borderTopRightRadius: radius.card + 4,
    paddingHorizontal: 16,
    maxHeight: "90%",
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: color.border, marginTop: 8 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingTop: 12 },
  stat: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: radius.control, backgroundColor: color.raised },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: color.control,
    borderRadius: radius.control,
    paddingHorizontal: 12,
    fontSize: font.body,
    color: color.ink,
    backgroundColor: color.surface,
  },
})
