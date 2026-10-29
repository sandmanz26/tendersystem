import { ChevronRight, MapPin, PackageSearch, Warehouse } from "lucide-react-native"
import * as React from "react"
import { Pressable, ScrollView, View } from "react-native"

import { ASSETS } from "../core/mock"
import type { Asset } from "../core/types"
import { getWhereabouts, type Whereabouts } from "../core/whereabouts"
import { useNav } from "../navigation"
import { useAppStore } from "../store"
import { color, mono, radius, tabular } from "../theme"
import { CategoryIcon, Header } from "../ui/domain"
import { Badge, EmptyState, ListCard, Meta, SectionLabel, Text } from "../ui/primitives"
import { SearchInput } from "./EventDetail"

type Status = "all" | "out" | "in" | "check"

const FILTERS: [Status, string][] = [
  ["all", "All"],
  ["out", "Out"],
  ["in", "In"],
  ["check", "Check"],
]

/** "Warehouse A · Zone 1" → "A · Zone 1": the warehouse icon already says warehouse. */
function shortSpot(location: string) {
  return location.replace(/^Warehouse\s+/, "")
}

export function InventoryScreen() {
  const nav = useNav()
  const { events, scans } = useAppStore()
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState<Status>("all")
  const s = q.trim().toLowerCase()

  const rows = ASSETS.map((asset) => ({ asset, where: getWhereabouts(asset.code, events, scans) }))
  const matches = (r: { asset: Asset; where: Whereabouts }, st: Status) =>
    st === "all" ||
    (st === "out" && r.where.at === "event") ||
    (st === "in" && r.where.at === "warehouse") ||
    (st === "check" && r.asset.condition !== "Good")

  const visible = rows
    .filter((r) => matches(r, status))
    .filter(
      ({ asset: a }) =>
        !s || a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s) || a.location.toLowerCase().includes(s)
    )
  const groups = Object.entries(
    visible.reduce<Record<string, typeof visible>>((acc, r) => {
      acc[r.asset.category] = [...(acc[r.asset.category] ?? []), r]
      return acc
    }, {})
  )

  return (
    <View style={{ flex: 1 }}>
      <Header large title="Items" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <SearchInput value={q} onChangeText={setQ} placeholder="Name, code or rack" />
          <View accessibilityRole="radiogroup" style={{ flexDirection: "row", gap: 6 }}>
            {FILTERS.map(([v, label]) => {
              const on = status === v
              return (
                <Pressable
                  key={v}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setStatus(v)}
                  style={{
                    flex: 1,
                    height: 56,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: radius.control,
                    borderWidth: 1,
                    borderColor: on ? color.brand : color.control,
                    backgroundColor: on ? color.brandSoft : color.surface,
                  }}
                >
                  <Text variant="strong" style={[{ fontSize: 17 }, tabular, on && { color: color.brandInk }]}>
                    {rows.filter((r) => matches(r, v)).length}
                  </Text>
                  <Text variant="tiny" style={on && { color: color.brandInk }}>
                    {label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {groups.length === 0 && <EmptyState icon={PackageSearch} title="No items found" />}

        {groups.map(([category, list]) => (
          <View key={category}>
            <SectionLabel>{`${category} · ${list.length}`}</SectionLabel>
            <ListCard>
              {list.map(({ asset: a, where }) => (
                <Pressable
                  key={a.code}
                  accessibilityRole="button"
                  onPress={() => nav.navigate("ItemDetail", { code: a.code })}
                  style={({ pressed }) => [
                    { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
                    pressed && { backgroundColor: color.raised },
                  ]}
                >
                  <CategoryIcon category={a.category} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="strong" numberOfLines={1}>
                      {a.name}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <Text variant="tiny" style={{ fontFamily: mono }}>
                        {a.code}
                      </Text>
                      {where.at === "event" ? (
                        <Meta icon={MapPin} label="At event" textStyle={{ color: color.brandInk }}>
                          {where.event.couple}
                        </Meta>
                      ) : (
                        <Meta icon={Warehouse} label="In warehouse">
                          {shortSpot(a.location)}
                        </Meta>
                      )}
                    </View>
                  </View>
                  {a.condition !== "Good" && <Badge label={a.condition} variant="warning" />}
                  <ChevronRight size={16} color={color.muted} />
                </Pressable>
              ))}
            </ListCard>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
