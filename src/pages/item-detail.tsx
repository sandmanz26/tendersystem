import { Link, useParams } from "react-router-dom"
import { CircleCheck, CircleDashed, PackageX, TriangleAlert } from "lucide-react"

import { CategoryIcon } from "@/components/category-icon"
import { ReportRow } from "@/components/report-row"
import { InfoRow, SectionLabel } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PHASES } from "@/data/phases"
import { formatDate, stamp } from "@/lib/format"
import { getAsset, personName } from "@/lib/lookup"
import { getPhaseProgress } from "@/lib/progress"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import { NotFound } from "./not-found"

export function ItemDetailPage() {
  const { eventId, code } = useParams()
  const { events, scans, reports } = useAppStore()
  const event = events.find((e) => e.id === eventId)
  const asset = code ? getAsset(code) : undefined
  if (!event || !asset || !event.assetCodes.includes(asset.code)) return <NotFound />

  const assetReports = reports.filter((r) => r.assetCode === asset.code)
  const conditionVariant =
    asset.condition === "Baik" ? "success" : asset.condition === "Perlu cek" ? "warning" : "destructive"

  return (
    <div>
      <TopBar title={asset.name} subtitle={event.couple} />

      <section className="px-4 pt-5">
        <div className="flex items-start gap-4">
          <CategoryIcon category={asset.category} className="size-14 rounded-xl [&_svg]:size-6" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs tracking-wide text-muted-foreground">{asset.code}</p>
            <h1 className="mt-0.5 text-xl leading-tight font-semibold">{asset.name}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline">{asset.category}</Badge>
              <Badge variant={conditionVariant}>{asset.condition}</Badge>
            </div>
          </div>
        </div>

        {asset.notes && (
          <div className="mt-4 flex gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-[13px]">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[oklch(0.5_0.11_65)]" />
            <span>{asset.notes}</span>
          </div>
        )}
      </section>

      <SectionLabel>Detail</SectionLabel>
      <div className="divide-y border-y bg-card px-4">
        <InfoRow label="Isi per scan">{asset.unit}</InfoRow>
        <InfoRow label="Lokasi gudang">{asset.location}</InfoRow>
        {asset.dimensions && <InfoRow label="Dimensi">{asset.dimensions}</InfoRow>}
        <InfoRow label="Terakhir dicek">
          {formatDate(asset.lastChecked, { day: "numeric", month: "long", year: "numeric" })}
        </InfoRow>
      </div>

      <SectionLabel>Jejak di event ini</SectionLabel>
      <ol className="border-y bg-card px-4 py-2">
        {PHASES.filter((p) => p.requiresScan).map((p) => {
          const phaseIdx = PHASES.indexOf(p)
          const st = getPhaseProgress(event, p, scans, reports).byAsset[asset.code]
          const isCurrent = phaseIdx === event.phaseIndex
          const future = phaseIdx > event.phaseIndex
          return (
            <li key={p.key} className="flex items-center gap-3 py-2.5">
              {st.state === "scanned" ? (
                <CircleCheck className="size-[18px] shrink-0 text-success" />
              ) : st.state === "reported" ? (
                <TriangleAlert className="size-[18px] shrink-0 text-clay" />
              ) : (
                <CircleDashed
                  className={cn(
                    "size-[18px] shrink-0",
                    isCurrent ? "text-foreground" : "text-muted-foreground/40"
                  )}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", future && "text-muted-foreground")}>{p.label}</p>
                {st.state === "scanned" && (
                  <p className="text-xs text-muted-foreground">
                    {stamp(st.record.at)} · {personName(st.record.by)}
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

      <SectionLabel>Riwayat laporan · {assetReports.length}</SectionLabel>
      {assetReports.length === 0 ? (
        <p className="border-y bg-card px-4 py-4 text-[13px] text-muted-foreground">
          Belum pernah dilaporkan rusak atau hilang.
        </p>
      ) : (
        <div className="divide-y border-y bg-card">
          {assetReports.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              eventName={events.find((e) => e.id === r.eventId)?.couple}
            />
          ))}
        </div>
      )}

      <div className="px-4 pt-6 pb-4">
        <Button asChild variant="outline" size="lg" className="w-full border-clay/40 text-clay">
          <Link to={`/lapor?event=${event.id}&type=damage&asset=${asset.code}`}>
            <PackageX />
            Laporkan rusak / hilang
          </Link>
        </Button>
      </div>
    </div>
  )
}
