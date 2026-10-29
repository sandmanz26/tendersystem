import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import {
  ArrowRight,
  Check,
  CircleCheck,
  CircleDashed,
  ClipboardList,
  Clock,
  CloudOff,
  EyeOff,
  Info,
  MapPin,
  Navigation,
  PackageSearch,
  PackageX,
  Palette,
  PartyPopper,
  PenLine,
  Phone,
  ScanLine,
  Search,
  TriangleAlert,
  Truck,
  Users,
} from "lucide-react-native"
import * as React from "react"
import { Linking, Pressable, ScrollView, TextInput, View } from "react-native"

import { clock, formatDate, mapsLink, stamp } from "../core/format"
import { getAsset, getPerson, personName } from "../core/lookup"
import { PHASES } from "../core/phases"
import { getEventProgress, isClosed, type PhaseProgress } from "../core/progress"
import { inMinutes, nowAndNext } from "../core/rundown"
import type { WeddingEvent } from "../core/types"
import type { EventTab, RootStackParamList } from "../navigation"
import { useNav } from "../navigation"
import { useAppStore } from "../store"
import { color, font, mono, radius, tabular } from "../theme"
import { CategoryIcon, Header, ManifestGrid, PersonRow, PhaseTrack, ReportRow } from "../ui/domain"
import { PhaseCompleteSheet } from "../ui/phase-complete"
import { ActionBar, Badge, Button, Callout, Card, Chip, EmptyState, ListCard, Meta, MetaRow, SectionLabel, Text } from "../ui/primitives"
import { SignaturePreview } from "../ui/signature-pad"
import { useMinuteTick } from "../ui/use-minute-tick"
import { NotFound } from "./NotFound"

const TABS: { key: EventTab; label: string }[] = [
  { key: "info", label: "Info" },
  { key: "items", label: "Items" },
  { key: "team", label: "Team" },
  { key: "reports", label: "Reports" },
]

