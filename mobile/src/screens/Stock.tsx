import { ChevronRight, PackageSearch, Repeat } from "lucide-react-native"
import * as React from "react"
import { Pressable, ScrollView, View } from "react-native"

import { fmtNum, shortIDR } from "../core/format"
import { minStatus } from "../core/rules"
import { ITEMS, WAREHOUSES } from "../core/seed"
import type { MinStatus } from "../core/types"
import { useNav } from "../navigation"
import { useAppStore } from "../store"
import { color, tabular } from "../theme"
import { Header, MinTag, Sku } from "../ui/domain"
import { Button, Chip, EmptyState, ListCard, Stat, StatStrip, Text } from "../ui/primitives"
import { SearchInput } from "./Events"

const RANK: Record<MinStatus, number> = { Critical: 0, Warning: 1, Safe: 2, "Not Set": 3 }

export function StockScreen() {
  const nav = useNav()
  const { rows, rentals, today } = useAppStore()
  const [q, setQ] = React.useState("")
  const [wh, setWh] = React.useState<string | null>(null)
  const [onlyLow, setOnlyLow] = React.useState(false)
  const s = q.trim().toLowerCase()

  const scoped = rows.filter((r) => !wh || r.warehouseName === wh)
  // Rented rows are never ours: asset value counts warehouse rows only.
  const assetValue = scoped.reduce((n, r) => n + r.valuation * r.itemStock, 0)
  const status = (r: (typeof rows)[number]) => minStatus(r.itemStock, r.stokMin)
  const critical = scoped.filter((r) => status(r) === "Critical").length
  const warning = scoped.filter((r) => status(r) === "Warning").length
  const overdue = rentals.filter((r) => r.status === "Borrowed" && r.dueDate < today).length

  const list = scoped
    .filter((r) => !onlyLow || ["Critical", "Warning"].includes(status(r)))
    .filter((r) => {
      if (!s) return true
      const sku = ITEMS.find((i) => i.name === r.name)?.sku ?? ""
      return `${r.name} ${sku}`.toLowerCase().includes(s)
    })
    .sort((a, b) => RANK[status(a)] - RANK[status(b)] || a.name.localeCompare(b.name))

  return (
    <View style={{ flex: 1 }}>
      <Header
        large
        title="Stock"
        right={<Button size="sm" variant="outline" icon={Repeat} title={overdue ? `Rentals · ${overdue} late` : "Rentals"} onPress={() => nav.navigate("Rentals")} />}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <StatStrip>
            <Stat value={shortIDR(assetValue)} label="Asset value" />
            <Pressable accessibilityRole="button" accessibilityLabel="Show critical and warning only" onPress={() => setOnlyLow((x) => !x)}>
              <Stat value={fmtNum(critical)} label="Critical" tone={critical ? color.red : undefined} />
            </Pressable>
            <Stat value={fmtNum(warning)} label="Warning" tone={warning ? color.orange : undefined} />
          </StatStrip>
          <SearchInput value={q} onChangeText={setQ} placeholder="Item name or SKU" />
        </View>
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 }}>
            <Chip label="Low only" selected={onlyLow} onPress={() => setOnlyLow((x) => !x)} />
            <Chip label="All warehouses" selected={!wh} onPress={() => setWh(null)} />
            {WAREHOUSES.filter((w) => w.location !== "None").map((w) => (
              <Chip key={w.id} label={w.name.replace("Warehouse ", "")} selected={wh === w.name} onPress={() => setWh(w.name)} />
            ))}
          </ScrollView>
        </View>
        {list.length === 0 ? (
          <EmptyState icon={PackageSearch} title="No items found" />
        ) : (
          <ListCard>
            {list.map((r) => {
              const item = ITEMS.find((i) => i.name === r.name)
              return (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => nav.navigate("ItemDetail", { name: r.name })}
                  style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 11 }, pressed && { backgroundColor: color.raised }]}
                >
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text variant="strong" numberOfLines={1} style={{ fontSize: 15 }}>
                      {r.name}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {item && <Sku code={item.sku} />}
                      <Text variant="tiny" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {r.warehouseName.replace("Warehouse ", "")}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 3 }}>
                    <Text style={[{ fontSize: 16, fontWeight: "700", color: color.ink }, tabular]}>
                      {fmtNum(r.itemStock)}
                      <Text variant="tiny">{` ${item?.unit ?? ""}`}</Text>
                    </Text>
                    <MinTag stock={r.itemStock} min={r.stokMin} />
                  </View>
                  <ChevronRight size={16} color={color.faint} />
                </Pressable>
              )
            })}
          </ListCard>
        )}
      </ScrollView>
    </View>
  )
}
