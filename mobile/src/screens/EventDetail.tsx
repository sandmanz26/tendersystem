import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { ArrowRight, CalendarDays, CheckCheck, ClipboardList, Lock, MapPin, Package as Box, ScanLine, Truck, User } from "lucide-react-native"
import * as React from "react"
import { Alert, ScrollView, View } from "react-native"

import { fmtDate, fmtNum, fmtRange } from "../core/format"
import { isResolved, KIND_TEXT, planAdvance } from "../core/rules"
import type { EventLine } from "../core/types"
import type { RootStackParamList } from "../navigation"
import { eventView, unitOf } from "../selectors"
import { useAppStore } from "../store"
import { color, tabular } from "../theme"
import { AdvanceSheet } from "../ui/advance-sheet"
import { ClosingTag, Header, LineRow, ScanBar, StageTrack } from "../ui/domain"
import { LineSheet } from "../ui/line-sheet"
import { Button, Callout, Card, Chip, EmptyState, ListCard, Meta, MetaRow, SectionLabel, Tag, Text } from "../ui/primitives"
import { RentalRow } from "../ui/rental-card"
import { useToast } from "../ui/toast"
import { NotFound } from "./NotFound"

type Tab = "all" | "waiting" | "new" | "grouped" | "broken" | "loan" | "outsource"

