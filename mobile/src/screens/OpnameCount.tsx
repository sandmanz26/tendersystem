import { usePreventRemove } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import * as React from "react"
import { Alert, FlatList, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { fmtNum, formatIDR } from "../core/format"
import { location, opnameLines, type OpnameCount } from "../core/rules"
import type { RootStackParamList } from "../navigation"
import { itemByName } from "../selectors"
import { useAppStore } from "../store"
import { color, radius, tabular } from "../theme"
import { Header, Sku } from "../ui/domain"
import { Button, Input, Segmented, Stepper, Text } from "../ui/primitives"
import { useToast } from "../ui/toast"
import { SearchInput } from "./Events"

export function OpnameCountScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "OpnameCount">) {
  const { warehouse } = route.params
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const { rows, submitOpname } = useAppStore()
  const mine = rows.filter((r) => r.warehouseName === warehouse).sort((a, b) => a.name.localeCompare(b.name))
  const [counts, setCounts] = React.useState<Record<number, OpnameCount>>({})
  const [q, setQ] = React.useState("")
  const [done, setDone] = React.useState(false)

  const lines = opnameLines(mine, counts)
  const value = lines.reduce((n, l) => n + l.diff * l.valuation, 0)
  const dirty = Object.keys(counts).length > 0

  // No draft on the web either: leaving throws the count away, so ask first.
  usePreventRemove(dirty && !done, ({ data }) =>
    Alert.alert("Discard this count?", "Counted numbers aren't saved until you submit.", [
      { text: "Keep counting", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => navigation.dispatch(data.action) },
    ])
  )

  const set = (rowId: number, stock: number, patch: Partial<OpnameCount>) =>
    setCounts((c) => {
      const base: OpnameCount = c[rowId] ?? { actual: stock, condition: "Good", note: "" }
      return { ...c, [rowId]: { ...base, ...patch } }
    })

  const submit = () =>
    Alert.alert(
      "Submit stock opname?",
      `${lines.length} of ${mine.length} rows differ or are Poor. Variance ${formatIDR(value)}. Stock changes only after an admin approves.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: () => {
            const o = submitOpname(warehouse, lines, mine.length)
            if (!o) return toast.show("Another opname is waiting for approval.", "error")
            setDone(true)
            toast.show(`Opname #${o.id} sent for approval`, "success")
            requestAnimationFrame(() => navigation.replace("OpnameDetail", { id: o.id }))
          },
        },
      ]
    )

  const s = q.trim().toLowerCase()
  const shown = mine.filter((r) => !s || `${r.name} ${itemByName(r.name)?.sku ?? ""}`.toLowerCase().includes(s))

  return (
    <View style={{ flex: 1 }}>
      <Header title={`Count · ${warehouse}`} subtitle={`${mine.length} rows · defaults to system stock`} onBack={() => navigation.goBack()} />
      <FlatList
        data={shown}
        keyExtractor={(r) => String(r.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 8 }}
        ListHeaderComponent={<SearchInput value={q} onChangeText={setQ} placeholder="Find item" />}
        renderItem={({ item: r }) => {
          const c = counts[r.id] ?? { actual: r.itemStock, condition: "Good" as const, note: "" }
          const diff = c.actual - r.itemStock
          const item = itemByName(r.name)
          return (
            <View
              style={{
                backgroundColor: color.surface,
                borderWidth: 1,
                borderColor: diff !== 0 || c.condition === "Poor" ? color.orange : color.border,
                borderRadius: radius.card,
                padding: 12,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text variant="strong" numberOfLines={1} style={{ fontSize: 14 }}>
                    {r.name}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {item && <Sku code={item.sku} />}
                    <Text variant="tiny">{location(r) || "No location"}</Text>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text variant="tiny">System</Text>
                  <Text style={[{ fontWeight: "700" }, tabular]}>{fmtNum(r.itemStock)}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Stepper label={`Actual ${r.name}`} value={c.actual} onChange={(n) => set(r.id, r.itemStock, { actual: n })} />
                <Text style={[{ width: 44, textAlign: "right", fontWeight: "700", color: diff === 0 ? color.faint : diff < 0 ? color.red : color.green }, tabular]}>
                  {diff === 0 ? "±0" : `${diff > 0 ? "+" : ""}${fmtNum(diff)}`}
                </Text>
                <Segmented
                  style={{ flex: 1, minWidth: 0 }}
                  value={c.condition}
                  onChange={(v) => set(r.id, r.itemStock, { condition: v })}
                  options={[
                    { value: "Good", label: "Good" },
                    { value: "Poor", label: "Poor", tone: color.orange },
                  ]}
                />
              </View>
              {c.condition === "Poor" && <Input value={c.note} onChangeText={(t) => set(r.id, r.itemStock, { note: t })} placeholder="Why poor? e.g. faded, chipped" />}
            </View>
          )
        }}
      />
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 14), backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.border }}>
        <View style={{ flex: 1 }}>
          <Text variant="strong" style={tabular}>{`${lines.length} to report`}</Text>
          <Text variant="tiny" style={[tabular, value < 0 && { color: color.red }]}>{`Variance ${formatIDR(value)}`}</Text>
        </View>
        <Button variant="positive" title="Submit" onPress={submit} style={{ minWidth: 120 }} />
      </View>
    </View>
  )
}
