import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import * as React from "react"
import { Alert, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { fmtNum, formatIDR, stamp } from "../core/format"
import type { RootStackParamList } from "../navigation"
import { useAppStore } from "../store"
import { color, tabular } from "../theme"
import { Header } from "../ui/domain"
import { Button, Card, ListCard, SectionLabel, Stat, StatStrip, Tag, Text } from "../ui/primitives"
import { useToast } from "../ui/toast"
import { NotFound } from "./NotFound"
import { OPNAME_TONE, variance } from "./Opname"

export function OpnameDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "OpnameDetail">) {
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const { opnames, user, resolveOpname } = useAppStore()
  const o = opnames.find((x) => x.id === route.params.id)
  if (!o) return <NotFound onBack={() => navigation.goBack()} />
  const admin = user?.role === "Admin"
  const v = variance(o)

  const resolve = (approve: boolean) =>
    Alert.alert(
      approve ? "Approve this opname?" : "Reject this opname?",
      approve ? `${o.items.length} rows in ${o.warehouse} will be set to the counted quantity.` : "Nothing changes in stock.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: approve ? "Approve" : "Reject",
          style: approve ? "default" : "destructive",
          onPress: () => {
            resolveOpname(o.id, approve)
            toast.show(approve ? "Stock updated" : "Opname rejected", "success")
          },
        },
      ]
    )

  return (
    <View style={{ flex: 1 }}>
      <Header title={`Opname #${o.id}`} subtitle={o.warehouse} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: o.status === "Pending" && admin ? 110 : 32 }}>
        <View style={{ padding: 16, paddingBottom: 0, gap: 10 }}>
          <Card style={{ padding: 14, gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text variant="strong" style={{ flex: 1 }}>
                {o.warehouse}
              </Text>
              <Tag label={o.status} tone={OPNAME_TONE[o.status]} />
            </View>
            <Text variant="meta">{`Submitted by ${o.appliedBy} · ${stamp(o.appliedAt)}`}</Text>
            {o.resolvedAt && <Text variant="meta">{`${o.status} by ${o.resolvedBy} · ${stamp(o.resolvedAt)}`}</Text>}
          </Card>
          <StatStrip>
            <Stat value={fmtNum(o.countedCount)} label="Rows counted" />
            <Stat value={fmtNum(o.items.length)} label="Reported" />
            <Stat value={formatIDR(v)} label="Variance" tone={v < 0 ? color.red : v > 0 ? color.green : undefined} />
          </StatStrip>
        </View>
        <SectionLabel>Lines</SectionLabel>
        <ListCard>
          {o.items.length === 0 ? (
            <Text variant="meta" style={{ padding: 14 }}>
              Every row matched the system.
            </Text>
          ) : (
            o.items.map((i, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 11 }}>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text variant="strong" numberOfLines={1} style={{ fontSize: 14 }}>
                    {i.name}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Text variant="tiny" style={tabular}>{`${fmtNum(i.before)} → ${fmtNum(i.after)}`}</Text>
                    {i.condition === "Poor" && <Tag label="Poor" tone="orange" />}
                    {!!i.note && (
                      <Text variant="tiny" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {i.note}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[{ fontWeight: "700", color: i.diff === 0 ? color.faint : i.diff < 0 ? color.red : color.green }, tabular]}>
                  {i.diff === 0 ? "±0" : `${i.diff > 0 ? "+" : ""}${fmtNum(i.diff)}`}
                </Text>
              </View>
            ))
          )}
        </ListCard>
        <Text variant="tiny" style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          Poor is a note for the team. Only the counted quantity is written to stock.
        </Text>
      </ScrollView>
      {o.status === "Pending" && admin && (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 14), backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.border }}>
          <Button variant="destructive" title="Reject" style={{ flex: 1 }} onPress={() => resolve(false)} />
          <Button variant="positive" title="Approve" style={{ flex: 2 }} onPress={() => resolve(true)} />
        </View>
      )}
    </View>
  )
}
