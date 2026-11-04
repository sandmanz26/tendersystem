import { Camera, Check, ImagePlus, PackageX, Pencil, Trash2, Undo2, X, ArrowRightLeft } from "lucide-react-native"
import * as React from "react"
import { Alert, Image, Linking, Pressable, ScrollView, View } from "react-native"
import { launchCamera, launchImageLibrary, type ImagePickerResponse } from "react-native-image-picker"

import { fmtNum, stamp } from "../core/format"
import { canEditQty, findStage } from "../core/rules"
import { AREAS, SUB_AREAS } from "../core/seed"
import type { EventLine } from "../core/types"
import { eventView, unitOf, type EventView } from "../selectors"
import { useAppStore } from "../store"
import { color, radius, tabular } from "../theme"
import { originOf, OwnershipTag, ScanMarks } from "./domain"
import { Button, Callout, Chip, Field, Input, Stepper, Tag, Text } from "./primitives"
import { Sheet } from "./sheet"
import { useToast } from "./toast"

type Mode = "view" | "broken" | "modify" | "transfer"
const MAX_PHOTOS = 4
// Downscaled on the phone so photos stay small in the offline queue.
const PHOTO_OPTIONS = { mediaType: "photo", maxWidth: 960, maxHeight: 960, quality: 0.7 } as const

export function LineSheet({ view, line, onClose }: { view: EventView; line: EventLine | null; onClose: () => void }) {
  const [mode, setMode] = React.useState<Mode>("view")
  React.useEffect(() => setMode("view"), [line?.id])
  if (!line) return null
  const title = mode === "broken" ? "Report broken items" : mode === "modify" ? "Modify item" : mode === "transfer" ? "Transfer item" : line.name
  return (
    <Sheet visible onClose={onClose} title={title} subtitle={mode === "view" ? `${fmtNum(line.qty)} ${unitOf(line.name)} · ${line.area}` : line.name} tall={mode !== "view"}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 16 }}>
        {mode === "view" && <Details view={view} line={line} onMode={setMode} onClose={onClose} />}
        {mode === "broken" && <BrokenForm view={view} line={line} onDone={() => setMode("view")} />}
        {mode === "modify" && <ModifyForm view={view} line={line} onDone={() => setMode("view")} />}
        {mode === "transfer" && <TransferForm view={view} line={line} onDone={onClose} />}
      </ScrollView>
    </Sheet>
  )
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: color.rule }}>
      <Text variant="meta">{label}</Text>
      {typeof value === "string" ? (
        <Text variant="small" style={[{ fontWeight: "500", color: color.ink, flexShrink: 1, textAlign: "right" }, tabular]}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  )
}

function Details({ view, line, onMode, onClose }: { view: EventView; line: EventLine; onMode: (m: Mode) => void; onClose: () => void }) {
  const store = useAppStore()
  const toast = useToast()
  const origin = originOf(line)
  const stage = view.stage
  const checking = view.tab === "checking-inventory"
  const canAct = store.writable && !view.locked
  const broken = (line.brokenQty ?? 0) > 0

  return (
    <>
      <View>
        <Fact label="Area" value={[line.area, line.subArea].filter(Boolean).join(" › ")} />
        <Fact label="Ownership" value={<OwnershipTag o={line.ownership} />} />
        {origin && <Fact label="Source" value={`${origin.label}${line.loanVendor ? ` · ${line.loanVendor}` : ""}`} />}
        {line.warehouse && <Fact label="Warehouse" value={line.warehouse} />}
        <Fact label="Added at" value={line.stage} />
        {!!line.pic && <Fact label="PIC" value={line.pic} />}
        <Fact label="Scan" value={<ScanMarks line={line} mode={view.mode} />} />
        {line.scanIn && <Fact label="Scanned in" value={stamp(line.scanIn)} />}
        {line.scanOut && <Fact label="Scanned out" value={stamp(line.scanOut)} />}
        {!!line.brokenWrittenOff && <Fact label="Written off" value={`${fmtNum(line.brokenWrittenOff)} broken`} />}
        {!!line.note && <Fact label="Note" value={line.note} />}
      </View>

      {broken && (
        <View style={{ gap: 8, padding: 12, borderRadius: radius.control, backgroundColor: color.redSoft }}>
          <Text variant="strong" style={{ color: color.redInk, fontSize: 14 }}>{`Broken item · ${line.brokenQty} of ${line.qty}`}</Text>
          {!!line.brokenNote && <Text variant="small" style={{ color: color.redInk }}>{line.brokenNote}</Text>}
          <Text variant="tiny" style={{ color: color.redInk }}>{`${line.brokenReportedBy ?? ""} · ${line.brokenReportedAt ? stamp(line.brokenReportedAt) : ""}`}</Text>
          {!!line.brokenPhotos?.length && (
            <View style={{ flexDirection: "row", gap: 6 }}>
              {line.brokenPhotos.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width: 56, height: 56, borderRadius: 6 }} />
              ))}
            </View>
          )}
          <Text variant="tiny" style={{ color: color.redInk }}>Taken out of the quantity when the event moves to the next stage.</Text>
        </View>
      )}

      {checking && store.writable && (
        <View style={{ gap: 8 }}>
          <Button
            variant={line.checked ? "secondary" : "outline"}
            icon={Check}
            title={line.checked ? "Cross-checked" : "Mark cross-checked"}
            onPress={() => store.toggleChecked(view.key, line.id)}
          />
          {line.resolution === "returned" ? (
            <Callout icon={Check} tone="green">Returned to the warehouse.</Callout>
          ) : (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                variant="positive"
                icon={Undo2}
                title="Return"
                style={{ flex: 1 }}
                onPress={() => {
                  store.returnLine(view.key, line.id)
                  toast.show(`${line.name} returned`, "success")
                  onClose()
                }}
              />
              <Button variant="outline" icon={ArrowRightLeft} title="Transfer" style={{ flex: 1 }} onPress={() => onMode("transfer")} />
            </View>
          )}
        </View>
      )}

      {canAct && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button variant="outline" icon={PackageX} title={broken ? "Edit report" : "Report broken"} style={{ flex: 1 }} onPress={() => onMode("broken")} />
            <Button variant="outline" icon={Pencil} title="Modify" style={{ flex: 1 }} onPress={() => onMode("modify")} />
          </View>
          {broken && (
            <Button
              variant="ghost"
              title="Remove broken report"
              onPress={() =>
                Alert.alert("Remove broken report?", "The full quantity will be used again.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Remove", style: "destructive", onPress: () => store.clearBroken(view.key, line.id) },
                ])
              }
            />
          )}
          {stage.allowDelete !== false && (
            <Button
              variant="destructive"
              icon={Trash2}
              title="Delete from event"
              onPress={() =>
                Alert.alert(`Delete ${line.name}?`, `It will be removed from ${view.event.name}.`, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      store.deleteLine(view.key, line.id)
                      onClose()
                    },
                  },
                ])
              }
            />
          )}
        </View>
      )}
      {!store.writable && <Callout icon={X} tone="neutral">View only.</Callout>}
    </>
  )
}

