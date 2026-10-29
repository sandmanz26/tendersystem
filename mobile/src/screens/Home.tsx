import { CalendarX2, ChevronRight, Clock, MapPin, Navigation, Phone, ScanLine, TriangleAlert, Users } from "lucide-react-native"
import * as React from "react"
import { Pressable, ScrollView, View } from "react-native"

import { dayDiff, formatDate, mapsLink, relativeDay } from "../core/format"
import { getPerson } from "../core/lookup"
import { PHASES } from "../core/phases"
import { getEventProgress, isClosed, type PhaseProgress } from "../core/progress"
import { inMinutes, nowAndNext } from "../core/rundown"
import type { WeddingEvent } from "../core/types"
import { useNav } from "../navigation"
import { useAppStore } from "../store"
import { color, radius, tabular } from "../theme"
import { Header, ManifestGrid, PhaseTrack } from "../ui/domain"
import { ActionBar, Badge, Card, Chip, EmptyState, ListCard, Meta, MetaRow, SectionLabel, Text } from "../ui/primitives"
import { useMinuteTick } from "../ui/use-minute-tick"

/* Question: what do I have to do right now, and how much is left? */
export function HomeScreen() {
  const store = useAppStore()
  const { events, userId } = store
  const [tab, setTab] = React.useState<"upcoming" | "done">("upcoming")
  useMinuteTick()

  const mine = events.filter((e) => e.crew.some((c) => c.personId === userId)).sort((a, b) => a.date.localeCompare(b.date))
  // Live = not closed, and either today/past or already started (H-1 load-out).
  const active = mine
    .filter((e) => !isClosed(e) && (dayDiff(e.date) <= 0 || e.phaseIndex > 0))
    .sort((a, b) => Math.abs(dayDiff(a.date)) - Math.abs(dayDiff(b.date)))
  const upcoming = mine.filter((e) => !isClosed(e) && !active.includes(e))
  const done = mine.filter(isClosed).reverse()
  const [hero, ...otherActive] = active
  const list = tab === "upcoming" ? upcoming : done

  return (
    <View style={{ flex: 1 }}>
      <Header large title="Today" subtitle={new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {hero ? (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            <HeroCard event={hero} progress={getEventProgress(hero, store)} />
            <HeroActions event={hero} progress={getEventProgress(hero, store)} />
          </View>
        ) : (
          <EmptyState icon={CalendarX2} title="No live events" />
        )}

        {otherActive.length > 0 && (
          <>
            <SectionLabel>Also live</SectionLabel>
            <ListCard>
              {otherActive.map((e) => (
                <ActiveRow key={e.id} event={e} progress={getEventProgress(e, store)} />
              ))}
            </ListCard>
          </>
        )}

        <SectionLabel
          right={
            <View style={{ flexDirection: "row", gap: 6 }} accessibilityRole="radiogroup">
              <Chip label="Upcoming" count={upcoming.length} selected={tab === "upcoming"} onPress={() => setTab("upcoming")} />
              <Chip label="Done" count={done.length} selected={tab === "done"} onPress={() => setTab("done")} />
            </View>
          }
        >
          Schedule
        </SectionLabel>
        {list.length === 0 ? (
          <EmptyState icon={CalendarX2} title={tab === "upcoming" ? "Nothing scheduled" : "Nothing finished yet"} />
        ) : (
          <ListCard>
            {list.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ListCard>
        )}
      </ScrollView>
    </View>
  )
}

function HeroCard({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const nav = useNav()
  const phase = PHASES[event.phaseIndex]
  const { next, minutesToNext } = nowAndNext(event)
  if (!phase || !progress) return null
  const left = phase.requiresScan ? progress.pending.length : (phase.tasks?.length ?? 0) - progress.tasksDone.length

  return (
    <Pressable accessibilityRole="button" onPress={() => nav.navigate("EventDetail", { eventId: event.id })}>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, paddingBottom: 0 }}>
          <View style={{ flex: 1 }}>
            <Text variant="heading" numberOfLines={1} style={{ fontSize: 20 }}>
              {event.couple}
            </Text>
            <MetaRow style={{ marginTop: 4 }}>
              <Meta icon={MapPin} label="Venue">{event.venue.name}</Meta>
              <Meta icon={Clock} label="Event starts">{event.startTime}</Meta>
            </MetaRow>
          </View>
          <Badge label="Live" variant="accent" />
        </View>
        <View style={{ padding: 16, paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Text variant="figure" style={{ fontSize: 40 }}>{left}</Text>
              <Text muted>{phase.requiresScan ? "to scan" : "tasks left"}</Text>
            </View>
            <Text variant="small" style={{ fontWeight: "500" }}>{phase.label}</Text>
          </View>
          {phase.requiresScan && <ManifestGrid progress={progress} codes={event.assetCodes} style={{ marginTop: 12 }} />}
          <PhaseTrack index={event.phaseIndex} style={{ marginTop: 16 }} />
        </View>
        {next && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: color.rule, paddingHorizontal: 16, paddingVertical: 12 }}>
            <Clock size={16} color={color.muted} strokeWidth={1.75} />
            <Text variant="small" style={{ fontWeight: "500", ...tabular }}>{next.time}</Text>
            <Text variant="small" numberOfLines={1} style={{ flex: 1 }}>{next.label}</Text>
            <Text variant="meta">{inMinutes(minutesToNext!)}</Text>
          </View>
        )}
      </Card>
    </Pressable>
  )
}