export function EventDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "EventDetail">) {
  const store = useAppStore()
  const { events, reports, userId } = store
  const event = events.find((e) => e.id === route.params.eventId)
  const [tab, setTab] = React.useState<EventTab>(route.params.tab ?? "info")
  const scrollRef = React.useRef<ScrollView>(null)
  const tabsY = React.useRef(0)
  useMinuteTick()

  // A chosen tab scrolls its content up under the sticky tab row.
  const chooseTab = (t: EventTab) => {
    setTab(t)
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: tabsY.current, animated: true }))
  }
  const deepTab = route.params.tab
  React.useEffect(() => {
    if (deepTab && deepTab !== "info") setTimeout(() => scrollRef.current?.scrollTo({ y: tabsY.current, animated: false }), 50)
  }, [deepTab])

  if (!event) return <NotFound onBack={() => navigation.goBack()} />
  const progress = getEventProgress(event, store)
  const eventReports = reports.filter((r) => r.eventId === event.id)
  const assigned = event.crew.some((c) => c.personId === userId)
  const counts: Record<EventTab, number | undefined> = {
    info: undefined,
    items: event.assetCodes.length,
    team: event.crew.length,
    reports: eventReports.length,
  }

  return (
    <View style={{ flex: 1 }}>
      <Header title={event.couple} subtitle={`${event.kind} · ${event.venue.name}`} onBack={() => navigation.goBack()} />
      <ScrollView ref={scrollRef} stickyHeaderIndices={[1]} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
          {/* Object header: the event itself, dated like its invitation. */}
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}>
            <View style={{ width: 50, alignItems: "center", paddingVertical: 6, borderRadius: radius.control, backgroundColor: color.brandSoft }}>
              <Text variant="tiny" style={{ color: color.brandInk, fontWeight: "500" }}>{formatDate(event.date, { month: "short" })}</Text>
              <Text style={{ fontSize: 22, fontWeight: "600", color: color.brandInk, ...tabular }}>{formatDate(event.date, { day: "numeric" })}</Text>
              <Text variant="tiny" style={{ color: color.brandInk }}>{formatDate(event.date, { weekday: "short" })}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="title" numberOfLines={1} style={{ fontSize: 22 }}>{event.couple}</Text>
              <MetaRow style={{ marginTop: 6 }}>
                <Meta icon={Clock} label="Call time" textStyle={{ color: color.ink, fontSize: font.small }}>{event.callTime}</Meta>
                <Meta icon={PartyPopper} label="Event" textStyle={{ color: color.ink, fontSize: font.small }}>{`${event.startTime}–${event.endTime}`}</Meta>
                <Meta icon={Users} label="Guests" textStyle={{ color: color.ink, fontSize: font.small }}>{event.guests}</Meta>
              </MetaRow>
            </View>
          </Card>

          {!assigned && <Callout icon={EyeOff} tone="info">View only. You're not on this crew.</Callout>}
          {assigned && <EventActions event={event} progress={progress} />}
          <NowNext event={event} />
          <PhasePanel event={event} progress={progress} canAct={assigned} />
        </View>

        <View
          onLayout={(e) => (tabsY.current = e.nativeEvent.layout.y)}
          style={{ backgroundColor: color.ground, borderBottomWidth: 1, borderBottomColor: color.border, marginTop: 16 }}
        >
          <View style={{ flexDirection: "row", gap: 22, paddingHorizontal: 16 }} accessibilityRole="tablist">
            {TABS.map((t) => (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t.key }}
                onPress={() => chooseTab(t.key)}
                style={{ height: 44, justifyContent: "center", borderBottomWidth: 2, borderBottomColor: tab === t.key ? color.ink : "transparent", marginBottom: -1 }}
              >
                <Text variant="small" style={{ fontWeight: "500", color: tab === t.key ? color.ink : color.muted }}>
                  {t.label}
                  {counts[t.key] !== undefined && <Text variant="meta">{`  ${counts[t.key]}`}</Text>}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          {tab === "info" && <InfoTab event={event} />}
          {tab === "items" && <ItemsTab event={event} progress={progress} />}
          {tab === "team" && <TeamTab event={event} />}
          {tab === "reports" && (
            <View>
              <ActionBar
                style={{ marginHorizontal: 16, marginTop: 12 }}
                actions={[
                  { icon: TriangleAlert, label: "Issue", onPress: () => navigation.navigate("NewReport", { eventId: event.id, type: "issue" }) },
                  { icon: PackageX, label: "Damage", onPress: () => navigation.navigate("NewReport", { eventId: event.id, type: "damage" }) },
                ]}
              />
              {eventReports.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No reports" />
              ) : (
                <ListCard style={{ marginTop: 12 }}>
                  {eventReports.map((r) => (
                    <ReportRow key={r.id} report={r} onPress={() => navigation.navigate("ReportDetail", { reportId: r.id })} />
                  ))}
                </ListCard>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

function EventActions({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const nav = useNav()
  const lead = getPerson(event.crew.find((c) => c.lead)?.personId ?? "")
  const scanning = !!progress?.phase.requiresScan && !progress.complete
  return (
    <ActionBar
      actions={[
        { icon: ScanLine, label: "Scan", primary: scanning, disabled: !progress?.phase.requiresScan, onPress: () => nav.navigate("Scanner", { eventId: event.id }) },
        { icon: TriangleAlert, label: "Report", onPress: () => nav.navigate("NewReport", { eventId: event.id }) },
        ...(lead ? [{ icon: Phone, label: "Lead", url: `tel:${lead.phone}` }] : []),
        { icon: Navigation, label: "Map", url: mapsLink(`${event.venue.name} ${event.venue.address}`) },
      ]}
    />
  )
}

function NowNext({ event }: { event: WeddingEvent }) {
  const { now, next, minutesToNext } = nowAndNext(event)
  if (!now && !next) return null
  return (
    <ListCard style={{ marginHorizontal: 0 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10 }} accessibilityLabel={`Now: ${now?.label ?? "Not started"}`}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.brand }} />
        <Text variant="small" numberOfLines={1} style={{ flex: 1, fontWeight: "600" }}>{now ? now.label : "Not started"}</Text>
        {now && <Text variant="meta">{now.time}</Text>}
      </View>
      {next && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10 }} accessibilityLabel={`Next: ${next.label} at ${next.time}`}>
          <Clock size={14} color={color.muted} strokeWidth={1.75} />
          <Text variant="small" numberOfLines={1} style={{ flex: 1 }}>{next.label}</Text>
          <Text variant="meta">{`${next.time} · ${inMinutes(minutesToNext!)}`}</Text>
        </View>
      )}
    </ListCard>
  )
}

function PhasePanel({ event, progress, canAct }: { event: WeddingEvent; progress: PhaseProgress | null; canAct: boolean }) {
  const { phaseLog, toggleTask } = useAppStore()
  const [sheet, setSheet] = React.useState(false)

  if (!progress || isClosed(event)) {
    const last = phaseLog[event.id]?.at(-1)
    return (
      <Card style={{ padding: 16 }}>
        <PhaseTrack index={PHASES.length} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
          <CircleCheck size={20} color={color.positive} />
          <View>
            <Text variant="strong">Complete · all items back</Text>
            {last && <Text variant="meta">{`Closed ${stamp(last.at)} · ${personName(last.by)}`}</Text>}
          </View>
        </View>
      </Card>
    )
  }

  const { phase } = progress
  const left = phase.requiresScan ? progress.pending.length : (phase.tasks?.length ?? 0) - progress.tasksDone.length
  const next = PHASES[event.phaseIndex + 1]

  return (
    <Card>
      <View style={{ padding: 16 }}>
        <PhaseTrack index={event.phaseIndex} />
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 16 }}>
          <Text variant="heading">{phase.label}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {phase.handover && <PenLine size={14} color={color.muted} accessibilityLabel={`${phase.handover.party} signs off`} />}
            <Text variant="meta">{`${event.phaseIndex + 1}/${PHASES.length}`}</Text>
          </View>
        </View>

        {phase.requiresScan && (
          <>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 10 }}>
              <Text variant="figure" style={{ fontSize: 32 }}>{left}</Text>
              <Text muted>{left === 0 ? "all done" : "to scan"}</Text>
            </View>
            <ManifestGrid progress={progress} codes={event.assetCodes} style={{ marginTop: 10 }} />
          </>
        )}

        {phase.tasks && (
          <View style={{ marginTop: 8 }}>
            {phase.tasks.map((task) => {
              const checked = progress.tasksDone.includes(task)
              return (
                <Pressable
                  key={task}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked, disabled: !canAct }}
                  disabled={!canAct}
                  onPress={() => toggleTask(event.id, task)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 1.5,
                      borderColor: checked ? color.brand : color.faint,
                      backgroundColor: checked ? color.brand : color.surface,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {checked && <Check size={14} color="#fff" strokeWidth={3} />}
                  </View>
                  <Text style={{ flex: 1, color: checked ? color.muted : color.ink }}>{task}</Text>
                </Pressable>
              )
            })}
          </View>
        )}
      </View>

      {canAct && (progress.complete || !phase.requiresScan) && (
        <View style={{ borderTopWidth: 1, borderTopColor: color.rule, padding: 12 }}>
          <Button
            size="lg"
            disabled={!progress.complete}
            icon={progress.complete ? ArrowRight : undefined}
            title={progress.complete ? (next ? next.label : "Close event") : `${left} left`}
            onPress={() => setSheet(true)}
          />
        </View>
      )}
      <PhaseCompleteSheet event={event} progress={progress} visible={sheet} onClose={() => setSheet(false)} />
    </Card>
  )
}

