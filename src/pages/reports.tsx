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

type Filter = "Semua" | ReportStatus | "Saya"
const FILTERS: Filter[] = ["Semua", "Terbuka", "Diproses", "Selesai", "Saya"]

export function ReportsPage() {
  const { reports, events, userId } = useAppStore()
  const [filter, setFilter] = React.useState<Filter>("Semua")

  const myEventIds = new Set(events.filter((e) => e.crew.some((c) => c.personId === userId)).map((e) => e.id))
  const visible = reports
    .filter((r) => myEventIds.has(r.eventId))
    .filter((r) => (filter === "Semua" ? true : filter === "Saya" ? r.by === userId : r.status === filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const count = (f: Filter) =>
    reports.filter((r) => myEventIds.has(r.eventId) && (f === "Saya" ? r.by === userId : r.status === f)).length

  return (
    <div>
      <TopBar
        back={false}
        title="Laporan"
        subtitle="Masalah lapangan & barang rusak"
        right={
          <Button asChild size="sm">
            <Link to="/lapor">
              <Plus />
              Lapor
            </Link>
          </Button>
        }
      />
      <div className="overflow-x-auto px-4 py-3 [scrollbar-width:none]">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) => v && setFilter(v as Filter)}
          className="flex-nowrap"
        >
          {FILTERS.map((f) => (
            <ToggleGroupItem key={f} value={f} className="shrink-0">
              {f}
              {f !== "Semua" && <span className="tabular opacity-60">{count(f)}</span>}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada laporan" body="Coba filter lain." />
      ) : (
        <div className="divide-y border-y bg-card">
          {visible.map((r) => (
            <ReportRow key={r.id} report={r} eventName={events.find((e) => e.id === r.eventId)?.couple} />
          ))}
        </div>
      )}
    </div>
  )
}
