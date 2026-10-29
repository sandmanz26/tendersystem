import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { CalendarDays, ChevronRight, Clock, CloudOff, Layers, SendHorizontal, Tag, User } from "lucide-react-native"
import * as React from "react"
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from "react-native"

import { stamp } from "../core/format"
import { getAsset, getPerson, personName } from "../core/lookup"
import { PHASES } from "../core/phases"
import { useNav, type RootStackParamList } from "../navigation"
import { useAppStore } from "../store"
import { color, font, mono, radius } from "../theme"
import { Avatar, CategoryIcon, Header, SEVERITY_DOT, STATUS_VARIANT } from "../ui/domain"
import { Badge, Button, Card, ListCard, Meta, MetaRow, SectionLabel, Text } from "../ui/primitives"
import { useToast } from "../ui/toast"
import { NotFound } from "./NotFound"

export function ReportDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "ReportDetail">) {
  const nav = useNav()
  const toast = useToast()
  const { reports, events, addReportUpdate } = useAppStore()
  const [note, setNote] = React.useState("")
  const [preview, setPreview] = React.useState<string | null>(null)

  const report = reports.find((r) => r.id === route.params.reportId)
  const event = report && events.find((e) => e.id === report.eventId)
  if (!report || !event) return <NotFound onBack={() => navigation.goBack()} />
  const asset = report.assetCode ? getAsset(report.assetCode) : undefined
  const author = getPerson(report.by)
  const resolved = report.status === "Resolved"
  const thread = [{ at: report.createdAt, by: report.by, text: "Created the report" }, ...report.updates]

  const send = () => {
    const text = note.trim()
    if (!text) return
    // A note on a resolved report means it isn't really resolved.
    addReportUpdate(report.id, text, resolved ? "In progress" : undefined)
    setNote("")
    toast.show(resolved ? "Report reopened with your update" : "Update sent", "success")
  }
  const markResolved = () => {
    addReportUpdate(report.id, note.trim() || "Marked as resolved", "Resolved")
    setNote("")
    toast.show("Report marked as resolved", "success")
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title={report.id} subtitle={event.couple} onBack={() => navigation.goBack()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        <Card style={{ marginHorizontal: 16, marginTop: 16, padding: 16 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <Badge label={report.status} variant={STATUS_VARIANT[report.status]} />
            <Badge label={report.severity} variant="outline" dot={resolved ? color.faint : SEVERITY_DOT[report.severity]} />
            <Badge label={report.kind === "damage" ? "Damage" : "Issue"} variant="neutral" />
            {report.synced === false && <Badge label="Queued" variant="warning" />}
          </View>
          <Text variant="heading" style={{ fontSize: 20, fontWeight: "700", marginTop: 12 }}>
            {report.title}
          </Text>
          <Text style={{ marginTop: 8, color: "#2b2f36" }}>{report.description}</Text>
          <MetaRow style={{ marginTop: 12 }}>
            <Meta icon={Tag} label={report.kind === "damage" ? "Condition" : "Category"}>
              {report.category}
            </Meta>
            <Pressable accessibilityRole="link" onPress={() => nav.push("EventDetail", { eventId: event.id, tab: "reports" })}>
              <Meta icon={CalendarDays} label="Event" textStyle={{ textDecorationLine: "underline" }}>
                {event.couple}
              </Meta>
            </Pressable>
            <Meta icon={Layers} label="Phase">
              {PHASES.find((p) => p.key === report.phase)?.short}
            </Meta>
            <Meta icon={User} label="Reported by">
              {author?.name.split(" ")[0] ?? "Unknown"}
            </Meta>
            <Meta icon={Clock} label="Reported">
              {stamp(report.createdAt)}
            </Meta>
          </MetaRow>
          {report.photos.length > 0 && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              {report.photos.map((uri, i) => (
                <Pressable
                  key={i}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Photo ${i + 1}`}
                  onPress={() => setPreview(uri)}
                  style={{ width: "23%", aspectRatio: 1, borderRadius: radius.card, overflow: "hidden", backgroundColor: color.raised }}
                >
                  <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        {asset && (
          <>
            <SectionLabel>Item</SectionLabel>
            <ListCard>
              <Pressable
                accessibilityRole="button"
                onPress={() => nav.push("ItemDetail", { code: asset.code, eventId: event.id })}
                style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }, pressed && { backgroundColor: color.raised }]}
              >
                <CategoryIcon category={asset.category} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="small" numberOfLines={1} style={{ fontWeight: "500" }}>
                    {asset.name}
                  </Text>
                  <Text variant="tiny" numberOfLines={1}>
                    <Text variant="tiny" style={{ fontFamily: mono }}>
                      {asset.code}
                    </Text>
                    {` · ${asset.location}`}
                  </Text>
                </View>
                <ChevronRight size={16} color={color.muted} />
              </Pressable>
            </ListCard>
          </>
        )}

        <SectionLabel>Activity</SectionLabel>
        <Card style={{ marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 4 }}>
          {thread.map((u, i) => {
            const person = getPerson(u.by)
            return (
              <View key={i} style={{ flexDirection: "row", gap: 12, paddingVertical: 12 }}>
                {person && <Avatar person={person} size={28} />}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="meta" style={{ color: color.ink }}>
                    <Text variant="meta" style={{ color: color.ink, fontWeight: "500" }}>
                      {personName(u.by)}
                    </Text>
                    <Text variant="meta">{` · ${stamp(u.at)}`}</Text>
                  </Text>
                  <Text variant="small" muted={i === 0} style={{ marginTop: 2 }}>
                    {u.text}
                  </Text>
                </View>
              </View>
            )
          })}
        </Card>

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={resolved ? "Update to reopen" : "Add an update"}
            placeholderTextColor={color.muted}
            maxLength={500}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 80,
              borderWidth: 1,
              borderColor: color.control,
              borderRadius: radius.control,
              backgroundColor: color.surface,
              paddingHorizontal: 12,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: font.body,
              color: color.ink,
            }}
          />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            {!resolved && <Button variant="outline" title="Mark resolved" onPress={markResolved} style={{ flex: 1 }} />}
            <Button icon={SendHorizontal} title="Send update" disabled={!note.trim()} onPress={send} style={{ flex: 1 }} />
          </View>
        </View>
        {report.synced === false && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingTop: 12 }}>
            <CloudOff size={12} color={color.muted} />
            <Text variant="tiny">Saved on this phone, sends when online</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          onPress={() => setPreview(null)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          {preview && <Image source={{ uri: preview }} resizeMode="contain" style={{ width: "100%", height: "80%", borderRadius: radius.card }} />}
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  )
}
