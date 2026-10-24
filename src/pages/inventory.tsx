import * as React from "react"
import { Link } from "react-router-dom"
import { ChevronRight, PackageSearch, Search } from "lucide-react"

import { CategoryIcon } from "@/components/category-icon"
import { EmptyState, SectionLabel } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ASSETS } from "@/data/mock"
import type { AssetCategory } from "@/data/types"
import { cn } from "@/lib/utils"
import { getWhereabouts } from "@/lib/whereabouts"
import { useAppStore } from "@/store/app-store"

const CATEGORIES = ["All", ...new Set(ASSETS.map((a) => a.category))] as const

export function InventoryPage() {
  const { events, scans } = useAppStore()
  const [q, setQ] = React.useState("")
  const [cat, setCat] = React.useState<AssetCategory | "All">("All")
  const s = q.trim().toLowerCase()

  const items = ASSETS.filter((a) => cat === "All" || a.category === cat).filter(
    (a) => !s || a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s) || a.location.toLowerCase().includes(s)
  )
  const outCount = ASSETS.filter((a) => getWhereabouts(a.code, events, scans).at === "event").length

  return (
    <div>
      <TopBar large back={false} subtitle={`${ASSETS.length} assets · ${outCount} out right now`} title="Items" />
      <div className="space-y-3 px-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, code, or rack"
            className="pl-10"
          />
        </div>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn(
                "h-9 shrink-0 rounded-md border px-3 text-[13px] font-medium",
                cat === c ? "border-brand bg-brand-soft text-brand-ink" : "border-input bg-card"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={PackageSearch} title="No items found" body="Try another keyword or the code on the label." />
      ) : (
        <>
          <SectionLabel>{items.length} items</SectionLabel>
          <ul className="list-card">
            {items.map((a) => {
              const where = getWhereabouts(a.code, events, scans)
              return (
                <li key={a.code}>
                  <Link to={`/items/${a.code}`} className="flex items-center gap-3 px-4 py-3 active:bg-muted">
                    <CategoryIcon category={a.category} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono text-[12px]">{a.code}</span> ·{" "}
                        {where.at === "event" ? `at ${where.event.couple}` : a.location}
                      </p>
                    </div>
                    {a.condition !== "Good" && <Badge variant="warning">{a.condition}</Badge>}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
