import * as React from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Bell, CalendarX2, ChevronRight, Clock, MapPin, ScanLine, Users } from "lucide-react"

import { PhaseTrack } from "@/components/phase-track"
import { ProgressRing } from "@/components/progress-ring"
import { EmptyState, SectionLabel } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PHASES } from "@/data/phases"
import type { WeddingEvent } from "@/data/types"
import { dayDiff, formatDate, relativeDay } from "@/lib/format"
import { getPerson } from "@/lib/lookup"
import { getEventProgress, isClosed, type PhaseProgress } from "@/lib/progress"
import { inMinutes, nowAndNext } from "@/lib/rundown"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"

export function HomePage() {
  const store = useAppStore()
  const { events, reports, userId } = store
  const [tab, setTab] = React.useState<"upcoming" | "done">("upcoming")

  const mine = events
    .filter((e) => e.crew.some((c) => c.personId === userId))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Live = not closed, and either today/past or already started (H-1 load-out).
  const active = mine
    .filter((e) => !isClosed(e) && (dayDiff(e.date) <= 0 || e.phaseIndex > 0))
    .sort((a, b) => Math.abs(dayDiff(a.date)) - Math.abs(dayDiff(b.date)))
  const upcoming = mine.filter((e) => !isClosed(e) && !active.includes(e))
  const done = mine.filter(isClosed).reverse()
  const openReports = reports.filter((r) => r.status !== "Selesai" && mine.some((e) => e.id === r.eventId))
  const [hero, ...otherActive] = active

  const me = getPerson(userId)!
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })
  const list = tab === "upcoming" ? upcoming : done

  return (
    <div>
      <TopBar
        large
        back={false}
        subtitle={today}
        title={`Halo, ${me.name.split(" ")[0]}`}
        right={
          <Link
            to="/laporan"
            aria-label={`${openReports.length} laporan aktif`}
            className="relative flex size-10 items-center justify-center rounded-full bg-card shadow-soft"
          >
            <Bell className="size-[18px]" />
            {openReports.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-background">
                {openReports.length}
              </span>
            )}
          </Link>
        }
      />

      {hero ? (
        <div className="px-4 pt-1">
          <HeroCard event={hero} progress={getEventProgress(hero, store)} />
        </div>
      ) : (
        <EmptyState icon={CalendarX2} title="Tidak ada event berjalan" body="Event hari ini akan muncul di sini." />
      )}

      {otherActive.length > 0 && (
        <>
          <SectionLabel>Juga berjalan</SectionLabel>
          <div className="flex flex-col gap-3 px-4">
            {otherActive.map((e) => (
              <ActiveCard key={e.id} event={e} progress={getEventProgress(e, store)} />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between px-4 pt-7 pb-3">
        <h2 className="text-lg font-bold tracking-tight">Jadwal</h2>
        <ToggleGroup type="single" value={tab} onValueChange={(v) => v && setTab(v as typeof tab)}>
          <ToggleGroupItem value="upcoming">Mendatang</ToggleGroupItem>
          <ToggleGroupItem value="done">Selesai</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title={tab === "upcoming" ? "Belum ada jadwal" : "Belum ada event selesai"}
          body={tab === "upcoming" ? "Jadwal baru muncul setelah koordinator menugaskanmu." : undefined}
        />
      ) : (
        <ul className="list-card">
          {list.map((e) => (
            <li key={e.id}>
              <EventRow event={e} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function HeroCard({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const phase = PHASES[event.phaseIndex]
  const cleared = progress ? progress.scanned + progress.reported : 0
  const pct = progress
    ? phase.requiresScan
      ? (cleared / progress.total) * 100
      : (progress.tasksDone.length / (phase.tasks?.length || 1)) * 100
    : 0
  const { next, minutesToNext } = nowAndNext(event)

  return (
    <article className="overflow-hidden rounded-3xl bg-ink text-white shadow-[0_20px_40px_-20px_oklch(0.2_0.01_265/0.7)]">
      <Link to={`/event/${event.id}`} className="block p-5 active:opacity-90">
        <div className="flex items-center gap-2 text-[12px] font-medium text-white/60">
          <span className="flex items-center gap-1.5 rounded-full bg-[oklch(0.82_0.14_158)]/15 px-2 py-0.5 font-semibold text-[oklch(0.85_0.13_158)]">
            <span className="size-1.5 animate-pulse rounded-full bg-[oklch(0.85_0.13_158)]" />
            Live
          </span>
          {relativeDay(event.date)} · {event.kind}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[26px] leading-tight font-bold tracking-tight">{event.couple}</h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-white/60">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{event.venue.name}, {event.venue.area}</span>
            </p>
          </div>
          {phase && (
            <ProgressRing
              value={pct}
              size={60}
              stroke={6}
              trackClassName="stroke-white/12"
              barClassName="stroke-[oklch(0.82_0.14_158)]"
            >
              <span className="text-[13px] font-bold tabular">{Math.round(pct)}%</span>
            </ProgressRing>
          )}
        </div>
        <PhaseTrack index={event.phaseIndex} tone="dark" className="mt-5" />
      </Link>

      {phase && progress && (
        <div className="mx-2 mb-2 flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3 pl-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/50">Fase {event.phaseIndex + 1}/{PHASES.length}</p>
            <p className="truncate text-sm font-semibold">{phase.label}</p>
            <p className="truncate text-[12px] text-white/60 tabular">
              {phase.requiresScan
                ? `${cleared} dari ${progress.total} barang`
                : `${progress.tasksDone.length} dari ${phase.tasks?.length ?? 0} checklist`}
            </p>
          </div>
          <Button asChild variant={phase.requiresScan ? "brand" : "secondary"} className="shrink-0 rounded-xl">
            <Link to={phase.requiresScan ? `/scan/${event.id}` : `/event/${event.id}`}>
              {phase.requiresScan ? <ScanLine /> : null}
              {phase.requiresScan ? "Scan" : "Checklist"}
              {!phase.requiresScan && <ArrowRight />}
            </Link>
          </Button>
        </div>
      )}

      {next && (
        <div className="flex items-center gap-2 border-t border-white/8 px-5 py-3 text-[12.5px]">
          <Clock className="size-3.5 text-white/50" />
          <span className="text-white/50">Berikutnya</span>
          <span className="min-w-0 flex-1 truncate font-medium">
            {next.time} · {next.label}
          </span>
          <span className="shrink-0 text-white/50">{inMinutes(minutesToNext!)}</span>
        </div>
      )}
    </article>
  )
}

function ActiveCard({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const phase = PHASES[event.phaseIndex]
  const cleared = progress ? progress.scanned + progress.reported : 0
  const pct = progress && phase.requiresScan ? (cleared / progress.total) * 100 : 0
  return (
    <Link
      to={phase?.requiresScan ? `/scan/${event.id}` : `/event/${event.id}`}
      className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft active:scale-[0.99]"
    >
      <ProgressRing value={pct} size={48} stroke={5}>
        <ScanLine className="size-4 text-muted-foreground" />
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{event.couple}</p>
        <p className="truncate text-[13px] text-muted-foreground">
          {relativeDay(event.date)} · {phase?.label}
        </p>
      </div>
      {progress && phase.requiresScan && (
        <span className="text-sm font-semibold tabular">
          {cleared}
          <span className="text-muted-foreground">/{progress.total}</span>
        </span>
      )}
      <ChevronRight className="size-4 text-muted-foreground/50" />
    </Link>
  )
}

function EventRow({ event }: { event: WeddingEvent }) {
  const closed = isClosed(event)
  const soon = !closed && dayDiff(event.date) <= 1
  return (
    <Link to={`/event/${event.id}`} className="flex items-center gap-3.5 px-4 py-3.5 active:bg-muted">
      <div
        className={cn(
          "flex w-12 shrink-0 flex-col items-center rounded-xl py-1.5 leading-none",
          soon ? "bg-ink text-white" : "bg-secondary"
        )}
      >
        <span className={cn("text-[10px] font-semibold uppercase", soon ? "text-white/60" : "text-muted-foreground")}>
          {formatDate(event.date, { month: "short" })}
        </span>
        <span className="mt-1 text-lg font-bold tabular">{formatDate(event.date, { day: "numeric" })}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{event.couple}</p>
        <p className="truncate text-[13px] text-muted-foreground">
          {event.kind} · {event.venue.name}
        </p>
        <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className={cn(soon && "font-semibold text-foreground")}>{relativeDay(event.date)}</span>
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {event.crew.length}
          </span>
          {!closed && (
            <span className="flex items-center gap-1 tabular">
              <Clock className="size-3" />
              {event.callTime}
            </span>
          )}
        </p>
      </div>
      {closed ? <Badge variant="muted">Selesai</Badge> : <ChevronRight className="size-4 text-muted-foreground/50" />}
    </Link>
  )
}
