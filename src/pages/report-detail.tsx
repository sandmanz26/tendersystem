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
    { at: report.createdAt, by: report.by, text: "Membuat laporan" },
    ...report.updates,
  ]

  return (
    <div>
      <TopBar title={report.id} subtitle={event.couple} />

      <section className="mx-4 mt-2 rounded-3xl bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={STATUS_VARIANT[report.status]}>{report.status}</Badge>
          <Badge variant="outline">
            <span className={cn("size-1.5 rounded-full", SEVERITY_DOT[report.severity])} />
            Urgensi {report.severity.toLowerCase()}
          </Badge>
          <Badge variant="secondary">{report.kind === "damage" ? "Barang rusak" : "Masalah lapangan"}</Badge>
          {report.synced === false && (
            <Badge variant="warning">
              <CloudOff />
              Menunggu sinyal
            </Badge>
          )}
        </div>
        <h1 className="mt-3 text-xl leading-snug font-bold tracking-tight">{report.title}</h1>
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
                <img src={src} alt={`Foto ${i + 1}`} className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {asset && (
        <>
          <SectionLabel>Barang</SectionLabel>
          <Link
            to={`/event/${event.id}/barang/${asset.code}`}
            className="list-card flex items-center gap-3 px-4 py-3 active:bg-muted"
          >
            <CategoryIcon category={asset.category} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{asset.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                <span className="font-mono text-[11px]">{asset.code}</span> · {asset.location}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/60" />
          </Link>
        </>
      )}

      <SectionLabel>Detail</SectionLabel>
      <div className="list-card">
        <InfoRow label={report.kind === "damage" ? "Kondisi" : "Kategori"}>{report.category}</InfoRow>
        <InfoRow label="Event">
          <Link to={`/event/${event.id}?tab=laporan`} className="underline underline-offset-4">
            {event.couple}
          </Link>
        </InfoRow>
        <InfoRow label="Fase">{PHASES.find((p) => p.key === report.phase)?.label}</InfoRow>
        <InfoRow label="Pelapor">{author.name}</InfoRow>
        <InfoRow label="Waktu">{stamp(report.createdAt)}</InfoRow>
      </div>

      <SectionLabel>Aktivitas</SectionLabel>
      <ol className="list-card px-4 py-1 [&>*+*]:!border-0">
        {thread.map((u, i) => {
          const person = getPerson(u.by)!
          return (
            <li key={i} className="flex gap-3 py-3">
              <PersonAvatar person={person} className="size-7 text-[10px]" />
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
          if (report.status === "Selesai") {
            addReportUpdate(report.id, note.trim(), "Diproses")
            setNote("")
            toast.success("Laporan dibuka lagi dengan update baru")
            return
          }
          addReportUpdate(report.id, note.trim())
          setNote("")
          toast.success("Update terkirim")
        }}
      >
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            report.status === "Selesai"
              ? "Masalah muncul lagi? Tulis update untuk membuka ulang"
              : "Tambah update, mis. sudah ditangani / butuh bantuan"
          }
          maxLength={500}
          className="min-h-20"
        />
        <div className="mt-2 flex gap-2">
          {report.status !== "Selesai" && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                addReportUpdate(report.id, note.trim() || "Ditandai selesai", "Selesai")
                setNote("")
                toast.success("Laporan ditandai selesai")
              }}
            >
              Tandai selesai
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={!note.trim()}>
            <SendHorizontal />
            Kirim update
          </Button>
        </div>
      </form>

      {preview && (
        <button
          type="button"
          aria-label="Tutup foto"
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <img src={preview} alt="" className="max-h-full max-w-full rounded-lg" />
        </button>
      )}
    </div>
  )
}
