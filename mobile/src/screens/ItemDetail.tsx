import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import {
  Boxes,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CloudOff,
  MapPin,
  PackageX,
  Ruler,
  TriangleAlert,
  Warehouse,
  type LucideIcon,
} from "lucide-react-native"
import * as React from "react"
import { Pressable, ScrollView, View } from "react-native"

import { formatDate, relativeDay, stamp } from "../core/format"
import { getAsset, personName } from "../core/lookup"
import { PHASES } from "../core/phases"
import { getPhaseProgress, isClosed } from "../core/progress"
import { getWhereabouts } from "../core/whereabouts"
import { useNav, type RootStackParamList } from "../navigation"
import { useAppStore } from "../store"
import { color, mono, radius } from "../theme"
import { CategoryIcon, Header, ReportRow } from "../ui/domain"
import { Badge, Button, Callout, Card, ListCard, SectionLabel, Text, type BadgeVariant } from "../ui/primitives"
import { NotFound } from "./NotFound"

const CONDITION_VARIANT: Record<string, BadgeVariant> = { Good: "success", "Needs check": "warning", Damaged: "danger" }

export function ItemDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "ItemDetail">) {
  const nav = useNav()
  const store = useAppStore()
  const { events, scans, reports } = store
  const { code, eventId } = route.params
  const asset = getAsset(code)
  const event = eventId ? events.find((e) => e.id === eventId) : undefined
  if (!asset || (eventId && (!event || !event.assetCodes.includes(asset.code)))) {
    return <NotFound onBack={() => navigation.goBack()} />
  }

  const assetReports = reports.filter((r) => r.assetCode === asset.code)
  const where = getWhereabouts(asset.code, events, scans)
  const reportEvent = event?.id ?? (where.at === "event" ? where.event.id : undefined)
  const bookings = events
    .filter((e) => e.assetCodes.includes(asset.code) && !isClosed(e))
    .sort((a, b) => a.date.localeCompare(b.date))
  const facts: [LucideIcon, string, string][] = [
    [Boxes, "Per scan", asset.unit],
    [Warehouse, "Spot", asset.location.replace(/^Warehouse\s+/, "")],
    ...(asset.dimensions ? [[Ruler, "Size", asset.dimensions] as [LucideIcon, string, string]] : []),
    [CalendarCheck, "Checked", formatDate(asset.lastChecked, { day: "numeric", month: "short" })],
  ]
  const perRow = facts.length === 4 ? 2 : 3

  return (
    <View style={{ flex: 1 }}>
      <Header title={asset.name} subtitle={event ? event.couple : "Inventory"} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
          <Card style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 16 }}>
              <View style={{ width: 56, height: 56, borderRadius: radius.control, backgroundColor: color.raised, alignItems: "center", justifyContent: "center" }}>
                <CategoryIcon category={asset.category} size={28} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="tiny" style={{ fontFamily: mono }}>
                  {asset.code}
                </Text>
                <Text variant="heading" style={{ fontSize: 20, fontWeight: "700", marginTop: 2 }}>
                  {asset.name}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  <Badge label={asset.category} variant="neutral" />
                  <Badge label={asset.condition} variant={CONDITION_VARIANT[asset.condition]} />
                </View>
              </View>
            </View>
            <View
              style={{
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderRadius: radius.control,
                paddingHorizontal: 14,
                paddingVertical: 12,
                backgroundColor: where.at === "warehouse" ? color.raised : color.brandSoft,
              }}
            >
              {where.at === "warehouse" ? <Warehouse size={18} color={color.muted} /> : <MapPin size={18} color={color.brandInk} />}
              <Text variant="strong" numberOfLines={1} style={{ flex: 1, fontSize: 14 }}>
                {where.at === "warehouse" ? asset.location : where.event.couple}
              </Text>
              {where.at === "event" && <Text variant="meta">{`out ${stamp(where.since)}`}</Text>}
            </View>
            <Button
              variant="outline"
              icon={PackageX}
              title="Report damage"
              style={{ marginTop: 12 }}
              onPress={() => nav.navigate("NewReport", { type: "damage", assetCode: asset.code, eventId: reportEvent })}
            />
          </Card>
          {asset.notes && <Callout icon={TriangleAlert}>{asset.notes}</Callout>}

          {/* Facts as icon tiles: value first, a one-word label under it. */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: color.border, borderRadius: radius.card, overflow: "hidden", backgroundColor: color.border, gap: 1 }}>
            {facts.map(([Icon, label, value]) => (
              <View key={label} style={{ flexGrow: 1, flexBasis: `${100 / perRow - 1}%`, backgroundColor: color.surface, paddingHorizontal: 12, paddingVertical: 10 }}>
                <Icon size={16} color={color.muted} strokeWidth={1.75} />
                <Text variant="strong" style={{ fontSize: 14, marginTop: 6 }}>
                  {value}
                </Text>
                <Text variant="tiny">{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {event && (
          <>
            <SectionLabel>{`Trail at ${event.couple}`}</SectionLabel>
            <ListCard>
              {PHASES.filter((p) => p.requiresScan).map((p) => {
                const phaseIdx = PHASES.indexOf(p)
                const st = getPhaseProgress(event, p, store).byAsset[asset.code]
                const isCurrent = phaseIdx === event.phaseIndex
                const future = phaseIdx > event.phaseIndex
                return (
                  <View key={p.key} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
                    {st.state === "scanned" ? (
                      <CircleCheck size={20} color={st.record.skippedPrevious ? color.warning : color.brand} />
                    ) : st.state === "reported" ? (
                      <TriangleAlert size={20} color={color.warning} />
                    ) : (
                      <CircleDashed size={20} color={isCurrent ? color.ink : color.faint} />
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="small" style={[{ fontWeight: "500" }, future && { color: color.muted }]}>
                        {p.label}
                      </Text>
                      {st.state === "scanned" && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          {st.record.synced === false && <CloudOff size={12} color={color.muted} />}
                          <Text variant="tiny" numberOfLines={1}>
                            {`${stamp(st.record.at)} · ${personName(st.record.by)}${st.record.skippedPrevious ? " · skipped" : ""}`}
                          </Text>
                        </View>
                      )}
                      {st.state === "reported" && <Text variant="tiny" style={{ color: color.warning }}>{`Reported: ${st.report.category}`}</Text>}
                    </View>
                    {isCurrent && st.state === "pending" && <Badge label="Now" variant="accent" />}
                  </View>
                )
              })}
            </ListCard>
          </>
        )}

        <SectionLabel>{`Bookings · ${bookings.length}`}</SectionLabel>
        <ListCard>
          {bookings.length === 0 ? (
            <Text variant="small" muted style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              None
            </Text>
          ) : (
            bookings.map((e) => (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                onPress={() => nav.push("EventDetail", { eventId: e.id })}
                style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }, pressed && { backgroundColor: color.raised }]}
              >
                <CalendarDays size={18} color={color.muted} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="strong" numberOfLines={1} style={{ fontSize: 14 }}>
                    {e.couple}
                  </Text>
                  <Text variant="tiny">{`${relativeDay(e.date)} · ${PHASES[e.phaseIndex]?.label ?? "Closed"}`}</Text>
                </View>
                {e.id === event?.id && <Badge label="This event" variant="neutral" />}
                <ChevronRight size={16} color={color.muted} />
              </Pressable>
            ))
          )}
        </ListCard>

        <SectionLabel>{`Report history · ${assetReports.length}`}</SectionLabel>
        <ListCard>
          {assetReports.length === 0 ? (
            <Text variant="small" muted style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              None
            </Text>
          ) : (
            assetReports.map((r) => (
              <ReportRow
                key={r.id}
                report={r}
                eventName={events.find((e) => e.id === r.eventId)?.couple}
                onPress={() => nav.push("ReportDetail", { reportId: r.id })}
              />
            ))
          )}
        </ListCard>
      </ScrollView>
    </View>
  )
}
