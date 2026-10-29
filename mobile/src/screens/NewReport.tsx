import { usePreventRemove } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Camera, Check, ChevronDown, CloudOff, ImagePlus, Info, PackageX, Phone, TriangleAlert, X } from "lucide-react-native"
import * as React from "react"
import { Alert, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, TextInput, View } from "react-native"
import { launchCamera, launchImageLibrary, type ImagePickerResponse } from "react-native-image-picker"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { dayDiff, relativeDay } from "../core/format"
import { getAsset, getPerson } from "../core/lookup"
import { PHASES } from "../core/phases"
import { isClosed } from "../core/progress"
import type { ReportKind, Severity } from "../core/types"
import type { RootStackParamList } from "../navigation"
import { useAppStore } from "../store"
import { color, font, mono, radius, tabular } from "../theme"
import { CategoryIcon, Header, SEVERITY_DOT } from "../ui/domain"
import { Button, Callout, Chip, Text } from "../ui/primitives"
import { Sheet } from "../ui/sheet"
import { useToast } from "../ui/toast"
import { SearchInput } from "./EventDetail"

const ISSUE_CATEGORIES = ["Venue", "Vendor", "Transport", "Client", "Crew", "Security", "Other"]
const DAMAGE_TYPES = ["Minor damage", "Major damage", "Missing", "Short count"]
const SEVERITIES: Severity[] = ["Low", "Medium", "High"]
const MAX_PHOTOS = 4
const DESC_MIN = 10
const DESC_MAX = 500
// Downscaled on the phone so a few photos stay small in the offline queue.
const PHOTO_OPTIONS = { mediaType: "photo", maxWidth: 960, maxHeight: 960, quality: 0.7 } as const

