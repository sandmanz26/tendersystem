import { ChevronRight, ScanLine } from "lucide-react-native"
import * as React from "react"
import { Pressable, ScrollView, View } from "react-native"

import { fmtNum, fmtRange } from "../core/format"
import { useNav } from "../navigation"
import { eventView } from "../selectors"
import { useAppStore } from "../store"
import { color, mono, tabular } from "../theme"
import { Header, ScanBar } from "../ui/domain"
import { EmptyState, ListCard, SectionLabel, Tag, Text } from "../ui/primitives"

/** Events sitting at a scan stage. One crew member can work several events. */
export function ScanPickerScreen() {
  const nav = useNav()
  const store = useAppStore()
  const scannable = store.events
    .map((e) => eventView(e, store, store.stages))
    .filter((v) => v.mode)
    .sort((a, b) => b.waiting - a.waiting || a.event.date.localeCompare(b.event.date))

  return (
    <View style={{ flex: 1 }}>
      <Header large title="Scan" />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {scannable.length === 0 ? (
          <EmptyState icon={ScanLine} title="No event is at a scan stage" body="Events show here at Waiting scan in / out." />
        ) : (
          <>
            <SectionLabel>{`At a scan stage · ${scannable.length}`}</SectionLabel>
            <ListCard>
              {scannable.map((v) => (
                <Pressable
                  key={v.key}
                  accessibilityRole="button"
                  onPress={() => nav.navigate("Scanner", { eventKey: v.key })}
                  style={({ pressed }) => [{ paddingHorizontal: 14, paddingVertical: 12, gap: 8 }, pressed && { backgroundColor: color.raised }]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ fontFamily: mono, fontSize: 12, color: color.muted, width: 34 }}>{v.event.code}</Text>
                    <View style={{ flex: 1 }}>
                      <Text variant="strong" numberOfLines={1}>
                        {v.event.name}
                      </Text>
                      <Text variant="meta">{fmtRange(v.event.start, v.event.finish)}</Text>
                    </View>
                    <Tag label={v.mode === "in" ? "Scan in" : "Scan out"} tone={v.mode === "in" ? "brand" : "orange"} />
                    <Text variant="strong" style={[{ minWidth: 28, textAlign: "right" }, tabular]}>
                      {fmtNum(v.waiting)}
                    </Text>
                    <ChevronRight size={16} color={color.faint} />
                  </View>
                  <ScanBar done={v.lines.length - v.waiting} total={v.lines.length} style={{ marginLeft: 44 }} />
                </Pressable>
              ))}
            </ListCard>
          </>
        )}
      </ScrollView>
    </View>
  )
}
