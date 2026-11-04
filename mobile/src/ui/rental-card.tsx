import { CalendarRange, Store, Warehouse } from "lucide-react-native"
import * as React from "react"
import { Alert, View } from "react-native"

import { fmtDay, fmtNum, formatIDR } from "../core/format"
import { KIND_TEXT, rentalDisplay, rentalLabel } from "../core/rules"
import type { Rental } from "../core/types"
import { useAppStore } from "../store"
import { color, tabular } from "../theme"
import { Button, Meta, MetaRow, Tag, Text, type Tone } from "./primitives"
import { useToast } from "./toast"

const TONE = { Requested: "orange", Received: "brand", Done: "green", Overdue: "red" } as const satisfies Record<string, Tone>

/** One rent or outsource record with its single next action. Never touches stock. */
export function RentalRow({ r, eventName, locked }: { r: Rental; eventName?: string; locked?: boolean }) {
  const store = useAppStore()
  const toast = useToast()
  const t = KIND_TEXT[r.kind]
  const d = rentalDisplay(r, store.today)
  const canAct = store.writable && !locked

  const receive = () => {
    store.receiveRental(r.id)
    toast.show(r.eventKey ? `${r.itemName} received · added to the event` : `${r.itemName} received`, "success")
  }
  const done = () =>
    Alert.alert(`${t.markDone}?`, `${fmtNum(r.qty)} ${r.unit} ${r.itemName} ${r.kind === "loan" ? "go back to" : "are completed by"} ${r.vendorName}. Always the full quantity.`, [
      { text: "Cancel", style: "cancel" },
      { text: t.markDone, onPress: () => store.returnRental(r.id) },
    ])

  return (
    <View style={{ paddingHorizontal: 14, paddingVertical: 12, gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="strong" numberOfLines={1}>
            {r.itemName}
          </Text>
          <Text variant="meta" style={tabular} numberOfLines={1}>
            {`${fmtNum(r.qty)} ${r.unit} · ${formatIDR(r.qty * r.rentalCost)}`}
            {eventName ? ` · ${eventName}` : r.area ? ` · ${r.area}` : ""}
          </Text>
        </View>
        <Tag label={rentalLabel(r, store.today)} tone={TONE[d]} />
      </View>
      <MetaRow>
        <Meta icon={Store}>{r.vendorName}</Meta>
        <Meta icon={CalendarRange} textStyle={d === "Overdue" && { color: color.red, fontWeight: "600" }}>
          {`${fmtDay(r.startDate)} → ${fmtDay(r.dueDate)}`}
        </Meta>
        {r.warehouse && <Meta icon={Warehouse}>{r.warehouse}</Meta>}
      </MetaRow>
      {canAct && r.status === "Requested" && <Button size="sm" variant="positive" title={t.markReceived} onPress={receive} style={{ alignSelf: "flex-start" }} />}
      {canAct && r.status === "Borrowed" && <Button size="sm" variant="outline" title={t.markDone} onPress={done} style={{ alignSelf: "flex-start" }} />}
    </View>
  )
}