export function EventDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "EventDetail">) {
  const store = useAppStore()
  const toast = useToast()
  const event = store.events.find((e) => `${e.date} | ${e.name.toUpperCase()}` === route.params.eventKey)
  const [tab, setTab] = React.useState<Tab>("all")
  const [lineId, setLineId] = React.useState<number | null>(null)
  const [advancing, setAdvancing] = React.useState(false)

  if (!event) return <NotFound onBack={() => navigation.goBack()} />
  const v = eventView(event, store, store.stages)
  const { lines, stage, mode, waiting, packages } = v
  const rentals = store.rentals.filter((r) => r.eventKey === v.key)
  const broken = lines.filter((l) => (l.brokenQty ?? 0) > 0)
  const added = lines.filter((l) => l.stage === stage.status)
  const checking = v.tab === "checking-inventory"
  const closed = v.tab === "returned-completed" || v.tab === "transferred"
  const asked = (store.ownershipAsked[v.key] ?? []).includes(stage.status)
  const plan = planAdvance(store.stages, stage.status, lines, asked)
  const boxOf = (l: EventLine) => packages.find((p) => p.itemIds.includes(l.id))
  const unresolved = lines.filter((l) => !isResolved(l)).length

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all" as Tab, label: "All", count: lines.length },
    ...(mode ? [{ key: "waiting" as Tab, label: "Waiting Scan", count: waiting }] : []),
    { key: "new" as Tab, label: "Added New", count: added.length },
    { key: "grouped" as Tab, label: "Grouped", count: packages.length },
    { key: "broken" as Tab, label: "Broken", count: broken.length },
    { key: "loan" as Tab, label: KIND_TEXT.loan.tab, count: rentals.filter((r) => r.kind === "loan").length },
    { key: "outsource" as Tab, label: KIND_TEXT.outsource.tab, count: rentals.filter((r) => r.kind === "outsource").length },
  ].filter((t) => t.key === "all" || t.count > 0 || t.key === tab)

  const shown =
    tab === "waiting" ? lines.filter((l) => (mode === "in" ? !l.scanIn : !l.scanOut)) : tab === "new" ? added : tab === "broken" ? broken : lines

  const next = () => {
    if (plan.block) return toast.show(plan.block, "error")
    setAdvancing(true)
  }

  const finalize = () =>
    Alert.alert("Finalize this event?", "All items are resolved. The event becomes view-only.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Finalize",
        onPress: () => {
          const result = store.finalize(v.key)
          if (result) toast.show(result === "transferred" ? "Event transferred" : "Returned & Completed", "success")
        },
      },
    ])

  return (
    <View style={{ flex: 1 }}>
      <Header title={event.name} subtitle={`${event.code} · ${event.location}`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Summary: dates, place, who — then where the event is in its pipeline. */}
        <Card style={{ margin: 16, marginBottom: 0, padding: 14, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <MetaRow>
                <Meta icon={CalendarDays} textStyle={{ color: color.ink, fontWeight: "600" }}>
                  {fmtRange(event.start, event.finish)}
                </Meta>
                <Meta icon={Truck}>{`Load-in ${fmtDate(event.date)}`}</Meta>
              </MetaRow>
              <MetaRow>
                <Meta icon={MapPin}>{event.address ?? event.location}</Meta>
                <Meta icon={User}>{event.pic}</Meta>
              </MetaRow>
            </View>
            <ClosingTag tab={v.tab} />
          </View>
          <StageTrack stages={store.stages} current={stage.status} />
          <View style={{ gap: 2 }}>
            <Text variant="label">CURRENT STAGE</Text>
            <Text variant="heading">{stage.status}</Text>
            {mode && (
              <View style={{ gap: 6, marginTop: 6 }}>
                <Text variant="meta" style={tabular}>{`${fmtNum(lines.length - waiting)} of ${fmtNum(lines.length)} scanned ${mode}`}</Text>
                <ScanBar done={lines.length - waiting} total={lines.length} />
              </View>
            )}
          </View>

          {v.tab === "on-going" && store.writable && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {mode && (
                <Button icon={ScanLine} title={waiting ? `Scan ${mode} · ${waiting}` : "Scan"} style={{ flex: 1 }} onPress={() => navigation.navigate("Scanner", { eventKey: v.key })} />
              )}
              {plan.target && (
                <Button
                  variant={mode && waiting ? "outline" : "primary"}
                  icon={ArrowRight}
                  title={mode ? "Next" : `Next: ${plan.target.code}`}
                  style={{ flex: 1 }}
                  onPress={next}
                  accessibilityLabel={`Next stage: ${plan.target.status}`}
                />
              )}
            </View>
          )}
          {v.tab === "ready-to-close" && (
            <>
              <Callout icon={CheckCheck} tone="orange">Last stage reached. Close it to cross-check and return every item.</Callout>
              {store.writable && <Button variant="positive" title="Close & Start Checking" onPress={() => store.startChecking(v.key)} />}
            </>
          )}
          {checking && (
            <>
              <Callout icon={ClipboardList} tone="brand">{`Cross-check, then Return or Transfer each item. ${fmtNum(lines.filter((l) => l.checked).length)} of ${fmtNum(lines.length)} checked.`}</Callout>
              {store.writable && <Button variant="positive" title={`Finalize (${lines.length - unresolved}/${lines.length})`} disabled={unresolved > 0} onPress={finalize} />}
            </>
          )}
          {closed && <Callout icon={Lock} tone="neutral">{`${v.tab === "transferred" ? "Transferred" : "Returned & Completed"}. View only.`}</Callout>}
        </Card>

        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingTop: 16 }}>
            {tabs.map((t) => (
              <Chip key={t.key} label={t.label} count={t.count} selected={tab === t.key} onPress={() => setTab(t.key)} />
            ))}
          </ScrollView>
        </View>

        {tab === "loan" || tab === "outsource" ? (
          <>
            <SectionLabel>{KIND_TEXT[tab].name}</SectionLabel>
            <ListCard>
              {rentals
                .filter((r) => r.kind === tab)
                .map((r) => (
                  <RentalRow key={r.id} r={r} locked={v.tab !== "on-going"} />
                ))}
            </ListCard>
            <Text variant="tiny" style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              {`${KIND_TEXT[tab].name} items are returned to the vendor and never become our stock.`}
            </Text>
          </>
        ) : tab === "grouped" ? (
          packages.map((p) => {
            const inside = lines.filter((l) => p.itemIds.includes(l.id))
            const done = mode ? inside.every((l) => (mode === "in" ? l.scanIn : l.scanOut)) : false
            return (
              <View key={p.id}>
                <SectionLabel right={mode ? <Tag label={done ? `Scanned ${mode}` : `Waiting scan ${mode}`} tone={done ? "green" : "brand"} /> : undefined}>
                  {`${p.name} · ${inside.length}`}
                </SectionLabel>
                <ListCard>
                  {inside.map((l) => (
                    <LineRow key={l.id} line={l} unit={unitOf(l.name)} mode={mode} onPress={() => setLineId(l.id)} />
                  ))}
                </ListCard>
              </View>
            )
          })
        ) : shown.length === 0 ? (
          <EmptyState icon={tab === "waiting" ? CheckCheck : Box} title={tab === "waiting" ? "Everything is scanned" : lines.length ? "Nothing here" : "No items yet"} body={lines.length ? undefined : "Items are added on the web."} />
        ) : (
          groupByArea(shown).map(([area, list]) => (
            <View key={area}>
              <SectionLabel right={<Text variant="tiny" style={tabular}>{`${fmtNum(list.reduce((n, l) => n + l.qty, 0))} pcs`}</Text>}>{`${area} · ${list.length}`}</SectionLabel>
              <ListCard>
                {list.map((l) => (
                  <LineRow key={l.id} line={l} unit={unitOf(l.name)} mode={mode} boxName={boxOf(l)?.name.split(" – ")[0]} onPress={() => setLineId(l.id)} />
                ))}
              </ListCard>
            </View>
          ))
        )}
      </ScrollView>

      <LineSheet view={v} line={lines.find((l) => l.id === lineId) ?? null} onClose={() => setLineId(null)} />
      <AdvanceSheet view={v} visible={advancing} onClose={() => setAdvancing(false)} />
    </View>
  )
}

function groupByArea(lines: EventLine[]) {
  const map = new Map<string, EventLine[]>()
  for (const l of lines) map.set(l.area, [...(map.get(l.area) ?? []), l])
  return [...map.entries()]
}
