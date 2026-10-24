import * as React from "react"
import { Link } from "react-router-dom"
import { CalendarX2, ChevronRight, Clock, MapPin, ScanLine, Users } from "lucide-react"

import { ManifestGrid } from "@/components/manifest-grid"
import { PhaseTrack } from "@/components/phase-track"
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

  const me = getPerson(userId)!
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
  const list = tab === "upcoming" ? upcoming : done

  return (
    <div>
      <TopBar
        large
        back={false}
        title="Today"
        subtitle={`${today} · ${me.name}`}
      />

      {hero ? (
        <div className="px-4 pt-1">
          <HeroCard event={hero} progress={getEventProgress(hero, store)} />
        </div>
      ) : (
        <EmptyState icon={CalendarX2} title="No live events" body="Today's events will show up here." />
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

      <div className="flex items-center justify-between px-4 pt-7 pb-3">
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
        <EmptyState
          icon={CalendarX2}
          title={tab === "upcoming" ? "Nothing scheduled" : "No finished events yet"}
          body={tab === "upcoming" ? "New events appear once a coordinator assigns you." : undefined}
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
  const { next, minutesToNext } = nowAndNext(event)
  if (!phase || !progress) return null

  const left = phase.requiresScan ? progress.pending.length : (phase.tasks?.length ?? 0) - progress.tasksDone.length
  const noun = phase.requiresScan ? (left === 1 ? "item to scan" : "items to scan") : left === 1 ? "task left" : "tasks left"

  return (
    <article className="rounded-xl edge">
      <Link to={`/event/${event.id}`} className="block px-4 pt-4 active:bg-secondary/50">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Badge variant="accent">Live</Badge>
          {relativeDay(event.date)} · {event.kind}
        </div>
        <h2 className="mt-2 text-[20px] leading-tight font-semibold">{event.couple}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-[14px] text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {event.venue.name}, {event.venue.area}
          </span>
        </p>
      </Link>

      <div className="mt-4 border-t border-rule px-4 pt-4">
        <p className="text-[13px] text-muted-foreground">
          {phase.label} · phase {event.phaseIndex + 1} of {PHASES.length}
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="flex items-baseline gap-2">
            <span className="text-[36px] leading-none font-semibold tracking-[-0.02em] tabular">{left}</span>
            <span className="text-[15px] text-muted-foreground">{noun}</span>
          </p>
          <Button asChild size="default" className="shrink-0">
            <Link to={phase.requiresScan ? `/scan/${event.id}` : `/event/${event.id}`}>
              {phase.requiresScan && <ScanLine />}
              {phase.requiresScan ? "Scan" : "Open checklist"}
            </Link>
          </Button>
        </div>
        {phase.requiresScan ? (
          <ManifestGrid progress={progress} codes={event.assetCodes} className="mt-4" />
        ) : (
          <p className="mt-2 text-[14px] text-muted-foreground tabular">
            {progress.tasksDone.length} of {phase.tasks?.length ?? 0} done
          </p>
        )}
        <PhaseTrack index={event.phaseIndex} className="mt-4 pb-4" />
      </div>

      {next && (
        <div className="flex items-center gap-2 border-t border-rule px-4 py-3 text-[14px]">
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">
            <span className="text-muted-foreground">Next </span>
            <span className="tabular">{next.time}</span> {next.label}
          </span>
          <span className="shrink-0 text-[13px] text-muted-foreground tabular">{inMinutes(minutesToNext!)}</span>
        </div>
      )}
    </article>
  )
}

function ActiveRow({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const phase = PHASES[event.phaseIndex]
  return (
    <Link
      to={phase?.requiresScan ? `/scan/${event.id}` : `/event/${event.id}`}
      className="block px-4 py-3.5 active:bg-secondary"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{event.couple}</p>
          <p className="truncate text-[13px] text-muted-foreground">
            {relativeDay(event.date)} · {phase?.label}
          </p>
        </div>
        {progress && phase.requiresScan && (
          <span className="text-[15px] font-semibold tabular">
            {progress.pending.length}
            <span className="font-normal text-muted-foreground"> to scan</span>
          </span>
        )}
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
      {progress && phase.requiresScan && (
        <ManifestGrid progress={progress} codes={event.assetCodes} legend={false} className="mt-3 [&>div>span]:h-3" />
      )}
    </Link>
  )
}

function EventRow({ event }: { event: WeddingEvent }) {
  const closed = isClosed(event)
  const soon = !closed && dayDiff(event.date) <= 1
  return (
    <Link to={`/event/${event.id}`} className="flex items-center gap-3.5 px-4 py-3.5 active:bg-secondary">
      <div
        className={cn(
          "flex w-12 shrink-0 flex-col items-center rounded-md py-1.5 leading-none",
          soon ? "bg-brand-soft text-brand-ink" : "bg-secondary"
        )}
      >
        <span className={cn("text-[12px] font-medium", soon ? "text-brand-ink" : "text-muted-foreground")}>
          {formatDate(event.date, { month: "short" })}
        </span>
        <span className="mt-1 text-lg font-semibold tabular">{formatDate(event.date, { day: "numeric" })}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{event.couple}</p>
        <p className="truncate text-[13px] text-muted-foreground">
          {event.kind} · {event.venue.name}
        </p>
        <p className="mt-1 flex items-center gap-3 text-[13px] text-muted-foreground">
          <span className={cn(soon && "font-medium text-foreground")}>{relativeDay(event.date)}</span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {event.crew.length}
          </span>
          {!closed && (
            <span className="flex items-center gap-1 tabular">
              <Clock className="size-3.5" />
              Call {event.callTime}
            </span>
          )}
        </p>
      </div>
      {closed ? <Badge variant="muted">Done</Badge> : <ChevronRight className="size-4 text-muted-foreground" />}
    </Link>
  )
}
