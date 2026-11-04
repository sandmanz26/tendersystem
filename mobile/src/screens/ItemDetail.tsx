import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { ChevronRight } from "lucide-react-native"
import * as React from "react"
import { Pressable, ScrollView, View } from "react-native"

import { fmtNum, formatIDR, shortIDR, stamp } from "../core/format"
import { itemStock, location } from "../core/rules"
import type { RootStackParamList } from "../navigation"
import { eventView, itemByName } from "../selectors"
import { useAppStore } from "../store"
import { color, tabular } from "../theme"
import { ClosingTag, Header, MinTag, Sku } from "../ui/domain"
import { Card, ListCard, SectionLabel, Stat, StatStrip, Tag, Text } from "../ui/primitives"
import { NotFound } from "./NotFound"

export function ItemDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "ItemDetail">) {
  const store = useAppStore()
  const item = itemByName(route.params.name)
  if (!item) return <NotFound onBack={() => navigation.goBack()} />
  const stock = itemStock(store.rows, item.name)
  // The same item can be on several events at once: show where it's booked.
  const bookings = store.events
    .map((e) => eventView(e, store, store.stages))
    .flatMap((v) => v.lines.filter((l) => l.name === item.name && l.warehouseItem && !l.resolution).map((l) => ({ v, l })))
    .filter(({ v }) => v.tab !== "returned-completed" && v.tab !== "transferred")
  const booked = bookings.reduce((n, b) => n + b.l.qty, 0)
  const movements = store.movements.filter((m) => m.itemName === item.name).slice(0, 10)

  return (
    <View style={{ flex: 1 }}>
      <Header title={item.name} subtitle={item.category} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ padding: 16, paddingBottom: 0, gap: 10 }}>
          <Card style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Sku code={item.sku} />
              <Tag label={item.category} tone="neutral" />
              <Tag label={stock.status} tone={stock.status === "Available" ? "green" : stock.status === "Low Stock" ? "orange" : "red"} />
            </View>
            <Text variant="heading" style={{ fontSize: 20 }}>
              {item.name}
            </Text>
            <Text variant="meta">{`${formatIDR(item.itemValue)} per ${item.unit} · home ${item.homeWarehouse}`}</Text>
          </Card>
          <StatStrip>
            <Stat value={fmtNum(stock.total)} label={`Total ${item.unit}`} />
            <Stat value={fmtNum(booked)} label="On events" tone={booked > stock.total ? color.red : undefined} />
            <Stat value={shortIDR(item.itemValue * stock.total)} label="Value" />
          </StatStrip>
        </View>

        <SectionLabel>{`Warehouses · ${stock.rows.length}`}</SectionLabel>
        <ListCard>
          {stock.rows.map((r) => (
            <View key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="strong" style={{ fontSize: 14 }}>
                  {r.warehouseName}
                </Text>
                <Text variant="tiny">{[location(r), r.stokMin ? `min ${fmtNum(r.stokMin)}` : ""].filter(Boolean).join(" · ") || "No location set"}</Text>
              </View>
              <Text style={[{ fontSize: 16, fontWeight: "700" }, tabular]}>{fmtNum(r.itemStock)}</Text>
              <MinTag stock={r.itemStock} min={r.stokMin} />
            </View>
          ))}
        </ListCard>

        <SectionLabel>{`On events · ${bookings.length}`}</SectionLabel>
        <ListCard>
          {bookings.length === 0 ? (
            <Text variant="meta" style={{ padding: 14 }}>
              Not booked on any open event.
            </Text>
          ) : (
            bookings.map(({ v, l }) => (
              <Pressable
                key={`${v.key}-${l.id}`}
                accessibilityRole="button"
                onPress={() => navigation.push("EventDetail", { eventKey: v.key })}
                style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 }, pressed && { backgroundColor: color.raised }]}
              >
                <Text style={[{ fontSize: 15, fontWeight: "700", width: 40, textAlign: "right" }, tabular]}>{fmtNum(l.qty)}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="strong" numberOfLines={1} style={{ fontSize: 14 }}>
                    {v.event.name}
                  </Text>
                  <Text variant="tiny" numberOfLines={1}>{`${l.area} · ${v.stage.status}`}</Text>
                </View>
                {v.tab !== "on-going" && <ClosingTag tab={v.tab} />}
                <ChevronRight size={16} color={color.faint} />
              </Pressable>
            ))
          )}
        </ListCard>

        {movements.length > 0 && (
          <>
            <SectionLabel>Stock history</SectionLabel>
            <ListCard>
              {movements.map((m) => (
                <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="small" style={{ fontWeight: "500" }}>{`${m.reason} · ${m.warehouse.replace("Warehouse ", "")}`}</Text>
                    <Text variant="tiny">{`${stamp(m.at)} · ${m.by}${m.note ? ` · ${m.note}` : ""}`}</Text>
                  </View>
                  <Text style={[{ fontWeight: "700", color: m.change < 0 ? color.red : color.green }, tabular]}>{`${m.change > 0 ? "+" : ""}${fmtNum(m.change)}`}</Text>
                </View>
              ))}
            </ListCard>
          </>
        )}
      </ScrollView>
    </View>
  )
}
