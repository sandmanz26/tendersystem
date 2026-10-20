import * as React from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import {
  CircleCheck,
  CircleDashed,
  ClipboardList,
  Crown,
  Navigation,
  PackageSearch,
  Phone,
  Plus,
  ScanLine,
  Search,
  Truck,
  TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"

import { CategoryIcon } from "@/components/category-icon"
import { PersonRow } from "@/components/person-row"
import { PhaseTrack } from "@/components/phase-track"
import { ReportRow } from "@/components/report-row"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PHASES } from "@/data/phases"
import type { WeddingEvent } from "@/data/types"
import { clock, longDate, mapsLink } from "@/lib/format"
import { getAsset, getPerson, personName } from "@/lib/lookup"
import { getEventProgress, isClosed, type PhaseProgress } from "@/lib/progress"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import { NotFound } from "./not-found"

const TABS = ["info", "barang", "tim", "laporan"] as const
type Tab = (typeof TABS)[number]

export function EventDetailPage() {
  const { id } = useParams()
  const { events, scans, reports } = useAppStore()
  const [params, setParams] = useSearchParams()
  const event = events.find((e) => e.id === id)
  if (!event) return <NotFound />

  const tab = (TABS as readonly string[]).includes(params.get("tab") ?? "")
    ? (params.get("tab") as Tab)
    : "info"
  const progress = getEventProgress(event, scans, reports)
  const eventReports = reports.filter((r) => r.eventId === event.id)

  return (
    <div>
      <TopBar back="/" title={event.couple} subtitle={`${event.kind} · ${event.venue.name}`} />

      <section className="px-4 pt-5 pb-5">
        <p className="text-xs font-medium tracking-wide text-clay uppercase">
          {event.kind} · {event.guests} tamu
        </p>
        <h1 className="mt-1 font-serif text-[32px] leading-[1.1] font-medium tracking-tight">
          {event.couple}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{event.theme}</p>

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border text-sm">
          <Fact label="Tanggal" value={longDate(event.date).replace(/^\w+, /, "")} />
          <Fact label="Call time" value={event.callTime} mono />
          <Fact label="Acara" value={`${event.startTime}–${event.endTime}`} mono />
          <Fact label="Venue" value={event.venue.area} />
        </div>
      </section>

      <PhasePanel event={event} progress={progress} />

      <Tabs
        value={tab}
        onValueChange={(v) => setParams({ tab: v }, { replace: true })}
        className="mt-2 gap-0"
      >
        <TabsList className="sticky top-14 z-20 bg-background">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="barang">
            Barang <Count n={event.assetCodes.length} />
          </TabsTrigger>
          <TabsTrigger value="tim">
            Tim <Count n={event.crew.length} />
          </TabsTrigger>
          <TabsTrigger value="laporan">
            Laporan <Count n={eventReports.length} />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <InfoTab event={event} />
        </TabsContent>
        <TabsContent value="barang">
          <ItemsTab event={event} progress={progress} />
        </TabsContent>
        <TabsContent value="tim">
          <TeamTab event={event} />
        </TabsContent>
        <TabsContent value="laporan">
          <div className="flex gap-2 px-4 pt-4 pb-3">
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/lapor?event=${event.id}&type=issue`}>
                <TriangleAlert />
                Lapor masalah
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/lapor?event=${event.id}&type=damage`}>
                <Plus />
                Barang rusak
              </Link>
            </Button>
          </div>
          {eventReports.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Belum ada laporan" body="Semua aman sejauh ini." />
          ) : (
            <div className="divide-y border-y bg-card">
              {eventReports.map((r) => (
                <ReportRow key={r.id} report={r} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Count({ n }: { n: number }) {
  return <span className="text-xs font-normal text-muted-foreground tabular">{n}</span>
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-card px-3 py-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 truncate font-medium", mono && "tabular")}>{value}</div>
    </div>
  )
}

function PhasePanel({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const { advancePhase, phaseLog } = useAppStore()
  const [confirm, setConfirm] = React.useState(false)

  if (!progress || isClosed(event)) {
    const last = phaseLog[event.id]?.at(-1)
    return (
      <div className="mx-4 rounded-xl border bg-card p-4">
        <PhaseTrack index={PHASES.length} />
        <div className="mt-3 flex items-center gap-2 text-sm">
          <CircleCheck className="size-4 text-success" />
          <span className="font-medium">Event selesai, semua barang kembali.</span>
        </div>
        {last && (
          <p className="mt-1 text-xs text-muted-foreground">
            Ditutup {clock(last.at)} oleh {personName(last.by)}
          </p>
        )}
      </div>
    )
  }

  const { phase } = progress
  const cleared = progress.scanned + progress.reported
  const next = PHASES[event.phaseIndex + 1]

  return (
    <div className="mx-4 rounded-xl border bg-card">
      <div className="p-4">
        <PhaseTrack index={event.phaseIndex} />
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">
              Fase {event.phaseIndex + 1} dari {PHASES.length}
            </p>
            <p className="text-base font-semibold">{phase.label}</p>
          </div>
          {phase.requiresScan ? (
            <Badge variant={progress.complete ? "success" : "outline"}>
              <ScanLine />
              Wajib scan
            </Badge>
          ) : (
            <Badge variant="muted">Tanpa scan</Badge>
          )}
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">{phase.hint}</p>

        {phase.requiresScan && (
          <div className="mt-3">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="tabular">
                <span className="font-semibold">{cleared}</span>
                <span className="text-muted-foreground"> / {progress.total} barang</span>
              </span>
              {progress.reported > 0 && (
                <span className="text-xs text-clay">{progress.reported} dilaporkan</span>
              )}
            </div>
            <Progress
              value={(cleared / progress.total) * 100}
              className="mt-1.5 h-2"
              indicatorClassName={progress.complete ? "bg-success" : undefined}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t p-3">
        {phase.requiresScan && (
          <Button asChild className="flex-1" variant={progress.complete ? "outline" : "default"}>
            <Link to={`/scan/${event.id}`}>
              <ScanLine />
              {progress.complete ? "Lihat scan" : "Mulai scan"}
            </Link>
          </Button>
        )}
        <Button
          className="flex-1"
          variant={progress.complete ? "default" : "outline"}
          disabled={!progress.complete}
          onClick={() => setConfirm(true)}
        >
          {next ? "Lanjut fase" : "Tutup event"}
        </Button>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan “{phase.label}”?</DialogTitle>
            <DialogDescription>
              {next
                ? `Event akan pindah ke fase ${next.label}. Fase yang sudah selesai tidak bisa dibuka lagi dari aplikasi.`
                : "Semua barang sudah kembali. Event akan ditutup."}
            </DialogDescription>
          </DialogHeader>
          {phase.requiresScan && (
            <div className="rounded-lg bg-muted px-3 py-2.5 text-[13px] tabular">
              {progress.scanned} discan · {progress.reported} dilaporkan rusak/hilang
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Batal</Button>
            </DialogClose>
            <Button
              onClick={() => {
                advancePhase(event.id)
                setConfirm(false)
                toast.success(next ? `Masuk fase ${next.label}` : "Event ditutup")
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

function InfoTab({ event }: { event: WeddingEvent }) {
  const lead = event.crew.find((c) => c.lead)
  const leadPerson = lead && getPerson(lead.personId)
  return (
    <div className="pb-6">
      <SectionLabel>Lokasi</SectionLabel>
      <div className="border-y bg-card px-4 py-3.5">
        <p className="font-medium">{event.venue.name}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{event.venue.address}</p>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/70 px-3 py-2.5 text-[13px]">
          <Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>{event.venue.loadingNote}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={mapsLink(`${event.venue.name} ${event.venue.address}`)} target="_blank" rel="noreferrer">
              <Navigation />
              Buka Maps
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${event.venue.pic.phone}`}>
              <Phone />
              PIC venue
            </a>
          </Button>
        </div>
      </div>

      <SectionLabel>Rundown</SectionLabel>
      <ol className="border-y bg-card px-4 py-2">
        {event.rundown.map((r, i) => (
          <li key={i} className="relative flex gap-4 py-2">
            <span className="w-11 shrink-0 pt-px text-[13px] font-medium tabular">{r.time}</span>
            <span className="relative flex flex-col items-center">
              <span className="mt-1.5 size-2 rounded-full border-2 border-primary bg-card" />
              {i < event.rundown.length - 1 && (
                <span className="absolute top-4 -bottom-4 w-px bg-border" />
              )}
            </span>
            <span className="flex-1 text-sm">
              {r.label}
              {r.crewNote && <span className="mt-0.5 block text-xs text-clay">{r.crewNote}</span>}
            </span>
          </li>
        ))}
      </ol>

      {event.notes.length > 0 && (
        <>
          <SectionLabel>Catatan untuk crew</SectionLabel>
          <ul className="flex flex-col gap-2 border-y bg-card px-4 py-3.5 text-sm">
            {event.notes.map((n, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/50" />
                {n}
              </li>
            ))}
          </ul>
        </>
      )}

      <SectionLabel>Kontak penting</SectionLabel>
      <div className="divide-y border-y bg-card">
        {leadPerson && <PersonRow person={leadPerson} detail="Koordinator lapangan" />}
        <PersonRow
          person={{ id: "c0", name: event.client.name, role: event.client.relation, phone: event.client.phone }}
          detail={`Klien · ${event.client.relation}`}
        />
        <PersonRow
          person={{ id: "c1", name: event.venue.pic.name, role: "PIC venue", phone: event.venue.pic.phone }}
          detail="PIC venue"
        />
      </div>
    </div>
  )
}

function ItemsTab({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const [q, setQ] = React.useState("")
  const phase = progress?.phase
  const items = event.assetCodes
    .map((code) => getAsset(code)!)
    .filter((a) => {
      const s = q.trim().toLowerCase()
      return !s || a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s)
    })

  const groups = Object.entries(
    items.reduce<Record<string, typeof items>>((acc, a) => {
      ;(acc[a.category] ??= []).push(a)
      return acc
    }, {})
  )

  return (
    <div className="pb-6">
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau kode barang"
            className="pl-9"
          />
        </div>
        {phase?.requiresScan && (
          <p className="mt-2 text-xs text-muted-foreground">
            Status scan untuk fase <span className="font-medium text-foreground">{phase.label}</span>
          </p>
        )}
      </div>

      {groups.length === 0 && <EmptyState icon={PackageSearch} title="Barang tidak ditemukan" />}

      {groups.map(([category, assets]) => (
        <div key={category}>
          <SectionLabel>
            {category} · {assets.length}
          </SectionLabel>
          <ul className="divide-y border-y bg-card">
            {assets.map((a) => {
              const st = progress?.byAsset[a.code]
              return (
                <li key={a.code}>
                  <Link
                    to={`/event/${event.id}/barang/${a.code}`}
                    className="flex items-center gap-3 px-4 py-3 active:bg-muted"
                  >
                    <CategoryIcon category={a.category} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono text-[11px] text-foreground/70">{a.code}</span> · {a.unit}
                      </p>
                    </div>
                    {phase?.requiresScan && st && <ScanState state={st} />}
                    {!phase?.requiresScan && a.condition !== "Baik" && (
                      <Badge variant="warning">{a.condition}</Badge>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

function ScanState({ state }: { state: PhaseProgress["byAsset"][string] }) {
  if (state.state === "scanned")
    return (
      <span className="flex flex-col items-end text-[11px] text-success">
        <CircleCheck className="size-[18px]" />
        <span className="mt-0.5 tabular">{clock(state.record.at)}</span>
      </span>
    )
  if (state.state === "reported")
    return (
      <Badge variant="warning">
        <TriangleAlert />
        Dilaporkan
      </Badge>
    )
  return <CircleDashed className="size-[18px] text-muted-foreground/60" />
}

function TeamTab({ event }: { event: WeddingEvent }) {
  const { userId } = useAppStore()
  const internal = event.crew.filter((c) => getPerson(c.personId) && !getPerson(c.personId)!.company)
  const vendors = event.crew.filter((c) => getPerson(c.personId)?.company)

  return (
    <div className="pb-6">
      <SectionLabel>Crew internal · {internal.length}</SectionLabel>
      <div className="divide-y border-y bg-card">
        {internal.map((c) => (
          <PersonRow
            key={c.personId}
            person={getPerson(c.personId)!}
            detail={c.duty}
            isYou={c.personId === userId}
            badge={
              c.lead ? (
                <Badge variant="outline" className="gap-0.5">
                  <Crown />
                  Lead
                </Badge>
              ) : undefined
            }
          />
        ))}
      </div>
      {vendors.length > 0 && (
        <>
          <SectionLabel>Vendor · {vendors.length}</SectionLabel>
          <div className="divide-y border-y bg-card">
            {vendors.map((c) => (
              <PersonRow key={c.personId} person={getPerson(c.personId)!} detail={c.duty} />
            ))}
          </div>
        </>
      )}
      <p className="px-4 pt-4 text-xs text-muted-foreground">
        Call time semua crew <span className="font-medium text-foreground tabular">{event.callTime}</span> di gudang.
      </p>
    </div>
  )
}