function HeroActions({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const nav = useNav()
  const phase = PHASES[event.phaseIndex]
  const lead = getPerson(event.crew.find((c) => c.lead)?.personId ?? "")
  const scanning = !!phase?.requiresScan && !progress?.complete
  return (
    <ActionBar
      actions={[
        scanning
          ? { icon: ScanLine, label: "Scan", primary: true, onPress: () => nav.navigate("Scanner", { eventId: event.id }) }
          : { icon: ScanLine, label: "Event", primary: true, onPress: () => nav.navigate("EventDetail", { eventId: event.id }) },
        { icon: TriangleAlert, label: "Report", onPress: () => nav.navigate("NewReport", { eventId: event.id }) },
        ...(lead ? [{ icon: Phone, label: "Lead", url: `tel:${lead.phone}` }] : []),
        { icon: Navigation, label: "Map", url: mapsLink(`${event.venue.name} ${event.venue.address}`) },
      ]}
    />
  )
}

function ActiveRow({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const nav = useNav()
  const phase = PHASES[event.phaseIndex]
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (phase?.requiresScan ? nav.navigate("Scanner", { eventId: event.id }) : nav.navigate("EventDetail", { eventId: event.id }))}
      style={({ pressed }) => [{ paddingHorizontal: 16, paddingVertical: 12 }, pressed && { backgroundColor: color.raised }]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="strong" numberOfLines={1}>{event.couple}</Text>
          <Text variant="meta">{phase?.label}</Text>
        </View>
        {progress && phase.requiresScan && (
          <Text variant="strong" style={tabular}>
            {progress.pending.length}
            <Text muted style={{ fontWeight: "400" }}> left</Text>
          </Text>
        )}
        <ChevronRight size={16} color={color.muted} />
      </View>
      {progress && phase.requiresScan && <ManifestGrid progress={progress} codes={event.assetCodes} legend={false} cellHeight={10} style={{ marginTop: 10 }} />}
    </Pressable>
  )
}

function EventRow({ event }: { event: WeddingEvent }) {
  const nav = useNav()
  const closed = isClosed(event)
  const soon = !closed && dayDiff(event.date) <= 1
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => nav.navigate("EventDetail", { eventId: event.id })}
      style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }, pressed && { backgroundColor: color.raised }]}
    >
      <View style={{ width: 44, alignItems: "center", paddingVertical: 4, borderRadius: radius.control, backgroundColor: soon ? color.brandSoft : color.raised }}>
        <Text variant="tiny" style={{ color: soon ? color.brandInk : color.muted, fontWeight: "500" }}>
          {formatDate(event.date, { month: "short" })}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "600", color: soon ? color.brandInk : color.ink, ...tabular }}>
          {formatDate(event.date, { day: "numeric" })}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="strong" numberOfLines={1}>{event.couple}</Text>
        <MetaRow style={{ marginTop: 2 }}>
          <Text variant="meta" style={soon ? { color: color.ink, fontWeight: "500" } : undefined}>{relativeDay(event.date)}</Text>
          {!closed && <Meta icon={Clock} label="Call time">{event.callTime}</Meta>}
          <Meta icon={Users} label="Crew">{event.crew.length}</Meta>
        </MetaRow>
      </View>
      {closed ? <Badge label="Done" /> : <ChevronRight size={16} color={color.muted} />}
    </Pressable>
  )
}
