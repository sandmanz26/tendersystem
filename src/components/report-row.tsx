import { Link } from "react-router-dom"
import { ChevronRight, PackageX, TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { Report, ReportStatus, Severity } from "@/data/types"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

export const STATUS_VARIANT: Record<ReportStatus, "destructive" | "warning" | "muted"> = {
  Terbuka: "destructive",
  Diproses: "warning",
  Selesai: "muted",
}

export const SEVERITY_DOT: Record<Severity, string> = {
  Rendah: "bg-muted-foreground/40",
  Sedang: "bg-warning",
  Tinggi: "bg-destructive",
}

export function ReportRow({ report, eventName }: { report: Report; eventName?: string }) {
  const Icon = report.kind === "damage" ? PackageX : TriangleAlert
  return (
    <Link
      to={`/laporan/${report.id}`}
      className="flex items-start gap-3 px-4 py-3.5 transition-colors active:bg-muted"
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border",
          report.kind === "damage" ? "text-clay" : "text-muted-foreground"
        )}
      >
        <Icon className="size-[17px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm leading-snug font-medium">{report.title}</p>
          <Badge variant={STATUS_VARIANT[report.status]} className="mt-0.5">
            {report.status}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", SEVERITY_DOT[report.severity])} />
          <span>{report.category}</span>
          <span>·</span>
          {eventName && (
            <>
              <span className="truncate">{eventName}</span>
              <span>·</span>
            </>
          )}
          <span className="shrink-0">{timeAgo(report.createdAt)}</span>
        </div>
      </div>
      <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground/60" />
    </Link>
  )
}
