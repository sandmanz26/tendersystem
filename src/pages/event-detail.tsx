import * as React from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import {
  Check,
  CircleCheck,
  CircleDashed,
  ClipboardList,
  Clock,
  CloudOff,
  Crown,
  EyeOff,
  Navigation,
  PackageSearch,
  PackageX,
  PenLine,
  Phone,
  ScanLine,
  Search,
  TriangleAlert,
  Truck,
} from "lucide-react"

import { CategoryIcon } from "@/components/category-icon"
import { PersonRow } from "@/components/person-row"
import { PhaseCompleteSheet } from "@/components/phase-complete"
import { PhaseTrack } from "@/components/phase-track"
import { ProgressRing } from "@/components/progress-ring"
import { ReportRow } from "@/components/report-row"
import { Callout, EmptyState, SectionLabel } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PHASES } from "@/data/phases"
import type { WeddingEvent } from "@/data/types"
import { clock, formatDate, mapsLink, stamp } from "@/lib/format"
import { getAsset, getPerson, personName } from "@/lib/lookup"
import { getEventProgress, isClosed, type PhaseProgress } from "@/lib/progress"
import { inMinutes, nowAndNext } from "@/lib/rundown"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import { NotFound } from "./not-found"

const TABS = ["info", "items", "team", "reports"] as const
type Tab = (typeof TABS)[number]