function BrokenForm({ view, line, onDone }: { view: EventView; line: EventLine; onDone: () => void }) {
  const store = useAppStore()
  const toast = useToast()
  const [qty, setQty] = React.useState(line.brokenQty || 1)
  const [note, setNote] = React.useState(line.brokenNote ?? "")
  const [photos, setPhotos] = React.useState<string[]>(line.brokenPhotos ?? [])
  const [tried, setTried] = React.useState(false)
  const noteError = tried && note.trim().length < 3 && "Say what happened"

  const onPicked = (res: ImagePickerResponse) => {
    if (res.didCancel) return
    if (res.errorCode === "permission")
      return Alert.alert("Camera access is off", "Allow it in Settings to add photos.", [
        { text: "Not now", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ])
    if (res.errorCode) return toast.show(res.errorCode === "camera_unavailable" ? "No camera on this device" : "Couldn't read that photo", "error")
    const uris = (res.assets ?? []).map((a) => a.uri).filter((u): u is string => !!u)
    setPhotos((p) => [...p, ...uris].slice(0, MAX_PHOTOS))
  }

  return (
    <>
      <Field label="Broken quantity" hint={`max ${fmtNum(line.qty)}`}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Stepper label="Broken quantity" value={qty} onChange={setQty} min={1} max={line.qty} />
          <Text variant="meta" style={tabular}>{`${fmtNum(line.qty - qty)} ${unitOf(line.name)} still used`}</Text>
        </View>
      </Field>
      <Field label="What happened?" error={noteError}>
        <Input value={note} onChangeText={setNote} multiline maxLength={300} placeholder="e.g. 3 legs cracked during loading" invalid={!!noteError} />
      </Field>
      <Field label={`Photos (${photos.length}/${MAX_PHOTOS})`}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {photos.map((uri, i) => (
            <View key={uri} style={{ width: 64, height: 64, borderRadius: radius.control, overflow: "hidden" }}>
              <Image source={{ uri }} style={{ width: "100%", height: "100%" }} accessibilityLabel={`Photo ${i + 1}`} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${i + 1}`}
                onPress={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                style={{ position: "absolute", top: 3, right: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" }}
              >
                <X size={13} color="#fff" />
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <>
              <PhotoButton icon={Camera} label="Camera" onPress={() => launchCamera({ ...PHOTO_OPTIONS, saveToPhotos: false }).then(onPicked, () => onPicked({ errorCode: "others" }))} />
              <PhotoButton
                icon={ImagePlus}
                label="Gallery"
                onPress={() => launchImageLibrary({ ...PHOTO_OPTIONS, selectionLimit: MAX_PHOTOS - photos.length }).then(onPicked, () => onPicked({ errorCode: "others" }))}
              />
            </>
          )}
        </View>
      </Field>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button variant="secondary" title="Cancel" style={{ flex: 1 }} onPress={onDone} />
        <Button
          variant="primary"
          title="Save report"
          style={{ flex: 1 }}
          onPress={() => {
            setTried(true)
            if (note.trim().length < 3) return
            store.reportBroken(view.key, line.id, { qty, note: note.trim(), photos })
            toast.show(`Broken item · ${qty} reported`, "success")
            onDone()
          }}
        />
      </View>
    </>
  )
}

function PhotoButton({ icon: Icon, label, onPress }: { icon: typeof Camera; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add photo from ${label.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [
        { width: 64, height: 64, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: radius.control, borderWidth: 1, borderStyle: "dashed", borderColor: color.faint },
        pressed && { backgroundColor: color.raised },
      ]}
    >
      <Icon size={18} color={color.muted} />
      <Text variant="tiny">{label}</Text>
    </Pressable>
  )
}

function ModifyForm({ view, line, onDone }: { view: EventView; line: EventLine; onDone: () => void }) {
  const store = useAppStore()
  const toast = useToast()
  const [area, setArea] = React.useState(line.area)
  const [subArea, setSubArea] = React.useState(line.subArea)
  const [qty, setQty] = React.useState(line.qty)
  const qtyEditable = canEditQty(line, view.stage.status)
  const subs = SUB_AREAS[area] ?? []

  return (
    <>
      <Field label="Area">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {AREAS.map((a) => (
            <Chip
              key={a}
              label={a}
              selected={a === area}
              onPress={() => {
                setArea(a)
                if (!(SUB_AREAS[a] ?? []).includes(subArea)) setSubArea("")
              }}
            />
          ))}
        </View>
      </Field>
      {subs.length > 0 && (
        <Field label="Sub area">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <Chip label="None" selected={!subArea} onPress={() => setSubArea("")} />
            {subs.map((s) => (
              <Chip key={s} label={s} selected={s === subArea} onPress={() => setSubArea(s)} />
            ))}
          </View>
        </Field>
      )}
      <Field label="Quantity">
        {qtyEditable ? (
          <Stepper label="Quantity" value={qty} onChange={setQty} min={1} />
        ) : (
          <View style={{ gap: 4 }}>
            <Text variant="strong" style={tabular}>{`${fmtNum(line.qty)} ${unitOf(line.name)}`}</Text>
            <Text variant="tiny">{`Added at "${line.stage}". Quantity can only change at the stage it was added.`}</Text>
          </View>
        )}
      </Field>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button variant="secondary" title="Cancel" style={{ flex: 1 }} onPress={onDone} />
        <Button
          variant="positive"
          title="Save"
          style={{ flex: 1 }}
          onPress={() => {
            store.modifyLine(view.key, line.id, { area, subArea, qty: qtyEditable ? qty : undefined })
            toast.show("Item updated", "success")
            onDone()
          }}
        />
      </View>
    </>
  )
}

function TransferForm({ view, line, onDone }: { view: EventView; line: EventLine; onDone: () => void }) {
  const store = useAppStore()
  const toast = useToast()
  // Targets: every other event still on-going (upcoming ones included: they have no items yet).
  const targets = store.events
    .map((e) => eventView(e, store, store.stages))
    .filter((v) => v.key !== view.key && (v.tab === "on-going" || v.tab === "upcoming"))
  const [target, setTarget] = React.useState<string | null>(null)
  const targetView = targets.find((t) => t.key === target)
  const [stage, setStage] = React.useState<string | null>(null)
  const stages = store.stages.filter((s) => !s.hold).sort((a, b) => a.order - b.order)

  return (
    <>
      <Field label="Move to event">
        <View style={{ gap: 6 }}>
          {targets.length === 0 && <Text variant="meta">No other event is open.</Text>}
          {targets.map((t) => (
            <Pressable
              key={t.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: t.key === target }}
              onPress={() => {
                setTarget(t.key)
                setStage(t.stage.status)
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 12,
                borderRadius: radius.control,
                borderWidth: t.key === target ? 2 : 1,
                borderColor: t.key === target ? color.brand : color.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text variant="strong" style={{ fontSize: 14 }}>{`${t.event.name} (${t.event.code})`}</Text>
                <Text variant="tiny">{t.stage.status}</Text>
              </View>
              {t.key === target && <Check size={16} color={color.brand} />}
            </Pressable>
          ))}
        </View>
      </Field>
      {targetView && (
        <Field label="Arrives at stage">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {stages.map((s) => (
              <Chip key={s.id} label={s.status} selected={s.status === stage} onPress={() => setStage(s.status)} />
            ))}
          </View>
        </Field>
      )}
      <Tag label={`Whole line · ${fmtNum(line.qty)} ${unitOf(line.name)}`} tone="neutral" />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button variant="secondary" title="Cancel" style={{ flex: 1 }} onPress={onDone} />
        <Button
          title="Confirm Transfer"
          style={{ flex: 1 }}
          disabled={!target || !stage || !findStage(store.stages, stage)}
          onPress={() => {
            store.transferLine(view.key, line.id, target!, stage!)
            toast.show(`Moved to ${targetView!.event.name}`, "success")
            onDone()
          }}
        />
      </View>
    </>
  )
}
