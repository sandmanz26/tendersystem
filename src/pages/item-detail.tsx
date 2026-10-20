import { Link, useParams } from "react-router-dom"
import {
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
import { Callout, InfoRow, SectionLabel } from "@/components/section"
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

/** /barang/:code (inventory) and /event/:eventId/barang/:code (in an event). */
export function ItemDetailPage() {
  const { eventId, code } = useParams()
  const store = useAppStore()
  const { events, scans, reports } = store
  const asset = code ? getAsset(code) : undefined
  const event = eventId ? events.find((e) => e.id === eventId) : undefined
  if (!asset || (eventId && (!event || !event.assetCodes.includes(asset.code)))) return <NotFound />

  const assetReports = reports.filter((r) => r.assetCode === asset.code)
  const where = getWhereabouts(asset.code, events, scans)
  const bookings = events
    .filter((e) => e.assetCodes.includes(asset.code) && !isClosed(e))
    .sort((a, b) => a.date.localeCompare(b.date))
  const conditionVariant =
    asset.condition === "Baik" ? "success" : asset.condition === "Perlu cek" ? "warning" : "destructive"

  return (
    <div>
      <TopBar title={asset.name} subtitle={event ? event.couple : "Inventaris"} />

      <section className="px-4 pt-2">
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-start gap-4">
            <CategoryIcon category={asset.category} className="size-16 rounded-2xl [&_svg]:size-7" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-muted-foreground">{asset.code}</p>
              <h1 className="mt-0.5 text-xl leading-tight font-bold tracking-tight">{asset.name}</h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{asset.category}</Badge>
                <Badge variant={conditionVariant}>{asset.condition}</Badge>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "mt-4 flex items-center gap-3 rounded-2xl px-3.5 py-3",
              where.at === "warehouse" ? "bg-secondary" : "bg-accent"
            )}
          >
            {where.at === "warehouse" ? (
              <Warehouse className="size-[18px] shrink-0 text-muted-foreground" />
            ) : (
              <MapPin className="size-[18px] shrink-0 text-accent-foreground" />
            )}
            <div className="min-w-0 text-[13px]">
              <p className="font-semibold">
                {where.at === "warehouse" ? `Di gudang · ${asset.location}` : `Di event ${where.event.couple}`}
              </p>
              {where.at === "event" && (
                <p className="text-muted-foreground">Keluar gudang {stamp(where.since)}</p>
              )}
            </div>
          </div>
        </div>

        {asset.notes && (
          <Callout icon={TriangleAlert} className="mt-3">
            {asset.notes}
          </Callout>
        )}
      </section>

      <SectionLabel>Detail</SectionLabel>
      <div className="list-card">
        <InfoRow label="Isi per scan">{asset.unit}</InfoRow>
        <InfoRow label="Lokasi gudang">{asset.location}</InfoRow>
        {asset.dimensions && <InfoRow label="Dimensi">{asset.dimensions}</InfoRow>}
        <InfoRow label="Terakhir dicek">
          {formatDate(asset.lastChecked, { day: "numeric", month: "long", year: "numeric" })}
        </InfoRow>
      </div>

      {event && (
        <>
          <SectionLabel>Jejak di {event.couple}</SectionLabel>
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
                      className={cn("size-5 shrink-0", st.record.skippedPrevious ? "text-clay" : "text-brand")}
                    />
                  ) : st.state === "reported" ? (
                    <TriangleAlert className="size-5 shrink-0 text-clay" />
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
                        {st.record.skippedPrevious && " · lewat checkpoint"}
                      </p>
                    )}
                    {st.state === "reported" && (
                      <p className="text-xs text-clay">Dilaporkan: {st.report.category}</p>
                    )}
                  </div>
                  {isCurrent && st.state === "pending" && <Badge variant="outline">Menunggu scan</Badge>}
                </li>
              )
            })}
          </ol>
        </>
      )}

      <SectionLabel>Jadwal pemakaian · {bookings.length}</SectionLabel>
      {bookings.length === 0 ? (
        <p className="list-card px-4 py-4 text-[13px] text-muted-foreground">Belum dijadwalkan.</p>
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
                {e.id === event?.id && <Badge variant="secondary">Event ini</Badge>}
                <ChevronRight className="size-4 text-muted-foreground/50" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <SectionLabel>Riwayat laporan · {assetReports.length}</SectionLabel>
      {assetReports.length === 0 ? (
        <p className="list-card px-4 py-4 text-[13px] text-muted-foreground">
          Belum pernah dilaporkan rusak atau hilang.
        </p>
      ) : (
        <div className="list-card">
          {assetReports.map((r) => (
            <ReportRow key={r.id} report={r} eventName={events.find((e) => e.id === r.eventId)?.couple} />
          ))}
        </div>
      )}

      <div className="px-4 pt-6 pb-4">
        <Button asChild variant="outline" size="lg" className="w-full text-clay">
          <Link
            to={`/lapor?type=damage&asset=${asset.code}${event ? `&event=${event.id}` : where.at === "event" ? `&event=${where.event.id}` : ""}`}
          >
            <PackageX />
            Laporkan rusak / hilang
          </Link>
        </Button>
      </div>
    </div>
  )
}
