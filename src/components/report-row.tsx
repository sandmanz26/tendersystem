import { Link } from "react-router-dom"
import { ChevronRight, CloudOff, PackageX, TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { Report, ReportStatus, Severity } from "@/data/types"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

export const STATUS_VARIANT: Record<ReportStatus, "destructive" | "warning" | "muted"> = {
  Open: "destructive",
  "In progress": "warning",
  Resolved: "muted",
}

export const SEVERITY_DOT: Record<Severity, string> = {
  Low: "bg-[#9ca3af]",
  Medium: "bg-warning",
  High: "bg-destructive",
}

export function ReportRow({ report, eventName }: { report: Report; eventName?: string }) {
  const Icon = report.kind === "damage" ? PackageX : TriangleAlert
  return (
    <Link
      to={`/reports/${report.id}`}
      className="flex items-start gap-3 px-4 py-3.5 transition-colors active:bg-muted"
    >
      <Icon
        className={cn("mt-0.5 size-[18px] shrink-0", report.kind === "damage" ? "text-warning" : "text-muted-foreground")}
        strokeWidth={1.6}
      />
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
          {report.synced === false && (
            <span className="flex shrink-0 items-center gap-0.5 text-[oklch(0.5_0.1_60)]">
              <CloudOff className="size-3" /> queued
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
