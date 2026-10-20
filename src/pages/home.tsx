import * as React from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CalendarX2, Clock, MapPin, ScanLine, Users } from "lucide-react"

import { PhaseTrack } from "@/components/phase-track"
import { EmptyState, SectionLabel } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PHASES } from "@/data/phases"
import type { WeddingEvent } from "@/data/types"
import { dayDiff, formatDate, relativeDay } from "@/lib/format"
import { getPerson } from "@/lib/lookup"
import { getEventProgress, isClosed } from "@/lib/progress"
import { useAppStore } from "@/store/app-store"

export function HomePage() {
  const { events, scans, reports, userId } = useAppStore()
  const [tab, setTab] = React.useState<"upcoming" | "done">("upcoming")

  const mine = events
    .filter((e) => e.crew.some((c) => c.personId === userId))
    .sort((a, b) => a.date.localeCompare(b.date))

  // "Sedang berjalan": anything not closed that is today or already started.
  const active = mine.filter((e) => !isClosed(e) && (dayDiff(e.date) <= 0 || e.phaseIndex > 0))
  const upcoming = mine.filter((e) => !isClosed(e) && !active.includes(e))
  const done = mine.filter(isClosed).reverse()
  const openReports = reports.filter((r) => r.status !== "Selesai" && mine.some((e) => e.id === r.eventId))

  const me = getPerson(userId)!
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div>
      <header className="px-4 pt-6 pb-2">
        <p className="text-[13px] text-muted-foreground">{today}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
          Halo, {me.name.split(" ")[0]}
        </h1>
        <div className="mt-4 grid grid-cols-3 divide-x rounded-xl border bg-card text-center">
          <Stat value={active.length} label="Berjalan" />
          <Stat value={upcoming.length} label="Mendatang" />
          <Link to="/laporan" className="py-3 active:bg-muted">
            <div className="text-lg font-semibold tabular">{openReports.length}</div>
            <div className="text-[11px] text-muted-foreground">Laporan aktif</div>
          </Link>
        </div>
      </header>

      {active.length > 0 && (
        <>
          <SectionLabel>Sedang berjalan</SectionLabel>
          <div className="flex flex-col gap-3 px-4">
            {active.map((e) => (
              <ActiveEventCard key={e.id} event={e} progress={getEventProgress(e, scans, reports)} />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between px-4 pt-7 pb-3">
        <ToggleGroup
          type="single"
          value={tab}
          onValueChange={(v) => v && setTab(v as typeof tab)}
        >
          <ToggleGroupItem value="upcoming">Mendatang · {upcoming.length}</ToggleGroupItem>
          <ToggleGroupItem value="done">Selesai · {done.length}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {(tab === "upcoming" ? upcoming : done).length === 0 ? (
        <EmptyState icon={CalendarX2} title="Belum ada event" body="Jadwal baru muncul di sini setelah koordinator menugaskanmu." />
      ) : (
        <ul className="divide-y border-y bg-card">
          {(tab === "upcoming" ? upcoming : done).map((e) => (
            <li key={e.id}>
              <EventRow event={e} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="py-3">
      <div className="text-lg font-semibold tabular">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}

function ActiveEventCard({
  event,
  progress,
}: {
  event: WeddingEvent
  progress: ReturnType<typeof getEventProgress>
}) {
  const phase = PHASES[event.phaseIndex]
  const cleared = progress ? progress.scanned + progress.reported : 0
  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <Link to={`/event/${event.id}`} className="block p-4 active:bg-muted/50">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {relativeDay(event.date)} · {event.kind}
          </span>
          <Badge variant="success">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            Live
          </Badge>
        </div>
        <h3 className="mt-1.5 font-serif text-[26px] leading-tight font-medium tracking-tight">
          {event.couple}
        </h3>
        <div className="mt-2 flex flex-col gap-1 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {event.venue.name}, {event.venue.area}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Call time {event.callTime} · Acara {event.startTime}
          </span>
        </div>
        <PhaseTrack index={event.phaseIndex} className="mt-4" />
      </Link>

      {phase && progress && (
        <div className="flex items-center gap-3 border-t bg-muted/40 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="font-medium">{phase.label}</span>
              {phase.requiresScan && (
                <span className="tabular text-muted-foreground">
                  {cleared}/{progress.total}
                </span>
              )}
            </div>
            {phase.requiresScan ? (
              <Progress value={(cleared / progress.total) * 100} className="mt-1.5" />
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">Tidak perlu scan</p>
            )}
          </div>
          {phase.requiresScan ? (
            <Button asChild size="sm">
              <Link to={`/scan/${event.id}`}>
                <ScanLine />
                Scan
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link to={`/event/${event.id}`}>
                Buka
                <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      )}
    </article>
  )
}

function EventRow({ event }: { event: WeddingEvent }) {
  const closed = isClosed(event)
  return (
    <Link to={`/event/${event.id}`} className="flex items-center gap-4 px-4 py-3.5 active:bg-muted">
      <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border py-1.5 leading-none">
        <span className="text-[10px] font-semibold tracking-wide text-clay uppercase">
          {formatDate(event.date, { month: "short" })}
        </span>
        <span className="mt-1 text-lg font-semibold tabular">
          {formatDate(event.date, { day: "numeric" })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[17px] font-medium">{event.couple}</p>
        <p className="truncate text-[13px] text-muted-foreground">
          {event.kind} · {event.venue.name}
        </p>
        <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{relativeDay(event.date)}</span>
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {event.crew.length} orang
          </span>
        </p>
      </div>
      {closed ? (
        <Badge variant="muted">Selesai</Badge>
      ) : (
        <Badge variant="outline">{event.callTime}</Badge>
      )}
    </Link>
  )
}