function InfoTab({ event }: { event: WeddingEvent }) {
  const { phaseLog } = useAppStore()
  const { now: current } = nowAndNext(event)
  const currentIdx = current ? event.rundown.indexOf(current) : -1
  const lead = getPerson(event.crew.find((c) => c.lead)?.personId ?? "")
  const log = phaseLog[event.id] ?? []
  const hasNote = !!event.venue.loadingNote && event.venue.loadingNote.trim() !== "—"

  return (
    <View>
      <SectionLabel>Location</SectionLabel>
      <ListCard>
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(mapsLink(`${event.venue.name} ${event.venue.address}`)).catch(() => {})}
          style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}
        >
          <MapPin size={18} color={color.muted} strokeWidth={1.75} />
          <View style={{ flex: 1 }}>
            <Text variant="strong">{event.venue.name}</Text>
            <Text variant="meta" numberOfLines={1}>{event.venue.address}</Text>
          </View>
          <Navigation size={16} color={color.muted} strokeWidth={1.75} />
        </Pressable>
        {hasNote && (
          <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
            <Truck size={18} color={color.muted} strokeWidth={1.75} accessibilityLabel="Loading" />
            <Text variant="small" style={{ flex: 1 }}>{event.venue.loadingNote}</Text>
          </View>
        )}
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Palette size={18} color={color.muted} strokeWidth={1.75} accessibilityLabel="Theme" />
          <Text variant="small" style={{ flex: 1 }}>{event.theme}</Text>
        </View>
      </ListCard>

      <SectionLabel>Rundown</SectionLabel>
      <Card style={{ marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        {event.rundown.map((r, i) => {
          const isNow = r === current
          const past = !isNow && currentIdx >= 0 && i < currentIdx
          return (
            <View key={i} style={{ flexDirection: "row", gap: 12 }}>
              <Text variant="small" style={{ width: 44, color: past ? color.muted : color.ink, fontWeight: past ? "400" : "600", ...tabular }}>{r.time}</Text>
              <View
                style={{
                  marginTop: 6,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  borderWidth: 2,
                  borderColor: isNow ? color.brand : past ? "#c4c7cd" : color.faint,
                  backgroundColor: isNow ? color.brand : past ? "#c4c7cd" : color.surface,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: past ? color.muted : color.ink, fontWeight: isNow ? "600" : "400" }}>
                  {r.label}
                  {isNow && <Text variant="meta" style={{ color: color.brandInk, fontWeight: "500" }}>  Now</Text>}
                </Text>
                {r.crewNote && <Text variant="meta" style={{ color: color.warning, fontWeight: "500" }}>{r.crewNote}</Text>}
              </View>
            </View>
          )
        })}
      </Card>

      {event.notes.length > 0 && (
        <>
          <SectionLabel>Crew notes</SectionLabel>
          <ListCard>
            {event.notes.map((n, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
                <Info size={18} color={color.muted} strokeWidth={1.75} />
                <Text variant="small" style={{ flex: 1 }}>{n}</Text>
              </View>
            ))}
          </ListCard>
        </>
      )}

      <SectionLabel>Key contacts</SectionLabel>
      <ListCard>
        {lead && <PersonRow person={lead} detail="Lead" />}
        <PersonRow person={{ id: "c0", name: event.client.name, role: event.client.relation, phone: event.client.phone }} detail={event.client.relation} />
        <PersonRow person={{ id: "c1", name: event.venue.pic.name.replace(/\s*\(.*\)/, ""), role: "Venue", phone: event.venue.pic.phone }} detail="Venue" />
      </ListCard>

      {log.length > 0 && (
        <>
          <SectionLabel>Phase history</SectionLabel>
          <ListCard>
            {log.map((entry, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
                <CircleCheck size={18} color={color.brand} />
                <View style={{ flex: 1 }}>
                  <Text variant="small" style={{ fontWeight: "500" }}>{PHASES.find((p) => p.key === entry.phase)?.label}</Text>
                  <Text variant="meta">
                    {`${stamp(entry.at)} · ${personName(entry.by)}`}
                    {entry.handover ? ` · signed ${entry.handover.name}` : ""}
                  </Text>
                </View>
                {entry.handover && <SignaturePreview path={entry.handover.signature} size={entry.handover.signatureSize} />}
              </View>
            ))}
          </ListCard>
        </>
      )}
    </View>
  )
}

