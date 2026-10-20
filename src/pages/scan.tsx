import * as React from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  Camera,
  CameraOff,
  CircleCheck,
  CircleDashed,
  CornerDownLeft,
  Info,
  PackageCheck,
  ScanLine,
  TriangleAlert,
  Wand2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { PhaseTrack } from "@/components/phase-track"
import { EmptyState, SectionLabel } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PHASES } from "@/data/phases"
import { cameraScanSupported, useBarcodeCamera } from "@/hooks/use-barcode-camera"
import { clock, relativeDay } from "@/lib/format"
import { getAsset } from "@/lib/lookup"
import { getEventProgress } from "@/lib/progress"
import { cn } from "@/lib/utils"
import { useAppStore, type ScanResult } from "@/store/app-store"
import { NotFound } from "./not-found"

/* /scan: pick which event to scan for. One crew member can be on several events. */
export function ScanPickerPage() {
  const { events, scans, reports, userId } = useAppStore()
  const scannable = events
    .filter((e) => e.crew.some((c) => c.personId === userId))
    .map((e) => ({ e, p: getEventProgress(e, scans, reports) }))
    .filter(({ p }) => p?.phase.requiresScan)
    .sort((a, b) => a.e.date.localeCompare(b.e.date))

  return (
    <div>
      <TopBar back={false} title="Scan barang" subtitle="Pilih event yang sedang kamu kerjakan" />
      {scannable.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="Tidak ada fase yang perlu scan"
          body="Scan dibutuhkan saat muat di gudang, tiba di venue, bongkar, dan kembali ke gudang."
        />
      ) : (
        <>
          <SectionLabel>Menunggu scan · {scannable.length}</SectionLabel>
          <ul className="divide-y border-y bg-card">
            {scannable.map(({ e, p }) => {
              const cleared = p!.scanned + p!.reported
              return (
                <li key={e.id}>
                  <Link to={`/scan/${e.id}`} className="block px-4 py-4 active:bg-muted">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-serif text-lg font-medium">{e.couple}</p>
                        <p className="text-[13px] text-muted-foreground">
                          {relativeDay(e.date)} · {e.venue.name}
                        </p>
                      </div>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <ScanLine className="size-[18px]" />
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between text-[13px]">
                      <span className="font-medium">{p!.phase.label}</span>
                      <span className="text-muted-foreground tabular">
                        {cleared}/{p!.total}
                      </span>
                    </div>
                    <Progress value={(cleared / p!.total) * 100} className="mt-1.5" />
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

type Feedback = ScanResult & { name?: string; key: number }

/* /scan/:eventId: the scanner for the event's current phase. */
export function ScannerPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { events, scans, reports, scan, advancePhase } = useAppStore()
  const event = events.find((e) => e.id === eventId)

  const [manual, setManual] = React.useState("")
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [camera, setCamera] = React.useState(false)
  const [list, setList] = React.useState<"pending" | "done">("pending")
  const [confirm, setConfirm] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const counter = React.useRef(0)

  const handleCode = React.useCallback(
    (code: string) => {
      if (!eventId) return
      const result = scan(eventId, code)
      if (result.status === "ok") navigator.vibrate?.(35)
      else navigator.vibrate?.([60, 60, 60])
      setFeedback({ ...result, name: getAsset(result.code)?.name, key: ++counter.current })
    },
    [eventId, scan]
  )

  const { error: cameraError } = useBarcodeCamera(videoRef, camera, handleCode)

  if (!event) return <NotFound />
  const progress = getEventProgress(event, scans, reports)
  const phase = PHASES[event.phaseIndex]

  if (!progress || !phase?.requiresScan) {
    return (
      <div>
        <TopBar title={event.couple} />
        <EmptyState
          icon={Info}
          title={phase ? `Fase ${phase.label} tidak butuh scan` : "Event sudah ditutup"}
          action={
            <Button asChild variant="outline">
              <Link to={`/event/${event.id}`}>Kembali ke event</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const cleared = progress.scanned + progress.reported
  const pct = (cleared / progress.total) * 100
  const doneCodes = event.assetCodes.filter((c) => progress.byAsset[c].state !== "pending")
  const next = PHASES[event.phaseIndex + 1]

  const simulate = () => {
    const code = progress.pending[Math.floor(Math.random() * progress.pending.length)]
    if (code) handleCode(code)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Dark capture area */}
      <div className="bg-[oklch(0.2_0.012_60)] text-[oklch(0.96_0.008_85)]">
        <div className="flex h-14 items-center gap-1 px-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tutup scanner"
            className="hover:bg-white/10"
            onClick={() => navigate(`/event/${event.id}`)}
          >
            <X className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{phase.label}</p>
            <p className="truncate text-xs text-white/55">{event.couple}</p>
          </div>
          <div className="pr-2 text-right tabular">
            <span className="text-xl font-semibold">{cleared}</span>
            <span className="text-sm text-white/50">/{progress.total}</span>
          </div>
        </div>

        <div className="px-4">
          <PhaseTrack index={event.phaseIndex} showLabels={false} tone="dark" />
        </div>

        <div className="relative mx-4 mt-4 aspect-[4/3] overflow-hidden rounded-xl bg-black/40">
          {camera && (
            <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />
          )}
          <Viewfinder active={camera} />
          {!camera && (
            <div className="absolute inset-x-0 bottom-4 text-center text-[13px] text-white/60">
              {cameraScanSupported
                ? "Nyalakan kamera, arahkan ke label QR"
                : "Ketik kode di label, atau pakai scanner demo"}
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-x-3 bottom-3 rounded-lg bg-black/70 px-3 py-2 text-xs">
              {cameraError}
            </div>
          )}
        </div>

        <div className="px-4 pt-3 pb-4">
          <ScanFeedback feedback={feedback} />
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!manual.trim()) return
              handleCode(manual)
              setManual("")
            }}
          >
            <Input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Kode barang, mis. KRS-TFG-01"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="border-white/15 bg-white/8 font-mono text-[14px] text-white uppercase placeholder:font-sans placeholder:normal-case placeholder:text-white/40"
            />
            <Button type="submit" size="icon" variant="secondary" aria-label="Kirim kode">
              <CornerDownLeft />
            </Button>
          </form>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
              disabled={!cameraScanSupported}
              onClick={() => setCamera((c) => !c)}
            >
              {camera ? <CameraOff /> : <Camera />}
              {camera ? "Matikan kamera" : "Kamera"}
            </Button>
            <Button
              variant="outline"
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
              disabled={progress.pending.length === 0}
              onClick={simulate}
            >
              <Wand2 />
              Scan demo
            </Button>
          </div>
        </div>
      </div>

      {/* Light checklist area */}
      <div className="flex-1 pb-24">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <ToggleGroup type="single" value={list} onValueChange={(v) => v && setList(v as typeof list)}>
            <ToggleGroupItem value="pending">Belum · {progress.pending.length}</ToggleGroupItem>
            <ToggleGroupItem value="done">Selesai · {doneCodes.length}</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {list === "pending" && progress.pending.length === 0 && (
          <EmptyState
            icon={PackageCheck}
            title="Semua barang sudah tercatat"
            body={next ? `Lanjutkan ke fase ${next.label}.` : "Event siap ditutup."}
          />
        )}

        <ul className="divide-y border-y bg-card empty:hidden">
          {(list === "pending" ? progress.pending : doneCodes).map((code) => {
            const asset = getAsset(code)!
            const st = progress.byAsset[code]
            return (
              <li key={code} className="flex items-center gap-3 px-4 py-3">
                {st.state === "scanned" ? (
                  <CircleCheck className="size-5 shrink-0 text-success" />
                ) : st.state === "reported" ? (
                  <TriangleAlert className="size-5 shrink-0 text-clay" />
                ) : (
                  <CircleDashed className="size-5 shrink-0 text-muted-foreground/60" />
                )}
                <Link to={`/event/${event.id}/barang/${code}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{asset.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono text-[11px] text-foreground/70">{code}</span> · {asset.unit}
                  </p>
                </Link>
                {st.state === "pending" && (
                  <Button asChild size="sm" variant="ghost" className="text-clay">
                    <Link to={`/lapor?event=${event.id}&type=damage&asset=${code}`}>Lapor</Link>
                  </Button>
                )}
                {st.state === "scanned" && (
                  <span className="text-xs text-muted-foreground tabular">{clock(st.record.at)}</span>
                )}
                {st.state === "reported" && <Badge variant="warning">{st.report.category}</Badge>}
              </li>
            )
          })}
        </ul>

        {list === "pending" && progress.pending.length > 0 && (
          <p className="px-4 pt-3 text-xs text-muted-foreground">
            Barang hilang atau rusak? Tekan <span className="font-medium text-clay">Lapor</span>.
            Barang yang dilaporkan tidak menahan fase.
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[440px] border-t bg-card/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{progress.complete ? "Siap lanjut" : `${progress.pending.length} barang lagi`}</span>
          <span className="tabular">{Math.round(pct)}%</span>
        </div>
        <Button
          size="lg"
          className="w-full"
          disabled={!progress.complete}
          onClick={() => setConfirm(true)}
        >
          {next ? `Selesai, lanjut ke ${next.label}` : "Selesai, tutup event"}
        </Button>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan “{phase.label}”?</DialogTitle>
            <DialogDescription>
              {progress.scanned} barang discan
              {progress.reported > 0 && `, ${progress.reported} dilaporkan rusak/hilang`}.
              {next ? ` Event pindah ke fase ${next.label}.` : " Event akan ditutup."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Batal</Button>
            </DialogClose>
            <Button
              onClick={() => {
                advancePhase(event.id)
                toast.success(next ? `Masuk fase ${next.label}` : "Event ditutup")
                navigate(`/event/${event.id}`, { replace: true })
              }}
            >
              Ya, selesaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Viewfinder({ active }: { active: boolean }) {
  const corner = "absolute size-7 border-white/85"
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative size-[58%]">
        <span className={cn(corner, "top-0 left-0 rounded-tl-lg border-t-2 border-l-2")} />
        <span className={cn(corner, "top-0 right-0 rounded-tr-lg border-t-2 border-r-2")} />
        <span className={cn(corner, "bottom-0 left-0 rounded-bl-lg border-b-2 border-l-2")} />
        <span className={cn(corner, "right-0 bottom-0 rounded-br-lg border-r-2 border-b-2")} />
        <div className="absolute inset-x-3 top-0 bottom-0 overflow-hidden">
          <div
            className={cn(
              "absolute inset-x-0 h-px bg-[oklch(0.85_0.12_150)] shadow-[0_0_12px_2px_oklch(0.85_0.12_150/0.6)]",
              active ? "animate-sweep" : "opacity-0"
            )}
          />
        </div>
        {!active && (
          <ScanLine className="absolute top-1/2 left-1/2 size-8 -translate-1/2 text-white/25" />
        )}
      </div>
    </div>
  )
}

function ScanFeedback({ feedback }: { feedback: Feedback | null }) {
  if (!feedback)
    return (
      <div className="flex h-14 items-center rounded-lg border border-dashed border-white/15 px-3 text-[13px] text-white/45">
        Hasil scan muncul di sini
      </div>
    )

  const tone = {
    ok: "bg-[oklch(0.42_0.08_155)] text-white",
    duplicate: "bg-[oklch(0.45_0.08_75)] text-white",
    unknown: "bg-[oklch(0.45_0.13_30)] text-white",
    "not-scan-phase": "bg-white/10 text-white",
  }[feedback.status]

  const title = {
    ok: feedback.name,
    duplicate: `${feedback.name} sudah discan`,
    unknown: "Kode tidak ada di daftar event ini",
    "not-scan-phase": "Fase ini tidak butuh scan",
  }[feedback.status]

  const detail =
    feedback.status === "duplicate"
      ? `${feedback.code} · tercatat ${clock(feedback.at)}`
      : feedback.status === "unknown"
        ? `${feedback.code} · cek ulang label, atau barang salah muat`
        : feedback.code

  const Icon = feedback.status === "ok" ? CircleCheck : feedback.status === "unknown" ? X : Info

  return (
    <div key={feedback.key} className={cn("flex h-14 animate-flash items-center gap-3 rounded-lg px-3", tone)}>
      <Icon className="size-5 shrink-0" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate font-mono text-[11px] opacity-80">{detail}</p>
      </div>
    </div>
  )
}
