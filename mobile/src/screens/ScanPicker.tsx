import { ChevronRight, PackageCheck } from "lucide-react-native"
import * as React from "react"
import { Pressable, ScrollView, View } from "react-native"

import { relativeDay } from "../core/format"
import { getEventProgress } from "../core/progress"
import { useNav } from "../navigation"
import { useAppStore } from "../store"
import { color, tabular } from "../theme"
import { Header, ManifestGrid } from "../ui/domain"
import { EmptyState, ListCard, SectionLabel, Text } from "../ui/primitives"

/** Pick which event to scan for. One crew member can be on several events. */
export function ScanPickerScreen() {
  const nav = useNav()
  const store = useAppStore()
  const scannable = store.events
    .filter((e) => e.crew.some((c) => c.personId === store.userId))
    .map((e) => ({ e, p: getEventProgress(e, store) }))
    .filter(({ p }) => p?.phase.requiresScan)
    .sort((a, b) => a.e.date.localeCompare(b.e.date))

  return (
    <View style={{ flex: 1 }}>
      <Header large title="Scan" />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {scannable.length === 0 ? (
          <EmptyState icon={PackageCheck} title="No phase needs scanning" />
        ) : (
          <>
            <SectionLabel>{`Awaiting scan · ${scannable.length}`}</SectionLabel>
            <ListCard>
              {scannable.map(({ e, p }) => (
                <Pressable
                  key={e.id}
                  accessibilityRole="button"
                  onPress={() => nav.navigate("Scanner", { eventId: e.id })}
                  style={({ pressed }) => [{ paddingHorizontal: 16, paddingVertical: 12 }, pressed && { backgroundColor: color.raised }]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="strong" numberOfLines={1}>{e.couple}</Text>
                      <Text variant="meta">{`${p!.phase.label} · ${relativeDay(e.date)}`}</Text>
                    </View>
                    <Text variant="strong" style={tabular}>
                      {p!.pending.length}
                      <Text muted style={{ fontWeight: "400" }}> left</Text>
                    </Text>
                    <ChevronRight size={16} color={color.muted} />
                  </View>
                  <ManifestGrid progress={p!} codes={e.assetCodes} legend={false} cellHeight={10} style={{ marginTop: 10 }} />
                </Pressable>
              ))}
            </ListCard>
          </>
        )}
      </ScrollView>
    </View>
  )
}
