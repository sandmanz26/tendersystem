import { Link, useParams } from "react-router-dom"
import {
  Boxes,
  CalendarCheck,
  Ruler,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CloudOff,
  MapPin,
  PackageX,
  TriangleAlert,
  Warehouse,
} from "lucide-react"

import { CategoryIcon } from "@/components/category-icon"
import { ReportRow } from "@/components/report-row"
import { Callout, SectionLabel } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PHASES } from "@/data/phases"
import { formatDate, relativeDay, stamp } from "@/lib/format"
import { getAsset, personName } from "@/lib/lookup"
import { getPhaseProgress, isClosed } from "@/lib/progress"
import { cn } from "@/lib/utils"
import { getWhereabouts } from "@/lib/whereabouts"
import { useAppStore } from "@/store/app-store"
import { NotFound } from "./not-found"

/** /items/:code (inventory) and /event/:eventId/items/:code (in an event). */
export function ItemDetailPage() {
  const { eventId, code } = useParams()
  const store = useAppStore()
  const { events, scans, reports } = store
  const asset = code ? getAsset(code) : undefined
  const event = eventId ? events.find((e) => e.id === eventId) : undefined
  if (!asset || (eventId && (!event || !event.assetCodes.includes(asset.code)))) return <NotFound />

  const assetReports = reports.filter((r) => r.assetCode === asset.code)
  const where = getWhereabouts(asset.code, events, scans)
  const reportEvent = event?.id ?? (where.at === "event" ? where.event.id : undefined)
  const reportHref = `/new-report?type=damage&asset=${asset.code}${reportEvent ? `&event=${reportEvent}` : ""}`
  const bookings = events
    .filter((e) => e.assetCodes.includes(asset.code) && !isClosed(e))
    .sort((a, b) => a.date.localeCompare(b.date))
  const conditionVariant =
    asset.condition === "Good" ? "success" : asset.condition === "Needs check" ? "warning" : "destructive"

  return (
    <div>
      <TopBar titleAs="p" title={asset.name} subtitle={event ? event.couple : "Inventory"} />

      <section className="px-4 pt-2">
        <div className="rounded-xl p-4 edge">
          <div className="flex items-start gap-4">
            <CategoryIcon category={asset.category} className="size-14 rounded-md bg-secondary [&_svg]:size-7" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-muted-foreground">{asset.code}</p>
              <h1 className="mt-0.5 text-[20px] leading-tight font-bold">{asset.name}</h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{asset.category}</Badge>
                <Badge variant={conditionVariant}>{asset.condition}</Badge>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "mt-4 flex items-center gap-3 rounded-md px-3.5 py-3",
              where.at === "warehouse" ? "bg-secondary" : "bg-accent"
            )}
          >
            {where.at === "warehouse" ? (
              <Warehouse className="size-[18px] shrink-0 text-muted-foreground" />
            ) : (
              <MapPin className="size-[18px] shrink-0 text-accent-foreground" />
            )}
            <p className="min-w-0 flex-1 truncate text-[14px] font-semibold">
              {where.at === "warehouse" ? asset.location : where.event.couple}
            </p>
            {where.at === "event" && (
              <span className="shrink-0 text-[13px] text-muted-foreground tabular">out {stamp(where.since)}</span>
            )}
          </div>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to={reportHref}>
              <PackageX className="text-warning" />
              Report damage
            </Link>
          </Button>
        </div>

        {asset.notes && (
          <Callout icon={TriangleAlert} className="mt-3">
            {asset.notes}
          </Callout>
        )}
      </section>

      {/* Facts as icon tiles: value first, a one-word label under it. */}
      <div className={cn("mx-4 mt-3 grid gap-px overflow-hidden rounded-xl border bg-border", asset.dimensions ? "grid-cols-2" : "grid-cols-3")}>
        <Fact icon={Boxes} label="Per scan" value={asset.unit} />
        <Fact icon={Warehouse} label="Spot" value={asset.location.replace(/^Warehouse\s+/, "")} />
        {asset.dimensions && <Fact icon={Ruler} label="Size" value={asset.dimensions} />}
        <Fact icon={CalendarCheck} label="Checked" value={formatDate(asset.lastChecked, { day: "numeric", month: "short" })} />
      </div>

      {event && (
        <>
          <SectionLabel>Trail at {event.couple}</SectionLabel>
          <ol className="list-card">
            {PHASES.filter((p) => p.requiresScan).map((p) => {
              const phaseIdx = PHASES.indexOf(p)
              const st = getPhaseProgress(event, p, store).byAsset[asset.code]
              const isCurrent = phaseIdx === event.phaseIndex
              const future = phaseIdx > event.phaseIndex
              return (
                <li key={p.key} className="flex items-center gap-3 px-4 py-3">
                  {st.state === "scanned" ? (
                    <CircleCheck
                      className={cn("size-5 shrink-0", st.record.skippedPrevious ? "text-warning" : "text-brand")}
                    />
                  ) : st.state === "reported" ? (
                    <TriangleAlert className="size-5 shrink-0 text-warning" />
                  ) : (
                    <CircleDashed
                      className={cn("size-5 shrink-0", isCurrent ? "text-foreground" : "text-muted-foreground/40")}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium", future && "text-muted-foreground")}>{p.label}</p>
                    {st.state === "scanned" && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        {st.record.synced === false && <CloudOff className="size-3" />}
                        {stamp(st.record.at)} · {personName(st.record.by)}
                        {st.record.skippedPrevious && " · skipped"}
                      </p>
                    )}
                    {st.state === "reported" && (
                      <p className="text-xs text-warning">Reported: {st.report.category}</p>
                    )}
                  </div>
                  {isCurrent && st.state === "pending" && <Badge variant="accent">Now</Badge>}
                </li>
              )
            })}
          </ol>
        </>
      )}

      <SectionLabel>Bookings · {bookings.length}</SectionLabel>
      {bookings.length === 0 ? (
        <p className="list-card px-4 py-3 text-[14px] text-muted-foreground">None</p>
      ) : (
        <ul className="list-card">
          {bookings.map((e) => (
            <li key={e.id}>
              <Link to={`/event/${e.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-muted">
                <CalendarDays className="size-[18px] shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{e.couple}</span>
                  <span className="block text-xs text-muted-foreground">
                    {relativeDay(e.date)} · {PHASES[e.phaseIndex]?.label}
                  </span>
                </span>
                {e.id === event?.id && <Badge variant="secondary">This event</Badge>}
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <SectionLabel>Report history · {assetReports.length}</SectionLabel>
      {assetReports.length === 0 ? (
        <p className="list-card px-4 py-3 text-[14px] text-muted-foreground">None</p>
      ) : (
        <div className="list-card">
          {assetReports.map((r) => (
            <ReportRow key={r.id} report={r} eventName={events.find((e) => e.id === r.eventId)?.couple} />
          ))}
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string
}) {
  return (
    <div className="bg-card px-3 py-2.5">
      <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      <p className="mt-1.5 text-[14px] leading-snug font-semibold">{value}</p>
      <p className="text-[12px] text-muted-foreground">{label}</p>
    </div>
  )
}
