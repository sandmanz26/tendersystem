import * as React from "react"
import { Link } from "react-router-dom"
import { ClipboardList, Plus } from "lucide-react"

import { ReportRow } from "@/components/report-row"
import { EmptyState } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ReportStatus } from "@/data/types"
import { useAppStore } from "@/store/app-store"

type Filter = "All" | ReportStatus | "Mine"
const FILTERS: Filter[] = ["All", "Open", "In progress", "Resolved", "Mine"]

export function ReportsPage() {
  const { reports, events, userId } = useAppStore()
  const [filter, setFilter] = React.useState<Filter>("All")

  const myEventIds = new Set(events.filter((e) => e.crew.some((c) => c.personId === userId)).map((e) => e.id))
  const visible = reports
    .filter((r) => myEventIds.has(r.eventId))
    .filter((r) => (filter === "All" ? true : filter === "Mine" ? r.by === userId : r.status === filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const count = (f: Filter) =>
    reports.filter((r) => myEventIds.has(r.eventId) && (f === "Mine" ? r.by === userId : r.status === f)).length

  return (
    <div>
      <TopBar
        large
        back={false}
        title="Reports"
        right={
          <Button asChild size="sm">
            <Link to="/new-report">
              <Plus />
              Report
            </Link>
          </Button>
        }
      />
      <div className="overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) => v && setFilter(v as Filter)}
          className="flex-nowrap"
        >
          {FILTERS.map((f) => (
            <ToggleGroupItem key={f} value={f} className="shrink-0">
              {f}
              {f !== "All" && <span className="tabular opacity-60">{count(f)}</span>}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No reports" body="Try another filter." />
      ) : (
        <div className="list-card">
          {visible.map((r) => (
            <ReportRow key={r.id} report={r} eventName={events.find((e) => e.id === r.eventId)?.couple} />
          ))}
        </div>
      )}
    </div>
  )
}