type ItemFilter = "all" | "pending" | "issue"

function ItemsTab({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const nav = useNav()
  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState<ItemFilter>("all")
  const scanPhase = progress?.phase.requiresScan
  const s = q.trim().toLowerCase()

  const items = event.assetCodes
    .map((code) => getAsset(code)!)
    .filter((a) => !s || a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s))
    .filter((a) => {
      if (filter === "all" || !progress) return true
      const st = progress.byAsset[a.code]
      if (filter === "pending") return st.state === "pending"
      return st.state === "reported" || progress.flagged.includes(a.code) || a.condition !== "Good"
    })
  const groups = Object.entries(
    items.reduce<Record<string, typeof items>>((acc, a) => {
      acc[a.category] = [...(acc[a.category] ?? []), a]
      return acc
    }, {})
  )

  return (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
        <SearchInput value={q} onChangeText={setQ} placeholder="Search name or code" />
        {scanPhase && (
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Chip label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
            <Chip label="Left" count={progress!.pending.length} selected={filter === "pending"} onPress={() => setFilter("pending")} />
            <Chip label="Flagged" selected={filter === "issue"} onPress={() => setFilter("issue")} />
          </View>
        )}
      </View>
      {groups.length === 0 && <EmptyState icon={PackageSearch} title={s ? `No match for “${q}”` : "Nothing here"} />}
      {groups.map(([category, assets]) => (
        <View key={category}>
          <SectionLabel>{`${category} · ${assets.length}`}</SectionLabel>
          <ListCard>
            {assets.map((a) => {
              const st = progress?.byAsset[a.code]
              const flagged = !!progress?.flagged.includes(a.code)
              return (
                <Pressable
                  key={a.code}
                  accessibilityRole="button"
                  onPress={() => nav.navigate("ItemDetail", { code: a.code, eventId: event.id })}
                  style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 }, pressed && { backgroundColor: color.raised }]}
                >
                  <CategoryIcon category={a.category} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="strong" numberOfLines={1}>{a.name}</Text>
                    <Text variant="meta" numberOfLines={1}>
                      <Text style={{ fontFamily: mono, fontSize: 12, color: color.muted }}>{a.code}</Text>
                      {` · ${a.unit}`}
                    </Text>
                  </View>
                  {scanPhase && st?.state === "scanned" && (
                    <View style={{ alignItems: "flex-end" }}>
                      {flagged ? <TriangleAlert size={18} color={color.warning} /> : <CircleCheck size={18} color={color.brand} />}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                        {st.record.synced === false && <CloudOff size={11} color={color.muted} />}
                        <Text variant="tiny" style={tabular}>{clock(st.record.at)}</Text>
                      </View>
                    </View>
                  )}
                  {scanPhase && st?.state === "reported" && <Badge label={st.report.category} variant="warning" />}
                  {scanPhase && st?.state === "pending" && <CircleDashed size={18} color={color.faint} />}
                  {!scanPhase && a.condition !== "Good" && <Badge label={a.condition} variant="warning" />}
                </Pressable>
              )
            })}
          </ListCard>
        </View>
      ))}
    </View>
  )
}

