import * as React from "react"
import { Link } from "react-router-dom"
import { ChevronRight, MapPin, PackageSearch, Search, Warehouse } from "lucide-react"

import { CategoryIcon } from "@/components/category-icon"
import { Meta } from "@/components/meta"
import { EmptyState, SectionLabel } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ASSETS } from "@/data/mock"
import type { Asset } from "@/data/types"
import { cn } from "@/lib/utils"
import { getWhereabouts, type Whereabouts } from "@/lib/whereabouts"
import { useAppStore } from "@/store/app-store"

type Status = "all" | "out" | "in" | "check"

/** "Warehouse A · Zone 1" → "A · Zone 1": the warehouse icon already says warehouse. */
function shortSpot(location: string) {
  return location.replace(/^Warehouse\s+/, "")
}

export function InventoryPage() {
  const { events, scans } = useAppStore()
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState<Status>("all")
  const s = q.trim().toLowerCase()

  const rows = ASSETS.map((a) => ({ asset: a, where: getWhereabouts(a.code, events, scans) }))
  const matches = (r: { asset: Asset; where: Whereabouts }, st: Status) =>
    st === "all" ||
    (st === "out" && r.where.at === "event") ||
    (st === "in" && r.where.at === "warehouse") ||
    (st === "check" && r.asset.condition !== "Good")
  const count = (st: Status) => rows.filter((r) => matches(r, st)).length

  const visible = rows
    .filter((r) => matches(r, status))
    .filter(
      ({ asset: a }) =>
        !s || a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s) || a.location.toLowerCase().includes(s)
    )
  const groups = Object.entries(
    visible.reduce<Record<string, typeof visible>>((acc, r) => {
      ;(acc[r.asset.category] ??= []).push(r)
      return acc
    }, {})
  )

  const chips: [Status, string][] = [
    ["all", "All"],
    ["out", "Out"],
    ["in", "In"],
    ["check", "Check"],
  ]

  return (
    <div>
      <TopBar large back={false} title="Items" />
      <div className="space-y-3 px-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, code or rack" className="pl-10" />
        </div>
        <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Filter by status">
          {chips.map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={status === v}
              onClick={() => setStatus(v)}
              className={cn(
                "flex h-14 flex-col items-center justify-center rounded-md border leading-tight",
                status === v ? "border-brand bg-brand-soft text-brand-ink" : "border-input bg-card"
              )}
            >
              <span className="text-[17px] font-semibold tabular">{count(v)}</span>
              <span className={cn("text-[12px]", status === v ? "text-brand-ink" : "text-muted-foreground")}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 && <EmptyState icon={PackageSearch} title="No items found" />}

      {groups.map(([category, list]) => (
        <div key={category}>
          <SectionLabel>
            {category} · {list.length}
          </SectionLabel>
          <ul className="list-card">
            {list.map(({ asset: a, where }) => (
              <li key={a.code}>
                <Link to={`/items/${a.code}`} className="flex items-center gap-3 px-4 py-2.5 active:bg-secondary">
                  <CategoryIcon category={a.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{a.name}</p>
                    <p className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
                      <span className="shrink-0 font-mono text-[12px]">{a.code}</span>
                      {where.at === "event" ? (
                        <Meta icon={MapPin} label="At event" className="min-w-0 truncate text-brand-ink">
                          {where.event.couple}
                        </Meta>
                      ) : (
                        <Meta icon={Warehouse} label="In warehouse" className="min-w-0 truncate">
                          {shortSpot(a.location)}
                        </Meta>
                      )}
                    </p>
                  </div>
                  {a.condition !== "Good" && <Badge variant="warning">{a.condition}</Badge>}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
