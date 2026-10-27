import * as React from "react"
import { Link } from "react-router-dom"
import { CalendarX2, ChevronRight, Clock, MapPin, Navigation, Phone, ScanLine, TriangleAlert, Users } from "lucide-react"

import { ActionBar } from "@/components/action-bar"
import { ManifestGrid } from "@/components/manifest-grid"
import { Meta, MetaRow } from "@/components/meta"
import { PhaseTrack } from "@/components/phase-track"
import { EmptyState, SectionLabel } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PHASES } from "@/data/phases"
import type { WeddingEvent } from "@/data/types"
import { dayDiff, formatDate, mapsLink, relativeDay } from "@/lib/format"
import { getPerson } from "@/lib/lookup"
import { getEventProgress, isClosed, type PhaseProgress } from "@/lib/progress"
import { inMinutes, nowAndNext } from "@/lib/rundown"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"

/* Question: what do I have to do right now, and how much is left? */
export function HomePage() {
  const store = useAppStore()
  const { events, userId } = store
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
  const [hero, ...otherActive] = active
  const list = tab === "upcoming" ? upcoming : done

  return (
    <div>
      <TopBar
        large
        back={false}
        title="Today"
        subtitle={new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
      />

      {hero ? (
        <div className="space-y-3 px-4 pt-1">
          <HeroCard event={hero} progress={getEventProgress(hero, store)} />
          <HeroActions event={hero} progress={getEventProgress(hero, store)} />
        </div>
      ) : (
        <EmptyState icon={CalendarX2} title="No live events" />
      )}

      {otherActive.length > 0 && (
        <>
          <SectionLabel>Also live</SectionLabel>
          <div className="list-card">
            {otherActive.map((e) => (
              <ActiveRow key={e.id} event={e} progress={getEventProgress(e, store)} />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <h2 className="text-[15px] font-semibold">Schedule</h2>
        <ToggleGroup type="single" value={tab} onValueChange={(v) => v && setTab(v as typeof tab)}>
          <ToggleGroupItem value="upcoming">
            Upcoming <span className="tabular text-muted-foreground">{upcoming.length}</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="done">
            Done <span className="tabular text-muted-foreground">{done.length}</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={CalendarX2} title={tab === "upcoming" ? "Nothing scheduled" : "Nothing finished yet"} />
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
  const { next, minutesToNext } = nowAndNext(event)
  if (!phase || !progress) return null

  const left = phase.requiresScan ? progress.pending.length : (phase.tasks?.length ?? 0) - progress.tasksDone.length

  return (
    <Link to={`/event/${event.id}`} className="block rounded-xl edge active:bg-secondary/40">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <h2 className="truncate text-[20px] leading-tight font-semibold">{event.couple}</h2>
          <MetaRow className="mt-1">
            <Meta icon={MapPin} label="Venue">{event.venue.name}</Meta>
            <Meta icon={Clock} label="Event starts">{event.startTime}</Meta>
          </MetaRow>
        </div>
        <Badge variant="accent" className="mt-1">Live</Badge>
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-baseline justify-between">
          <p className="flex items-baseline gap-2">
            <span className="text-[40px] leading-none font-semibold tracking-[-0.02em] tabular">{left}</span>
            <span className="text-[15px] text-muted-foreground">{phase.requiresScan ? "to scan" : "tasks left"}</span>
          </p>
          <span className="text-[14px] font-medium">{phase.label}</span>
        </div>
        {phase.requiresScan && <ManifestGrid progress={progress} codes={event.assetCodes} className="mt-3" />}
        <PhaseTrack index={event.phaseIndex} className="mt-4 pb-4" />
      </div>

      {next && (
        <div className="flex items-center gap-2 border-t border-rule px-4 py-3 text-[14px]">
          <Clock className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <span className="tabular font-medium">{next.time}</span>
          <span className="min-w-0 flex-1 truncate">{next.label}</span>
          <span className="shrink-0 text-[13px] text-muted-foreground tabular">{inMinutes(minutesToNext!)}</span>
        </div>
      )}
    </Link>
  )
}

function HeroActions({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const phase = PHASES[event.phaseIndex]
  const lead = getPerson(event.crew.find((c) => c.lead)?.personId ?? "")
  const scanPhase = !!phase?.requiresScan && !progress?.complete
  return (
    <ActionBar
      actions={[
        scanPhase
          ? { icon: ScanLine, label: "Scan", to: `/scan/${event.id}`, primary: true }
          : { icon: ScanLine, label: "Event", to: `/event/${event.id}`, primary: true },
        { icon: TriangleAlert, label: "Report", to: `/new-report?event=${event.id}` },
        ...(lead ? [{ icon: Phone, label: "Lead", href: `tel:${lead.phone}` }] : []),
        { icon: Navigation, label: "Map", href: mapsLink(`${event.venue.name} ${event.venue.address}`) },
      ]}
    />
  )
}

function ActiveRow({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const phase = PHASES[event.phaseIndex]
  return (
    <Link
      to={phase?.requiresScan ? `/scan/${event.id}` : `/event/${event.id}`}
      className="block px-4 py-3 active:bg-secondary"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{event.couple}</p>
          <p className="truncate text-[13px] text-muted-foreground">{phase?.label}</p>
        </div>
        {progress && phase.requiresScan && (
          <span className="text-[15px] font-semibold tabular">
            {progress.pending.length}
            <span className="font-normal text-muted-foreground"> left</span>
          </span>
        )}
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
      {progress && phase.requiresScan && (
        <ManifestGrid progress={progress} codes={event.assetCodes} legend={false} className="mt-2.5 [&>div>span]:h-2.5" />
      )}
    </Link>
  )
}

function EventRow({ event }: { event: WeddingEvent }) {
  const closed = isClosed(event)
  const soon = !closed && dayDiff(event.date) <= 1
  return (
    <Link to={`/event/${event.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-secondary">
      <div
        className={cn(
          "flex w-11 shrink-0 flex-col items-center rounded-md py-1 leading-none",
          soon ? "bg-brand-soft text-brand-ink" : "bg-secondary"
        )}
      >
        <span className={cn("text-[12px] font-medium", soon ? "text-brand-ink" : "text-muted-foreground")}>
          {formatDate(event.date, { month: "short" })}
        </span>
        <span className="mt-0.5 text-[18px] font-semibold tabular">{formatDate(event.date, { day: "numeric" })}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{event.couple}</p>
        <MetaRow className="mt-0.5">
          <span className={cn(soon && "font-medium text-foreground")}>{relativeDay(event.date)}</span>
          {!closed && <Meta icon={Clock} label="Call time">{event.callTime}</Meta>}
          <Meta icon={Users} label="Crew">{event.crew.length}</Meta>
        </MetaRow>
      </div>
      {closed ? <Badge variant="muted">Done</Badge> : <ChevronRight className="size-4 text-muted-foreground" />}
    </Link>
  )
}
