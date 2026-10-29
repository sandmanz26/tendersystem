import { ClipboardList, Plus } from "lucide-react-native"
import * as React from "react"
import { ScrollView, View } from "react-native"

import type { ReportStatus } from "../core/types"
import { useNav } from "../navigation"
import { useAppStore } from "../store"
import { Header, ReportRow } from "../ui/domain"
import { Button, Chip, EmptyState, ListCard } from "../ui/primitives"

type Filter = "All" | ReportStatus | "Mine"
const FILTERS: Filter[] = ["All", "Open", "In progress", "Resolved", "Mine"]

export function ReportsScreen() {
  const nav = useNav()
  const { reports, events, userId } = useAppStore()
  const [filter, setFilter] = React.useState<Filter>("All")

  // Only reports from events this crew member works on.
  const myEventIds = new Set(events.filter((e) => e.crew.some((c) => c.personId === userId)).map((e) => e.id))
  const mine = reports.filter((r) => myEventIds.has(r.eventId))
  const matches = (f: Filter) => (r: (typeof mine)[number]) =>
    f === "All" ? true : f === "Mine" ? r.by === userId : r.status === f
  const visible = mine.filter(matches(filter)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <View style={{ flex: 1 }}>
      <Header large title="Reports" right={<Button icon={Plus} title="Report" onPress={() => nav.navigate("NewReport")} />} />
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole="radiogroup"
          contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingBottom: 12 }}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f}
              label={f}
              count={f === "All" ? undefined : mine.filter(matches(f)).length}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {visible.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No reports" />
        ) : (
          <ListCard>
            {visible.map((r) => (
              <ReportRow
                key={r.id}
                report={r}
                eventName={events.find((e) => e.id === r.eventId)?.couple}
                onPress={() => nav.navigate("ReportDetail", { reportId: r.id })}
              />
            ))}
          </ListCard>
        )}
      </ScrollView>
    </View>
  )
}
