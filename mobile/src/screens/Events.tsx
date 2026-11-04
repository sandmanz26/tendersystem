import { CalendarDays, CalendarX2, MapPin, ScanLine, Search, X } from "lucide-react-native"
import * as React from "react"
import { Pressable, ScrollView, TextInput, View } from "react-native"

import { fmtNum, fmtRange } from "../core/format"
import { CLOSING_LABEL, type ClosingTab } from "../core/rules"
import { useNav } from "../navigation"
import { eventView, type EventView } from "../selectors"
import { useAppStore } from "../store"
import { color, font, mono, radius, tabular } from "../theme"
import { ClosingTag, Header, ScanBar } from "../ui/domain"
import { Chip, EmptyState, ListCard, Text } from "../ui/primitives"

const TABS: ClosingTab[] = ["on-going", "upcoming", "ready-to-close", "checking-inventory", "returned-completed", "transferred"]

export function EventsScreen() {
  const nav = useNav()
  const store = useAppStore()
  const [tab, setTab] = React.useState<ClosingTab>("on-going")
  const [q, setQ] = React.useState("")

  const all = store.events.map((e) => eventView(e, store, store.stages)).sort((a, b) => a.event.date.localeCompare(b.event.date))
  const s = q.trim().toLowerCase()
  const list = all.filter((v) => v.tab === tab).filter((v) => !s || `${v.event.name} ${v.event.code} ${v.event.location}`.toLowerCase().includes(s))

  return (
    <View style={{ flex: 1 }}>
      <Header large title="Events" subtitle={`Hi ${store.user?.name.split(" ")[0]}`} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <SearchInput value={q} onChangeText={setQ} placeholder="Event, code or city" />
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="radiogroup" contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingBottom: 12 }}>
          {TABS.map((t) => (
            <Chip key={t} label={CLOSING_LABEL[t]} count={all.filter((v) => v.tab === t).length} selected={tab === t} onPress={() => setTab(t)} />
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {list.length === 0 ? (
          <EmptyState icon={CalendarX2} title={s ? `No match for “${q}”` : `No ${CLOSING_LABEL[tab].toLowerCase()} events`} />
        ) : (
          <ListCard>
            {list.map((v) => (
              <EventRow key={v.key} v={v} onPress={() => nav.navigate("EventDetail", { eventKey: v.key })} />
            ))}
          </ListCard>
        )}
      </ScrollView>
    </View>
  )
}

function EventRow({ v, onPress }: { v: EventView; onPress: () => void }) {
  const { event, stage, lines, mode, waiting, tab } = v
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [{ paddingHorizontal: 14, paddingVertical: 12, gap: 6 }, pressed && { backgroundColor: color.raised }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontFamily: mono, fontSize: 12, color: color.muted, width: 34 }}>{event.code}</Text>
        <Text variant="strong" numberOfLines={1} style={{ flex: 1 }}>
          {event.name}
        </Text>
        {tab !== "on-going" && <ClosingTag tab={tab} />}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 42 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <CalendarDays size={13} color={color.faint} />
          <Text variant="meta" style={tabular}>
            {fmtRange(event.start, event.finish)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 }}>
          <MapPin size={13} color={color.faint} />
          <Text variant="meta" numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      </View>
      {tab === "on-going" || tab === "ready-to-close" ? (
        <View style={{ paddingLeft: 42, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {mode && <ScanLine size={13} color={color.brand} />}
            <Text variant="meta" style={{ color: mode ? color.brandInk : color.ink2, fontWeight: "600", flex: 1 }} numberOfLines={1}>
              {stage.status}
            </Text>
            <Text variant="meta" style={tabular}>
              {mode ? `${fmtNum(lines.length - waiting)}/${fmtNum(lines.length)} scanned ${mode}` : `${fmtNum(lines.length)} items`}
            </Text>
          </View>
          {mode && <ScanBar done={lines.length - waiting} total={lines.length} />}
        </View>
      ) : null}
    </Pressable>
  )
}

export function SearchInput(props: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 42,
        borderWidth: 1,
        borderColor: color.border,
        borderRadius: radius.control,
        backgroundColor: color.surface,
        paddingHorizontal: 12,
      }}
    >
      <Search size={16} color={color.faint} />
      <TextInput
        {...props}
        accessibilityLabel={props.placeholder}
        placeholderTextColor={color.faint}
        autoCorrect={false}
        style={{ flex: 1, fontSize: font.body, color: color.ink, paddingVertical: 0 }}
      />
      {!!props.value && (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => props.onChangeText("")}>
          <X size={16} color={color.muted} />
        </Pressable>
      )}
    </View>
  )
}