export function NewReportScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "NewReport">) {
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const params = route.params ?? {}
  const { events, userId, addReport, reports, online } = useAppStore()

  const mine = events
    .filter((e) => e.crew.some((c) => c.personId === userId))
    .sort((a, b) => Number(isClosed(a)) - Number(isClosed(b)) || a.date.localeCompare(b.date))
  const initialEvent =
    mine.find((e) => e.id === params.eventId) ??
    mine.find((e) => !isClosed(e) && dayDiff(e.date) === 0) ??
    mine.find((e) => !isClosed(e))

  const [kind, setKind] = React.useState<ReportKind>(params.type === "damage" ? "damage" : "issue")
  const [eventId, setEventId] = React.useState(initialEvent?.id ?? "")
  const [assetCode, setAssetCode] = React.useState(
    params.assetCode && initialEvent?.assetCodes.includes(params.assetCode) ? params.assetCode : ""
  )
  const [category, setCategory] = React.useState("")
  const [severity, setSeverity] = React.useState<Severity>("Medium")
  const [description, setDescription] = React.useState("")
  const [photos, setPhotos] = React.useState<string[]>([])
  const [picker, setPicker] = React.useState<"event" | "asset" | null>(null)
  const [submitted, setSubmitted] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const event = events.find((e) => e.id === eventId)
  const asset = assetCode ? getAsset(assetCode) : undefined
  const phaseKey = event ? PHASES[Math.min(event.phaseIndex, PHASES.length - 1)].key : undefined
  const lead = event && getPerson(event.crew.find((c) => c.lead)?.personId ?? "")
  const dirty = !!(category || description.trim() || photos.length)

  // Back gesture, hardware back and the X all ask before throwing away a half-written report.
  usePreventRemove(dirty && !submitting, ({ data }) =>
    Alert.alert("Discard this report?", "Unsent text and photos will be lost.", [
      { text: "Keep writing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => navigation.dispatch(data.action) },
    ])
  )

  // Same asset already reported in this phase and still open: likely a duplicate.
  const existing =
    kind === "damage" && asset && event
      ? reports.find((r) => r.eventId === event.id && r.assetCode === asset.code && r.phase === phaseKey && r.status !== "Resolved")
      : undefined

  const desc = description.trim()
  // No title field to fill in: the title is built from what was picked and written.
  const words = desc.split(/\s+/).filter(Boolean)
  const title =
    kind === "damage"
      ? asset && category
        ? `${asset.name} · ${category.toLowerCase()}`
        : ""
      : category && words.length
        ? `${category}: ${words.slice(0, 7).join(" ")}${words.length > 7 ? "…" : ""}`
        : ""
  const errors = {
    event: !event,
    asset: kind === "damage" && !asset,
    category: !category,
    // A damage report is already described by its item, condition and photos.
    description: kind === "issue" ? desc.length < DESC_MIN : desc.length > 0 && desc.length < DESC_MIN,
  }
  const valid = !Object.values(errors).some(Boolean)
  const err = (k: keyof typeof errors) => submitted && errors[k]

  const submit = () => {
    if (submitting) return
    setSubmitted(true)
    if (!valid) {
      toast.show("Fill in the fields marked in red first", "error")
      return
    }
    setSubmitting(true)
    const report = addReport({
      eventId,
      kind,
      category,
      assetCode: kind === "damage" ? assetCode : undefined,
      severity,
      title,
      description: desc,
      photos,
    })
    toast.show(online ? `Report ${report.id} sent to the coordinator` : `Report ${report.id} saved, will send when online`, "success")
    navigation.replace("ReportDetail", { reportId: report.id })
  }

  const onPicked = (res: ImagePickerResponse) => {
    if (res.didCancel) return
    if (res.errorCode) {
      if (res.errorCode === "camera_unavailable") toast.show("No camera on this device", "error")
      else if (res.errorCode === "permission")
        Alert.alert("Camera access is off", "Allow it in Settings to add photos.", [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ])
      else toast.show("Couldn't read that photo. Try again.", "error")
      return
    }
    const uris = (res.assets ?? []).map((a) => a.uri).filter((u): u is string => !!u)
    setPhotos((p) => {
      const room = MAX_PHOTOS - p.length
      if (uris.length > room) toast.show(`Up to ${MAX_PHOTOS} photos. ${uris.length - room} not added.`)
      return [...p, ...uris].slice(0, MAX_PHOTOS)
    })
  }
  const fromCamera = () => launchCamera({ ...PHOTO_OPTIONS, saveToPhotos: false }).then(onPicked, () => onPicked({ errorCode: "others" }))
  const fromGallery = () =>
    launchImageLibrary({ ...PHOTO_OPTIONS, selectionLimit: MAX_PHOTOS - photos.length }).then(onPicked, () => onPicked({ errorCode: "others" }))

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.ground }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="New report" onBack={() => navigation.goBack()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 24 }}>
        {!online && <Callout icon={CloudOff}>Offline. Saved on this phone, sent later.</Callout>}

        <View style={{ flexDirection: "row", gap: 8 }}>
          {(
            [
              ["issue", "Issue", TriangleAlert],
              ["damage", "Damage", PackageX],
            ] as const
          ).map(([value, label, Icon]) => {
            const on = kind === value
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  setKind(value)
                  setCategory("")
                }}
                style={{
                  flex: 1,
                  height: 56,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderRadius: radius.card,
                  borderWidth: 1,
                  borderColor: on ? color.brand : color.control,
                  backgroundColor: on ? color.brandSoft : color.surface,
                }}
              >
                <Icon size={20} color={value === "damage" ? color.warning : color.muted} strokeWidth={1.6} />
                <Text variant="strong">{label}</Text>
              </Pressable>
            )
          })}
        </View>

        <Field label="Event" error={err("event") && "Pick an event"}>
          <PickerButton onPress={() => setPicker("event")} invalid={err("event")}>
            {event ? (
              <>
                <Text variant="strong" numberOfLines={1}>
                  {event.couple}
                </Text>
                <Text variant="tiny" numberOfLines={1}>{`${relativeDay(event.date)} · ${event.venue.name}`}</Text>
              </>
            ) : (
              <Text muted>{mine.length ? "Pick an event" : "You aren't assigned to any event yet"}</Text>
            )}
          </PickerButton>
          {event && isClosed(event) && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Info size={14} color={color.muted} />
              <Text variant="tiny">Closed event · kept on record</Text>
            </View>
          )}
        </Field>

        {kind === "damage" && (
          <Field label="Item" error={err("asset") && "Pick the affected item"}>
            <PickerButton onPress={() => setPicker("asset")} disabled={!event} invalid={err("asset")}>
              {asset ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <CategoryIcon category={asset.category} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="strong" numberOfLines={1}>
                      {asset.name}
                    </Text>
                    <Text variant="tiny" style={{ fontFamily: mono }}>
                      {asset.code}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text muted>{event ? "Pick item" : "Pick an event first"}</Text>
              )}
            </PickerButton>
            {existing && (
              <Pressable accessibilityRole="link" onPress={() => navigation.replace("ReportDetail", { reportId: existing.id })}>
                <Callout icon={Info} tone="info">{`Already reported · update ${existing.id}`}</Callout>
              </Pressable>
            )}
          </Field>
        )}

        <Field label={kind === "damage" ? "Condition" : "Category"} error={err("category") && "Pick one"}>
          <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {(kind === "damage" ? DAMAGE_TYPES : ISSUE_CATEGORIES).map((c) => (
              <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>
        </Field>

        <Field label={`Photos (${photos.length}/${MAX_PHOTOS})`}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {photos.map((uri, i) => (
              <View key={uri} style={{ width: "23%", aspectRatio: 1, borderRadius: radius.control, overflow: "hidden", borderWidth: 1, borderColor: color.border }}>
                <Image source={{ uri }} style={{ width: "100%", height: "100%" }} accessibilityLabel={`Photo ${i + 1}`} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${i + 1}`}
                  hitSlop={6}
                  onPress={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && <PhotoButton icon={Camera} label="Camera" onPress={fromCamera} />}
            {photos.length < MAX_PHOTOS - 1 && <PhotoButton icon={ImagePlus} label="Gallery" onPress={fromGallery} />}
          </View>
        </Field>

        <Field label="Urgency">
          <View style={{ flexDirection: "row", gap: 4, padding: 4, borderRadius: radius.control, backgroundColor: color.raised }}>
            {SEVERITIES.map((s) => {
              const on = severity === s
              return (
                <Pressable
                  key={s}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setSeverity(s)}
                  style={[
                    { flex: 1, height: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: radius.control },
                    on && { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
                  ]}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SEVERITY_DOT[s] }} />
                  <Text variant="meta" style={[{ fontWeight: "600" }, on && { color: color.ink }]}>
                    {s}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          {severity === "High" && lead && (
            <Button
              variant="destructive"
              icon={Phone}
              title={`Also call ${lead.name.split(" ")[0]}`}
              onPress={() => Linking.openURL(`tel:${lead.phone}`).catch(() => {})}
            />
          )}
        </Field>

        <Field
          label={kind === "damage" ? "Note (optional)" : "What happened?"}
          error={err("description") && `At least ${DESC_MIN} characters`}
          hint={`${desc.length}/${DESC_MAX}`}
        >
          <TextInput
            value={description}
            onChangeText={(v) => setDescription(v.slice(0, DESC_MAX))}
            placeholder={kind === "damage" ? "e.g. 2 glasses cracked" : "Where, what, what you did"}
            placeholderTextColor={color.muted}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 96,
              borderWidth: err("description") ? 2 : 1,
              borderColor: err("description") ? color.negative : color.control,
              borderRadius: radius.control,
              backgroundColor: color.surface,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: font.body,
              color: color.ink,
            }}
          />
        </Field>
      </ScrollView>

      <View style={{ borderTopWidth: 1, borderTopColor: color.border, backgroundColor: color.surface, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 14) }}>
        <Button size="lg" title={online ? "Send report" : "Save report"} disabled={submitting} onPress={submit} />
      </View>

      <Sheet visible={picker === "event"} onClose={() => setPicker(null)} title="Pick an event" subtitle="Events you're assigned to">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 8 }}>
          {mine.map((e) => (
            <SheetRow
              key={e.id}
              selected={e.id === eventId}
              onPress={() => {
                setEventId(e.id)
                if (!e.assetCodes.includes(assetCode)) setAssetCode("")
                setPicker(null)
              }}
            >
              <Text variant="strong" numberOfLines={1}>
                {e.couple}
              </Text>
              <Text variant="tiny" numberOfLines={1}>{`${relativeDay(e.date)} · ${e.venue.name}${isClosed(e) ? " · done" : ""}`}</Text>
            </SheetRow>
          ))}
        </ScrollView>
      </Sheet>

      <AssetPicker
        visible={picker === "asset"}
        onClose={() => setPicker(null)}
        codes={event?.assetCodes ?? []}
        value={assetCode}
        onPick={(c) => {
          setAssetCode(c)
          setPicker(null)
        }}
      />
    </KeyboardAvoidingView>
  )
}

function Field({ label, error, hint, children }: { label: string; error?: string | false; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="small" style={[{ fontWeight: "600" }, !!error && { color: color.negative }]}>
          {label}
        </Text>
        {hint && <Text variant="tiny" style={tabular}>{hint}</Text>}
      </View>
      {children}
      {!!error && (
        <Text variant="tiny" accessibilityRole="alert" style={{ color: color.negative, fontWeight: "500" }}>
          {error}
        </Text>
      )}
    </View>
  )
}

function PickerButton({ children, invalid, disabled, onPress }: { children: React.ReactNode; invalid?: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 56,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: radius.control,
          borderWidth: invalid ? 2 : 1,
          borderColor: invalid ? color.negative : color.control,
          backgroundColor: disabled ? color.raised : color.surface,
        },
        pressed && { backgroundColor: color.raised },
      ]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      <ChevronDown size={16} color={color.muted} />
    </Pressable>
  )
}

function PhotoButton({ icon: Icon, label, onPress }: { icon: typeof Camera; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add photo from ${label.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: "23%",
          aspectRatio: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          borderRadius: radius.card,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: color.faint,
          backgroundColor: color.surface,
        },
        pressed && { backgroundColor: color.raised },
      ]}
    >
      <Icon size={20} color={color.muted} />
      <Text variant="tiny" style={{ fontWeight: "500" }}>
        {label}
      </Text>
    </Pressable>
  )
}

function SheetRow({ selected, onPress, children }: { selected?: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderRadius: radius.card },
        pressed && { backgroundColor: color.raised },
      ]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      {selected && <Check size={16} color={color.brand} />}
    </Pressable>
  )
}

function AssetPicker({
  visible,
  onClose,
  codes,
  value,
  onPick,
}: {
  visible: boolean
  onClose: () => void
  codes: string[]
  value: string
  onPick: (code: string) => void
}) {
  const [q, setQ] = React.useState("")
  const s = q.trim().toLowerCase()
  const assets = codes
    .map((c) => getAsset(c))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .filter((a) => !s || a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s))

  return (
    <Sheet visible={visible} onClose={onClose} title="Pick an item" tall>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <SearchInput value={q} onChangeText={setQ} placeholder="Search name or code" />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 8 }}>
        {assets.length === 0 && (
          <Text variant="small" muted style={{ textAlign: "center", paddingVertical: 32 }}>
            {`No items match “${q}”`}
          </Text>
        )}
        {assets.map((a) => (
          <SheetRow key={a.code} selected={a.code === value} onPress={() => onPick(a.code)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <CategoryIcon category={a.category} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="strong" numberOfLines={1} style={{ fontSize: 14 }}>
                  {a.name}
                </Text>
                <Text variant="tiny" numberOfLines={1}>
                  <Text variant="tiny" style={{ fontFamily: mono }}>
                    {a.code}
                  </Text>
                  {` · ${a.unit}`}
                </Text>
              </View>
            </View>
          </SheetRow>
        ))}
      </ScrollView>
    </Sheet>
  )
}
