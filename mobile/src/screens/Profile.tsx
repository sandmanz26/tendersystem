import { ChevronRight, Cloud, CloudOff, LogOut, RotateCcw } from "lucide-react-native"
import * as React from "react"
import { Alert, Pressable, ScrollView, Switch, View } from "react-native"

import { stamp } from "../core/format"
import { getPerson } from "../core/lookup"
import { isClosed } from "../core/progress"
import { useNav } from "../navigation"
import { useAppStore } from "../store"
import { color, radius, tabular } from "../theme"
import { Avatar, Header } from "../ui/domain"
import { Button, Card, ListCard, SectionLabel, Text } from "../ui/primitives"
import { useToast } from "../ui/toast"

export function ProfileScreen() {
  const nav = useNav()
  const toast = useToast()
  const { userId, events, scans, reports, reset, forceOffline, setForceOffline, online, pendingSync, lastSyncAt } = useAppStore()
  const me = getPerson(userId)!
  const mine = events.filter((e) => e.crew.some((c) => c.personId === userId))
  const scanCount = Object.values(scans)
    .flatMap((byPhase) => Object.values(byPhase))
    .flatMap((byCode) => Object.values(byCode ?? {}))
    .filter((r) => r.by === userId).length
  const myReports = reports.filter((r) => r.by === userId).length
  const closed = mine.filter(isClosed)

  const confirmReset = () =>
    Alert.alert(
      "Reset demo data?",
      `All scans, reports, and signatures you made will be lost and the original data restored.${
        pendingSync > 0 ? ` ${pendingSync} unsent items will be deleted too.` : ""
      }`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            reset()
            toast.show("Demo data restored", "success")
          },
        },
      ]
    )

  const signOut = () =>
    pendingSync > 0
      ? toast.show(`${pendingSync} items haven't been sent yet. Wait until you're online before signing out.`, "error")
      : toast.show("This is a demo, there's no account to sign out of.")

  return (
    <View style={{ flex: 1 }}>
      <Header large title="Profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Card style={{ marginHorizontal: 16, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Avatar person={me} size={64} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="heading" style={{ fontSize: 20 }} numberOfLines={1}>
                {me.name}
              </Text>
              <Text variant="small" muted>
                {me.role}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", marginTop: 20 }}>
            {(
              [
                [mine.length, "Events"],
                [scanCount, "Scans"],
                [myReports, "Reports"],
              ] as const
            ).map(([v, l]) => (
              <View key={l} style={{ flex: 1, alignItems: "center" }}>
                <Text style={[{ fontSize: 22, fontWeight: "600" }, tabular]}>{v}</Text>
                <Text variant="tiny">{l}</Text>
              </View>
            ))}
          </View>
        </Card>

        <SectionLabel>Sync</SectionLabel>
        <ListCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.card,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: online ? color.brandSoft : color.pillWarningBg,
              }}
            >
              {online ? <Cloud size={18} color={color.brandInk} /> : <CloudOff size={18} color={color.pillWarningInk} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="strong" style={{ fontSize: 14 }}>
                {online ? "Online" : "Offline"}
              </Text>
              <Text variant="tiny">{pendingSync > 0 ? `${pendingSync} queued` : `Synced ${stamp(lastSyncAt)}`}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ flex: 1 }}>
              <Text variant="strong" style={{ fontSize: 14 }}>
                Offline test mode
              </Text>
              <Text variant="tiny">Practise with no signal</Text>
            </View>
            <Switch
              accessibilityLabel="Offline test mode"
              value={forceOffline}
              onValueChange={setForceOffline}
              trackColor={{ true: color.brand, false: color.control }}
              thumbColor="#fff"
            />
          </View>
        </ListCard>

        <SectionLabel>Account</SectionLabel>
        <ListCard>
          {(
            [
              ["Crew ID", `KRU-${userId.toUpperCase()}`],
              ["Phone", me.phone],
              ["Team", "Logistics & Warehouse"],
            ] as const
          ).map(([label, value]) => (
            <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text variant="small" muted>
                {label}
              </Text>
              <Text variant="small" style={[{ fontWeight: "500" }, tabular]}>
                {value}
              </Text>
            </View>
          ))}
        </ListCard>

        {closed.length > 0 && (
          <>
            <SectionLabel>Past events</SectionLabel>
            <ListCard>
              {closed.map((e) => (
                <Pressable
                  key={e.id}
                  accessibilityRole="button"
                  onPress={() => nav.navigate("EventDetail", { eventId: e.id })}
                  style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }, pressed && { backgroundColor: color.raised }]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="strong" numberOfLines={1} style={{ fontSize: 14 }}>
                      {e.couple}
                    </Text>
                    <Text variant="tiny" numberOfLines={1}>{`${e.kind} · ${e.venue.name}`}</Text>
                  </View>
                  <ChevronRight size={16} color={color.muted} />
                </Pressable>
              ))}
            </ListCard>
          </>
        )}

        <SectionLabel>Demo</SectionLabel>
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          <Button variant="outline" icon={RotateCcw} title="Reset demo data" onPress={confirmReset} />
          <Button variant="ghost" icon={LogOut} title="Sign out" onPress={signOut} />
        </View>
        <Text variant="tiny" style={{ textAlign: "center", paddingTop: 24 }}>
          Kru · v0.3 · React Native
        </Text>
      </ScrollView>
    </View>
  )
}