export function EventDetailPage() {
  const { id } = useParams()
  const store = useAppStore()
  const { events, reports, userId } = store
  const [params, setParams] = useSearchParams()
  const event = events.find((e) => e.id === id)
  if (!event) return <NotFound />

  const tab = (TABS as readonly string[]).includes(params.get("tab") ?? "")
    ? (params.get("tab") as Tab)
    : "info"
  const progress = getEventProgress(event, store)
  const eventReports = reports.filter((r) => r.eventId === event.id)
  const assigned = event.crew.some((c) => c.personId === userId)

  return (
    <div>
      <TopBar back="/" title={event.couple} subtitle={`${event.kind} · ${event.venue.name}`} />

      <section className="px-5 pt-3 pb-5">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{event.kind}</Badge>
          <Badge variant="secondary">{event.guests} guests</Badge>
          <Badge variant="secondary">{event.theme}</Badge>
        </div>
        <h1 className="mt-3 text-[32px] leading-[1.05] font-bold tracking-tight">{event.couple}</h1>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Fact label="Date" value={formatDate(event.date, { weekday: "short", day: "numeric", month: "short" })} />
          <Fact label="Call time" value={event.callTime} />
          <Fact label="Event" value={`${event.startTime}–${event.endTime}`} />
        </div>
      </section>

      {!assigned && (
        <Callout icon={EyeOff} tone="info" className="mx-4 mb-4">
          You're not assigned to this event. You can view it, but you can't scan or
          close phases.
        </Callout>
      )}

      <NowNext event={event} />
      <PhasePanel event={event} progress={progress} canAct={assigned} />

      <Tabs
        value={tab}
        onValueChange={(v) => setParams({ tab: v }, { replace: true })}
        className="mt-5 gap-0"
      >
        <div className="sticky top-14 z-20 bg-background/85 px-4 py-2 backdrop-blur-xl">
          <TabsList>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="items">
              Items <Count n={event.assetCodes.length} />
            </TabsTrigger>
            <TabsTrigger value="team">
              Team <Count n={event.crew.length} />
            </TabsTrigger>
            <TabsTrigger value="reports">
              Reports <Count n={eventReports.length} />
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="info">
          <InfoTab event={event} />
        </TabsContent>
        <TabsContent value="items">
          <ItemsTab event={event} progress={progress} />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab event={event} />
        </TabsContent>
        <TabsContent value="reports">
          <div className="grid grid-cols-2 gap-2 px-4 pt-2 pb-1">
            <Button asChild variant="outline">
              <Link to={`/new-report?event=${event.id}&type=issue`}>
                <TriangleAlert />
                Report issue
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/new-report?event=${event.id}&type=damage`}>
                <PackageX className="text-clay" />
                Damaged item
              </Link>
            </Button>
          </div>
          {eventReports.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No reports yet" body="All good so far." />
          ) : (
            <div className="list-card mt-3">
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
  return <span className="text-[11px] font-medium text-muted-foreground tabular">{n}</span>
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card px-3 py-2.5 shadow-soft">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-[14px] font-semibold tabular">{value}</div>
    </div>
  )
}

function NowNext({ event }: { event: WeddingEvent }) {
  // Re-render every minute so "in x min" stays honest.
  const [, tick] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    const t = window.setInterval(tick, 60_000)
    return () => window.clearInterval(t)
  }, [])
  const { now, next, minutesToNext } = nowAndNext(event)
  if (!now && !next) return null
  return (
    <div className="mx-4 mb-3 grid grid-cols-2 gap-2">
      <div className="rounded-2xl bg-card p-3 shadow-soft">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-brand">
          <span className="size-1.5 animate-pulse rounded-full bg-brand" />
          Now
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] font-semibold">{now ? now.label : "Not started"}</p>
        {now && <p className="text-[11px] text-muted-foreground tabular">since {now.time}</p>}
      </div>
      <div className="rounded-2xl bg-card p-3 shadow-soft">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <Clock className="size-3" />
          Next
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] font-semibold">{next ? next.label : "Done"}</p>
        {next && (
          <p className="text-[11px] text-muted-foreground tabular">
            {next.time} · {inMinutes(minutesToNext!)}
          </p>
        )}
      </div>
    </div>
  )
}

function PhasePanel({
  event,
  progress,
  canAct,
}: {
  event: WeddingEvent
  progress: PhaseProgress | null
  canAct: boolean
}) {
  const { phaseLog, toggleTask } = useAppStore()
  const [sheet, setSheet] = React.useState(false)

  if (!progress || isClosed(event)) {
    const last = phaseLog[event.id]?.at(-1)
    return (
      <div className="mx-4 rounded-3xl bg-card p-5 shadow-soft">
        <PhaseTrack index={PHASES.length} />
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <CircleCheck className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Event complete</p>
            {last && (
              <p className="text-xs text-muted-foreground">
                Closed {stamp(last.at)} · {personName(last.by)}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const { phase } = progress
  const cleared = progress.scanned + progress.reported
  const total = phase.requiresScan ? progress.total : phase.tasks?.length ?? 0
  const done = phase.requiresScan ? cleared : progress.tasksDone.length
  const pct = total ? (done / total) * 100 : 100
  const next = PHASES[event.phaseIndex + 1]

  return (
    <div className="mx-4 rounded-3xl bg-card shadow-soft">
      <div className="p-5">
        <PhaseTrack index={event.phaseIndex} />
        <div className="mt-5 flex items-center gap-4">
          <ProgressRing value={pct} size={64} stroke={6}>
            <span className="text-sm font-bold tabular">
              {done}
              <span className="text-[10px] font-medium text-muted-foreground">/{total}</span>
            </span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              Phase {event.phaseIndex + 1} of {PHASES.length}
            </p>
            <p className="text-lg leading-tight font-bold">{phase.label}</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{phase.hint}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {phase.requiresScan && (
            <Badge variant={progress.complete ? "success" : "outline"}>
              <ScanLine />
              Scan required
            </Badge>
          )}
          {phase.handover && (
            <Badge variant="outline">
              <PenLine />
              {phase.handover.party} signs
            </Badge>
          )}
          {progress.reported > 0 && <Badge variant="warning">{progress.reported} reported</Badge>}
          {progress.flagged.length > 0 && (
            <Badge variant="warning">
              <TriangleAlert />
              {progress.flagged.length} skipped checkpoint
            </Badge>
          )}
        </div>

        {phase.tasks && (
          <ul className="mt-4 space-y-1">
            {phase.tasks.map((task) => {
              const checked = progress.tasksDone.includes(task)
              return (
                <li key={task}>
                  <button
                    type="button"
                    disabled={!canAct}
                    onClick={() => toggleTask(event.id, task)}
                    className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left text-sm active:bg-muted disabled:opacity-60"
                    aria-pressed={checked}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
                        checked ? "border-brand bg-brand text-white" : "border-input"
                      )}
                    >
                      {checked && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className={cn(checked && "text-muted-foreground line-through")}>{task}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {canAct && (
        <div className="flex gap-2 px-3 pb-3">
          {phase.requiresScan && !progress.complete && (
            <Button asChild size="lg" className="flex-1">
              <Link to={`/scan/${event.id}`}>
                <ScanLine />
                Start scan
              </Link>
            </Button>
          )}
          {(progress.complete || !phase.requiresScan) && (
            <Button
              size="lg"
              variant="brand"
              className="flex-1"
              disabled={!progress.complete}
              onClick={() => setSheet(true)}
            >
              {next ? `Continue to ${next.short}` : "Close event"}
            </Button>
          )}
        </div>
      )}

      <PhaseCompleteSheet event={event} progress={progress} open={sheet} onOpenChange={setSheet} />
    </div>
  )
}

function InfoTab({ event }: { event: WeddingEvent }) {
  const { phaseLog } = useAppStore()
  const lead = event.crew.find((c) => c.lead)
  const leadPerson = lead && getPerson(lead.personId)
  const log = phaseLog[event.id] ?? []

  return (
    <div className="pb-6">
      <SectionLabel>Location</SectionLabel>
      <div className="list-card">
        <div className="px-4 py-3.5">
          <p className="font-semibold">{event.venue.name}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{event.venue.address}</p>
          <Callout icon={Truck} tone="info" className="mt-3 px-3 py-2.5">
            {event.venue.loadingNote}
          </Callout>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          <Button asChild variant="secondary" size="sm">
            <a href={mapsLink(`${event.venue.name} ${event.venue.address}`)} target="_blank" rel="noreferrer">
              <Navigation />
              Open Maps
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href={`tel:${event.venue.pic.phone}`}>
              <Phone />
              Venue contact
            </a>
          </Button>
        </div>
      </div>

      <SectionLabel>Rundown</SectionLabel>
      <ol className="list-card !divide-y-0 px-4 py-3 [&>*+*]:!border-0">
        {event.rundown.map((r, i) => (
          <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
            <span className="w-11 shrink-0 pt-px text-[13px] font-semibold tabular">{r.time}</span>
            <span className="relative flex flex-col items-center">
              <span className="mt-1.5 size-2.5 rounded-full border-2 border-brand bg-card" />
              {i < event.rundown.length - 1 && <span className="absolute top-4 -bottom-3 w-px bg-border" />}
            </span>
            <span className="flex-1 text-sm">
              {r.label}
              {r.crewNote && <span className="mt-0.5 block text-xs font-medium text-clay">{r.crewNote}</span>}
            </span>
          </li>
        ))}
      </ol>

      {event.notes.length > 0 && (
        <>
          <SectionLabel>Crew notes</SectionLabel>
          <ul className="list-card">
            {event.notes.map((n, i) => (
              <li key={i} className="flex gap-3 px-4 py-3 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold">
                  {i + 1}
                </span>
                {n}
              </li>
            ))}
          </ul>
        </>
      )}

      <SectionLabel>Key contacts</SectionLabel>
      <div className="list-card">
        {leadPerson && <PersonRow person={leadPerson} detail="Field coordinator" />}
        <PersonRow
          person={{ id: "c0", name: event.client.name, role: event.client.relation, phone: event.client.phone }}
          detail={`Client · ${event.client.relation}`}
        />
        <PersonRow
          person={{ id: "c1", name: event.venue.pic.name, role: "Venue contact", phone: event.venue.pic.phone }}
          detail="Venue contact"
        />
      </div>

      {log.length > 0 && (
        <>
          <SectionLabel>Phase history</SectionLabel>
          <ol className="list-card">
            {log.map((entry, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <CircleCheck className="size-[18px] shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{PHASES.find((p) => p.key === entry.phase)?.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {stamp(entry.at)} · {personName(entry.by)}
                    {entry.handover && ` · received by ${entry.handover.name}`}
                  </p>
                </div>
                {entry.handover && (
                  <img
                    src={entry.handover.signature}
                    alt={`Signature of ${entry.handover.name}`}
                    className="h-8 w-16 rounded-md bg-secondary object-contain"
                  />
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

type ItemFilter = "all" | "pending" | "issue"

function ItemsTab({ event, progress }: { event: WeddingEvent; progress: PhaseProgress | null }) {
  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState<ItemFilter>("all")
  const phase = progress?.phase
  const scanPhase = phase?.requiresScan
  const s = q.trim().toLowerCase()

  const items = event.assetCodes
    .map((code) => getAsset(code)!)
    .filter((a) => !s || a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s))
    .filter((a) => {
      if (filter === "all" || !progress) return true
      const st = progress.byAsset[a.code]
      if (filter === "pending") return st.state === "pending"
      return st.state === "reported" || progress.flagged.includes(a.code) || a.condition !== "Good"
    })

  const groups = Object.entries(
    items.reduce<Record<string, typeof items>>((acc, a) => {
      ;(acc[a.category] ??= []).push(a)
      return acc
    }, {})
  )

  return (
    <div className="pb-6">
      <div className="space-y-3 px-4 pt-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search item name or code"
            className="pl-10"
            type="search"
          />
        </div>
        {scanPhase && (
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {(
              [
                ["all", "All"],
                ["pending", `Not scanned · ${progress!.pending.length}`],
                ["issue", "Needs attention"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFilter(v)}
                className={cn(
                  "h-8 shrink-0 rounded-full px-3 text-[12.5px] font-semibold",
                  filter === v ? "bg-ink text-white" : "bg-card shadow-soft"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {groups.length === 0 && (
        <EmptyState
          icon={PackageSearch}
          title={s ? `No items match “${q}”` : "No items in this filter"}
          body={s ? "Check the spelling or search by the code on the label." : undefined}
        />
      )}

      {groups.map(([category, assets]) => (
        <div key={category}>
          <SectionLabel>
            {category} · {assets.length}
          </SectionLabel>
          <ul className="list-card">
            {assets.map((a) => {
              const st = progress?.byAsset[a.code]
              return (
                <li key={a.code}>
                  <Link
                    to={`/event/${event.id}/items/${a.code}`}
                    className="flex items-center gap-3 px-4 py-3 active:bg-muted"
                  >
                    <CategoryIcon category={a.category} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono text-[11px]">{a.code}</span> · {a.unit}
                      </p>
                    </div>
                    {scanPhase && st && <ScanState state={st} flagged={progress!.flagged.includes(a.code)} />}
                    {!scanPhase && a.condition !== "Good" && <Badge variant="warning">{a.condition}</Badge>}
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

function ScanState({ state, flagged }: { state: PhaseProgress["byAsset"][string]; flagged: boolean }) {
  if (state.state === "scanned")
    return (
      <span className={cn("flex flex-col items-end text-[11px]", flagged ? "text-clay" : "text-brand")}>
        {flagged ? <TriangleAlert className="size-[18px]" /> : <CircleCheck className="size-[18px]" />}
        <span className="mt-0.5 flex items-center gap-0.5 tabular">
          {state.record.synced === false && <CloudOff className="size-3" />}
          {clock(state.record.at)}
        </span>
      </span>
    )
  if (state.state === "reported")
    return (
      <Badge variant="warning">
        <TriangleAlert />
        {state.report.category}
      </Badge>
    )
  return <CircleDashed className="size-[18px] text-muted-foreground/50" />
}

function TeamTab({ event }: { event: WeddingEvent }) {
  const { userId } = useAppStore()
  const internal = event.crew.filter((c) => !getPerson(c.personId)?.company)
  const vendors = event.crew.filter((c) => getPerson(c.personId)?.company)

  return (
    <div className="pb-6">
      <SectionLabel>In-house crew · {internal.length}</SectionLabel>
      <div className="list-card">
        {internal.map((c) => (
          <PersonRow
            key={c.personId}
            person={getPerson(c.personId)!}
            detail={c.duty}
            isYou={c.personId === userId}
            badge={
              c.lead ? (
                <Badge variant="success" className="gap-0.5">
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
          <div className="list-card">
            {vendors.map((c) => (
              <PersonRow key={c.personId} person={getPerson(c.personId)!} detail={c.duty} />
            ))}
          </div>
        </>
      )}
      <p className="px-5 pt-4 text-xs text-muted-foreground">
        All crew call time <span className="font-semibold text-foreground tabular">{event.callTime}</span> at
        the warehouse.
      </p>
    </div>
  )
}
