import { ChevronRight, ClipboardCheck, Hourglass, Warehouse as WarehouseIcon } from "lucide-react-native"
import * as React from "react"
import { Pressable, ScrollView, View } from "react-native"

import { fmtDate, fmtNum, formatIDR, stamp } from "../core/format"
import { WAREHOUSES } from "../core/seed"
import type { Opname } from "../core/types"
import { useNav } from "../navigation"
import { useAppStore } from "../store"
import { color, tabular } from "../theme"
import { Header } from "../ui/domain"
import { Button, Callout, Card, ListCard, SectionLabel, Tag, Text, type Tone } from "../ui/primitives"

export const OPNAME_TONE: Record<Opname["status"], Tone> = { Pending: "orange", Approved: "green", Rejected: "red" }
export const variance = (o: Opname) => o.items.reduce((n, i) => n + i.diff * i.valuation, 0)

export function OpnameScreen() {
  const nav = useNav()
  const { opnames, rows, user, writable } = useAppStore()
  const pending = opnames.find((o) => o.status === "Pending")
  const history = opnames.filter((o) => o.status !== "Pending")
  const warehouses = WAREHOUSES.filter((w) => w.location !== "None").map((w) => ({ w, count: rows.filter((r) => r.warehouseName === w.name).length }))

  return (
    <View style={{ flex: 1 }}>
      <Header large title="Stock opname" subtitle="Physical count" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {pending && (
          <Card style={{ marginHorizontal: 16, padding: 14, gap: 10, borderColor: "#fed7aa" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Hourglass size={16} color={color.orange} />
              <Text variant="strong" style={{ flex: 1 }}>{`Opname #${pending.id} · ${pending.warehouse}`}</Text>
              <Tag label="Pending" tone="orange" />
            </View>
            <Text variant="meta" style={tabular}>{`${pending.appliedBy} · ${stamp(pending.appliedAt)} · ${pending.items.length} differences · ${formatIDR(variance(pending))}`}</Text>
            <Button
              variant={user?.role === "Admin" ? "primary" : "outline"}
              title={user?.role === "Admin" ? "Review and approve" : "View"}
              onPress={() => nav.navigate("OpnameDetail", { id: pending.id })}
            />
          </Card>
        )}

        <SectionLabel>Count a warehouse</SectionLabel>
        {pending ? (
          <Callout icon={Hourglass} style={{ marginHorizontal: 16 }}>
            There's a stock opname awaiting approval. A new one can't be started until it's been approved or rejected.
          </Callout>
        ) : !writable ? (
          <Callout icon={ClipboardCheck} tone="neutral" style={{ marginHorizontal: 16 }}>
            View only.
          </Callout>
        ) : (
          <ListCard>
            {warehouses.map(({ w, count }) => (
              <Pressable
                key={w.id}
                accessibilityRole="button"
                disabled={count === 0}
                onPress={() => nav.navigate("OpnameCount", { warehouse: w.name })}
                style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 }, pressed && { backgroundColor: color.raised }]}
              >
                <WarehouseIcon size={18} color={color.muted} />
                <View style={{ flex: 1 }}>
                  <Text variant="strong" style={{ fontSize: 14 }}>
                    {w.name}
                  </Text>
                  <Text variant="tiny">{w.location}</Text>
                </View>
                <Text variant="meta" style={tabular}>{`${fmtNum(count)} rows`}</Text>
                <ChevronRight size={16} color={color.faint} />
              </Pressable>
            ))}
          </ListCard>
        )}

        <SectionLabel>{`History · ${history.length}`}</SectionLabel>
        <ListCard>
          {history.map((o) => (
            <Pressable
              key={o.id}
              accessibilityRole="button"
              onPress={() => nav.navigate("OpnameDetail", { id: o.id })}
              style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 }, pressed && { backgroundColor: color.raised }]}
            >
              <View style={{ flex: 1 }}>
                <Text variant="strong" style={{ fontSize: 14 }}>{`#${o.id} · ${o.warehouse}`}</Text>
                <Text variant="tiny" style={tabular}>{`${fmtDate(o.appliedAt)} · ${o.items.length} lines · ${formatIDR(variance(o))}`}</Text>
              </View>
              <Tag label={o.status} tone={OPNAME_TONE[o.status]} />
              <ChevronRight size={16} color={color.faint} />
            </Pressable>
          ))}
        </ListCard>
      </ScrollView>
    </View>
  )
}