function TeamTab({ event }: { event: WeddingEvent }) {
  const { userId } = useAppStore()
  const internal = event.crew.filter((c) => !getPerson(c.personId)?.company)
  const vendors = event.crew.filter((c) => getPerson(c.personId)?.company)
  return (
    <View>
      <SectionLabel>{`Crew · ${internal.length}`}</SectionLabel>
      <ListCard>
        {internal.map((c) => (
          <PersonRow
            key={c.personId}
            person={getPerson(c.personId)!}
            detail={c.duty}
            isYou={c.personId === userId}
            badge={c.lead ? <Badge label="Lead" variant="success" /> : undefined}
          />
        ))}
      </ListCard>
      {vendors.length > 0 && (
        <>
          <SectionLabel>{`Vendors · ${vendors.length}`}</SectionLabel>
          <ListCard>
            {vendors.map((c) => (
              <PersonRow key={c.personId} person={getPerson(c.personId)!} detail={c.duty} />
            ))}
          </ListCard>
        </>
      )}
    </View>
  )
}

export function SearchInput(props: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 44,
        borderWidth: 1,
        borderColor: color.control,
        borderRadius: radius.control,
        backgroundColor: color.surface,
        paddingHorizontal: 12,
      }}
    >
      <Search size={16} color={color.muted} />
      <TextInput
        {...props}
        accessibilityLabel={props.placeholder}
        placeholderTextColor={color.muted}
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={{ flex: 1, fontSize: font.body, color: color.ink, paddingVertical: 0 }}
      />
    </View>
  )
}
