import * as React from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import {
  Check,
  CircleCheck,
  CircleDashed,
  ClipboardList,
  CloudOff,
  Crown,
  EyeOff,
  Navigation,
  PackageSearch,
  PackageX,
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
import { ManifestGrid } from "@/components/manifest-grid"
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
const TOP_BAR_HEIGHT = 57
type Tab = (typeof TABS)[number]

export function EventDetailPage() {
  const { id } = useParams()
  const store = useAppStore()
  const { events, reports, userId } = store
  const [params, setParams] = useSearchParams()
  const tabsAnchor = React.useRef<HTMLDivElement>(null)
  // On a phone the header and phase panel fill the first screen, so a chosen
  // tab scrolls its content up under the sticky top bar.
  const scrollToTabs = React.useCallback((smooth: boolean) => {
    const el = tabsAnchor.current
    if (!el) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const top = el.getBoundingClientRect().top + window.scrollY - TOP_BAR_HEIGHT
    window.scrollTo({ top, behavior: smooth && !reduced ? "smooth" : "auto" })
  }, [])
  React.useEffect(() => {
    // Deep link to a tab (e.g. from a report): open at the tab, not the header.
    const deepTab = params.get("tab")
    if (deepTab && deepTab !== "info") requestAnimationFrame(() => scrollToTabs(false))
    // Only on arrival; later switches scroll from onValueChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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
      <TopBar back="/" titleAs="p" title={event.couple} subtitle={`${event.kind} · ${event.venue.name}`} />

      {/* Object header: the event itself, dated like its invitation. */}
      <section className="mx-4 mt-4 mb-4 flex gap-3.5 rounded-xl p-3.5 edge">
        <div className="flex w-[50px] shrink-0 flex-col items-center justify-center rounded-md bg-brand-soft py-2 text-brand-ink">
          <span className="text-[12px] font-medium">{formatDate(event.date, { month: "short" })}</span>
          <span className="text-[22px] leading-tight font-semibold tabular">{formatDate(event.date, { day: "numeric" })}</span>
          <span className="text-[12px]">{formatDate(event.date, { weekday: "short" })}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-balance">{event.couple}</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {event.kind} · <span className="tabular">{event.guests}</span> guests
            <span className="block">{event.theme}</span>
          </p>
          <dl className="mt-2.5 flex gap-5 text-[14px]">
            <Fact label="Call" value={event.callTime} />
            <Fact label="Event" value={`${event.startTime}–${event.endTime}`} />
          </dl>
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

      <div ref={tabsAnchor} className="mt-5" />
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setParams({ tab: v }, { replace: true })
          requestAnimationFrame(() => scrollToTabs(true))
        }}
        className="gap-0"
      >
        <div className="sticky top-[57px] z-20 bg-background">
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
                <PackageX className="text-warning" />
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
  return <span className="text-[13px] font-normal text-muted-foreground tabular">{n}</span>
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular">{value}</dd>
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
  // One container split by a divider, not two boxes.
  return (
    <div className="mx-4 mb-4 grid grid-cols-2 divide-x divide-rule rounded-xl edge">
      <div className="p-3.5">
        <p className="text-[13px] text-muted-foreground">Now{now && <span className="tabular"> · since {now.time}</span>}</p>
        <p className="mt-0.5 line-clamp-2 text-[15px] font-semibold">{now ? now.label : "Not started"}</p>
      </div>
      <div className="p-3.5">
        <p className="text-[13px] text-muted-foreground tabular">
          Next{next && ` · ${next.time}, ${inMinutes(minutesToNext!)}`}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[15px] font-semibold">{next ? next.label : "Rundown done"}</p>
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
      <div className="mx-4 rounded-xl p-4 edge">
        <PhaseTrack index={PHASES.length} />
        <div className="mt-4 flex items-center gap-3">
          <CircleCheck className="size-5 shrink-0 text-success" />
          <div>
            <p className="font-semibold">Event complete, every item back</p>
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
  const left = phase.requiresScan ? progress.pending.length : (phase.tasks?.length ?? 0) - progress.tasksDone.length
  const next = PHASES[event.phaseIndex + 1]

  return (
    <div className="mx-4 rounded-xl edge">
      <div className="p-4">
        <PhaseTrack index={event.phaseIndex} />
        <p className="mt-4 text-[13px] text-muted-foreground">
          Phase {event.phaseIndex + 1} of {PHASES.length}
          {phase.handover && ` · ${phase.handover.party} signs off`}
        </p>
        <h2 className="text-[18px] leading-tight font-semibold">{phase.label}</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">{phase.hint}</p>

        {phase.requiresScan && (
          <>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-[32px] leading-none font-semibold tracking-[-0.02em] tabular">{left}</span>
              <span className="text-[15px] text-muted-foreground">
                {left === 0 ? "nothing left to scan" : left === 1 ? "item to scan" : "items to scan"}
              </span>
            </p>
            <ManifestGrid progress={progress} codes={event.assetCodes} className="mt-3" />
          </>
        )}

        {phase.tasks && (
          <ul className="mt-3">
            {phase.tasks.map((task) => {
              const checked = progress.tasksDone.includes(task)
              return (
                <li key={task}>
                  <button
                    type="button"
                    disabled={!canAct}
                    onClick={() => toggleTask(event.id, task)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-md px-1 text-left text-[15px] hover:bg-secondary disabled:opacity-60"
                    aria-pressed={checked}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-colors",
                        checked ? "border-brand bg-brand text-white" : "border-[#9ca3af] bg-card"
                      )}
                    >
                      {checked && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className={cn(checked && "text-muted-foreground")}>{task}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {canAct && (
        <div className="flex gap-2 border-t border-rule p-3">
          {phase.requiresScan && !progress.complete && (
            <Button asChild size="lg" className="flex-1">
              <Link to={`/scan/${event.id}`}>
                <ScanLine />
                Scan {left} {left === 1 ? "item" : "items"}
              </Link>
            </Button>
          )}
          {(progress.complete || !phase.requiresScan) && (
            <Button size="lg" className="flex-1" disabled={!progress.complete} onClick={() => setSheet(true)}>
              {progress.complete
                ? next
                  ? `Continue to ${next.label}`
                  : "Close event"
                : `${left} ${left === 1 ? "task" : "tasks"} left before ${next?.label ?? "closing"}`}
            </Button>
          )}
        </div>
      )}

      <PhaseCompleteSheet event={event} progress={progress} open={sheet} onOpenChange={setSheet} />
    </div>
  )
}

function InfoTab({ event }: { event: WeddingEvent }) {
  const { now: current } = nowAndNext(event)
  const currentIdx = current ? event.rundown.indexOf(current) : -1
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
          {hasText(event.venue.loadingNote) && (
            <Callout icon={Truck} tone="info" className="mt-3 px-3 py-2.5">
              {event.venue.loadingNote}
            </Callout>
          )}
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
        {event.rundown.map((r, i) => {
          const isNow = r === current
          const past = !isNow && currentIdx >= 0 && i < currentIdx
          return (
            <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
              <span className={cn("w-11 shrink-0 pt-px text-[14px] tabular", past ? "text-muted-foreground" : "font-semibold")}>
                {r.time}
              </span>
              <span className="relative flex flex-col items-center">
                <span
                  className={cn(
                    "mt-1.5 size-2.5 rounded-full border-2",
                    isNow ? "border-brand bg-brand" : past ? "border-[#c4c7cd] bg-[#c4c7cd]" : "border-[#9ca3af] bg-card"
                  )}
                />
                {i < event.rundown.length - 1 && <span className="absolute top-4 -bottom-3 w-px bg-border" />}
              </span>
              <span className={cn("flex-1 text-[15px]", past && "text-muted-foreground", isNow && "font-semibold")}>
                {r.label}
                {isNow && <span className="ml-2 text-[13px] font-medium text-brand-ink">Now</span>}
                {r.crewNote && <span className="mt-0.5 block text-[13px] font-medium text-warning">{r.crewNote}</span>}
              </span>
            </li>
          )
        })}
      </ol>

      {event.notes.length > 0 && (
        <>
          <SectionLabel>Crew notes</SectionLabel>
          <ul className="list-card">
            {event.notes.map((n, i) => (
              <li key={i} className="flex gap-3 px-4 py-3 text-sm">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#9ca3af]" />
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
                  "h-9 shrink-0 rounded-md border px-3 text-[13px] font-medium",
                  filter === v ? "border-brand bg-brand-soft text-brand-ink" : "border-input bg-card"
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
                        <span className="font-mono text-[12px]">{a.code}</span> · {a.unit}
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
      <span className={cn("flex flex-col items-end text-[12px]", flagged ? "text-warning" : "text-brand")}>
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
  return <CircleDashed className="size-[18px] text-[#9ca3af]" />
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

/** Mock data marks a missing note with a dash; treat that and blanks as absent. */
function hasText(value?: string) {
  return !!value && value.trim() !== "" && value.trim() !== "—"
}
