import * as React from "react"
import { Link, useParams } from "react-router-dom"
import { ChevronRight, CloudOff, SendHorizontal } from "lucide-react"
import { toast } from "sonner"

import { CategoryIcon } from "@/components/category-icon"
import { PersonAvatar } from "@/components/person-row"
import { SEVERITY_DOT, STATUS_VARIANT } from "@/components/report-row"
import { InfoRow, SectionLabel } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PHASES } from "@/data/phases"
import { stamp } from "@/lib/format"
import { getAsset, getPerson, personName } from "@/lib/lookup"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import { NotFound } from "./not-found"

export function ReportDetailPage() {
  const { id } = useParams()
  const { reports, events, addReportUpdate } = useAppStore()
  const [note, setNote] = React.useState("")
  const [preview, setPreview] = React.useState<string | null>(null)

  const report = reports.find((r) => r.id === id)
  if (!report) return <NotFound />
  const event = events.find((e) => e.id === report.eventId)!
  const asset = report.assetCode ? getAsset(report.assetCode) : undefined
  const author = getPerson(report.by)!

  const thread = [
    { at: report.createdAt, by: report.by, text: "Created the report" },
    ...report.updates,
  ]

  return (
    <div>
      <TopBar titleAs="p" title={report.id} subtitle={event.couple} />

      <section className="mx-4 mt-4 rounded-xl p-4 edge">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={STATUS_VARIANT[report.status]}>{report.status}</Badge>
          <Badge variant="outline">
            <span className={cn("size-1.5 rounded-full", report.status === "Resolved" ? "bg-[#9ca3af]" : SEVERITY_DOT[report.severity])} />
            {report.severity} urgency
          </Badge>
          <Badge variant="secondary">{report.kind === "damage" ? "Damaged item" : "Field issue"}</Badge>
          {report.synced === false && (
            <Badge variant="warning">
              <CloudOff />
              Waiting for signal
            </Badge>
          )}
        </div>
        <h1 className="mt-3 text-[20px] leading-snug font-bold">{report.title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">{report.description}</p>

        {report.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {report.photos.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPreview(src)}
                className="aspect-square overflow-hidden rounded-xl"
              >
                <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {asset && (
        <>
          <SectionLabel>Item</SectionLabel>
          <Link
            to={`/event/${event.id}/items/${asset.code}`}
            className="list-card flex items-center gap-3 px-4 py-3 active:bg-muted"
          >
            <CategoryIcon category={asset.category} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{asset.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                <span className="font-mono text-[12px]">{asset.code}</span> · {asset.location}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </>
      )}

      <SectionLabel>Details</SectionLabel>
      <div className="list-card">
        <InfoRow label={report.kind === "damage" ? "Condition" : "Category"}>{report.category}</InfoRow>
        <InfoRow label="Event">
          <Link to={`/event/${event.id}?tab=reports`} className="underline underline-offset-4">
            {event.couple}
          </Link>
        </InfoRow>
        <InfoRow label="Phase">{PHASES.find((p) => p.key === report.phase)?.label}</InfoRow>
        <InfoRow label="Reported by">{author.name}</InfoRow>
        <InfoRow label="Time">{stamp(report.createdAt)}</InfoRow>
      </div>

      <SectionLabel>Activity</SectionLabel>
      <ol className="list-card px-4 py-1 [&>*+*]:!border-0">
        {thread.map((u, i) => {
          const person = getPerson(u.by)!
          return (
            <li key={i} className="flex gap-3 py-3">
              <PersonAvatar person={person} className="size-7 text-[12px]" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px]">
                  <span className="font-medium">{personName(u.by)}</span>
                  <span className="text-muted-foreground"> · {stamp(u.at)}</span>
                </p>
                <p className={cn("mt-0.5 text-sm", i === 0 && "text-muted-foreground")}>{u.text}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <form
        className="px-4 pt-4 pb-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (!note.trim()) return
          if (report.status === "Resolved") {
            addReportUpdate(report.id, note.trim(), "In progress")
            setNote("")
            toast.success("Report reopened with your update")
            return
          }
          addReportUpdate(report.id, note.trim())
          setNote("")
          toast.success("Update sent")
        }}
      >
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            report.status === "Resolved"
              ? "Problem back? Write an update to reopen it"
              : "Add an update, e.g. handled / need help"
          }
          maxLength={500}
          className="min-h-20"
        />
        <div className="mt-2 flex gap-2">
          {report.status !== "Resolved" && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                addReportUpdate(report.id, note.trim() || "Marked as resolved", "Resolved")
                setNote("")
                toast.success("Report marked as resolved")
              }}
            >
              Mark resolved
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={!note.trim()}>
            <SendHorizontal />
            Send update
          </Button>
        </div>
      </form>

      {preview && (
        <button
          type="button"
          aria-label="Close photo"
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <img src={preview} alt="" className="max-h-full max-w-full rounded-lg" />
        </button>
      )}
    </div>
  )
}
