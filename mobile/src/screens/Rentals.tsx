import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Repeat } from "lucide-react-native"
import * as React from "react"
import { ScrollView, View } from "react-native"

import { formatIDR } from "../core/format"
import { KIND_TEXT, rentalDisplay } from "../core/rules"
import { keyOf } from "../core/seed"
import type { RentalKind } from "../core/types"
import type { RootStackParamList } from "../navigation"
import { useAppStore } from "../store"
import { Header } from "../ui/domain"
import { Chip, EmptyState, ListCard, SectionLabel, Segmented, Text } from "../ui/primitives"
import { RentalRow } from "../ui/rental-card"

type Filter = "open" | "Requested" | "Received" | "Overdue" | "Done"
const ORDER = { Overdue: 0, Requested: 1, Received: 2, Done: 3 } as const

/** Rent and outsource records across events and warehouses: receive and return from here. */
export function RentalsScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Rentals">) {
  const { rentals, events, today } = useAppStore()
  const [kind, setKind] = React.useState<RentalKind>("loan")
  const [filter, setFilter] = React.useState<Filter>("open")
  const t = KIND_TEXT[kind]
  const mine = rentals.filter((r) => r.kind === kind)
  const match = (f: Filter) => (r: (typeof mine)[number]) => {
    const d = rentalDisplay(r, today)
    return f === "open" ? d !== "Done" : d === f
  }
  const list = mine.filter(match(filter)).sort((a, b) => ORDER[rentalDisplay(a, today)] - ORDER[rentalDisplay(b, today)] || a.dueDate.localeCompare(b.dueDate))
  const eventName = (key?: string) => (key ? events.find((e) => keyOf(e) === key)?.name : undefined)
  const openCost = mine.filter((r) => r.status !== "Returned").reduce((n, r) => n + r.qty * r.rentalCost, 0)
  const labels: Record<Filter, string> = { open: "Open", Requested: "Requested", Received: t.received, Overdue: "Overdue", Done: t.done }

  return (
    <View style={{ flex: 1 }}>
      <Header title="Rent & Outsource" subtitle="Never our stock. Always the full qty." onBack={() => navigation.goBack()} />
      <View style={{ padding: 16, paddingBottom: 0, gap: 10 }}>
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: "loan", label: "Rent" },
            { value: "outsource", label: "Outsource" },
          ]}
        />
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingVertical: 12 }}>
          {(Object.keys(labels) as Filter[]).map((f) => (
            <Chip key={f} label={labels[f]} count={mine.filter(match(f)).length} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {list.length === 0 ? (
          <EmptyState icon={Repeat} title="Nothing here" />
        ) : (
          <>
            <SectionLabel right={<Text variant="tiny">{`Open ${formatIDR(openCost)}`}</Text>}>{`${t.name} · ${list.length}`}</SectionLabel>
            <ListCard>
              {list.map((r) => (
                <RentalRow key={r.id} r={r} eventName={eventName(r.eventKey) ?? (r.warehouse ? "Warehouse" : undefined)} />
              ))}
            </ListCard>
          </>
        )}
      </ScrollView>
    </View>
  )
}
