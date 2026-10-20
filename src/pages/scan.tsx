import * as React from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  Ban,
  Camera,
  CameraOff,
  CircleCheck,
  CircleDashed,
  CloudOff,
  CornerDownLeft,
  Info,
  PackageCheck,
  ScanLine,
  TriangleAlert,
  Undo2,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { PhaseCompleteSheet } from "@/components/phase-complete"
import { PhaseTrack } from "@/components/phase-track"
import { ProgressRing } from "@/components/progress-ring"
import { Callout, EmptyState, SectionLabel } from "@/components/section"
import { SyncStatus } from "@/components/sync-status"
import { TopBar } from "@/components/top-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PHASES } from "@/data/phases"
import { cameraScanSupported, useBarcodeCamera } from "@/hooks/use-barcode-camera"
import { clock, dayDiff, relativeDay } from "@/lib/format"
import { getAsset, personName } from "@/lib/lookup"
import { getEventProgress } from "@/lib/progress"
import { cn } from "@/lib/utils"
import { useAppStore, type ScanResult } from "@/store/app-store"
import { NotFound } from "./not-found"

/* /scan: pick which event to scan for. One crew member can be on several events. */
export function ScanPickerPage() {
  const store = useAppStore()
  const { events, userId } = store
  const scannable = events
    .filter((e) => e.crew.some((c) => c.personId === userId))
    .map((e) => ({ e, p: getEventProgress(e, store) }))
    .filter(({ p }) => p?.phase.requiresScan)
    .sort((a, b) => a.e.date.localeCompare(b.e.date))

  return (
    <div>
      <TopBar large back={false} subtitle="Pick the event you're working on" title="Scan items" />
      {scannable.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="No phase needs scanning"
          body="Scanning is needed at warehouse load-out, venue arrival, teardown, and warehouse return."
        />
      ) : (
        <>
          <SectionLabel>Awaiting scan · {scannable.length}</SectionLabel>
          <div className="flex flex-col gap-3 px-4">
            {scannable.map(({ e, p }) => {
              const cleared = p!.scanned + p!.reported
              const pct = (cleared / p!.total) * 100
              return (
                <Link
                  key={e.id}
                  to={`/scan/${e.id}`}
                  className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft active:scale-[0.99]"
                >
                  <ProgressRing value={pct} size={52} stroke={5}>
                    <span className="text-[12px] font-bold tabular">{Math.round(pct)}%</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{e.couple}</p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {p!.phase.label} · {relativeDay(e.date)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular">
                      {cleared}/{p!.total} items
                    </p>
                  </div>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                    <ScanLine className="size-5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

type Feedback = ScanResult & { name?: string; key: number; shownAt: number }

/* Short beeps so the crew doesn't need to look at the screen for every scan. */
let audioCtx: AudioContext | undefined
function beep(ok: boolean) {
  try {
    audioCtx ??= new AudioContext()
    const play = (freq: number, start: number) => {
      const osc = audioCtx!.createOscillator()
      const gain = audioCtx!.createGain()
      osc.frequency.value = freq
      osc.type = "sine"
      gain.gain.setValueAtTime(0.12, audioCtx!.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx!.currentTime + start + 0.12)
      osc.connect(gain).connect(audioCtx!.destination)
      osc.start(audioCtx!.currentTime + start)
      osc.stop(audioCtx!.currentTime + start + 0.13)
    }
    if (ok) play(1320, 0)
    else {
      play(330, 0)
      play(330, 0.16)
    }
  } catch {
    /* audio blocked: haptics/visuals still cover it */
  }
}

const UNDO_WINDOW_MS = 8000

/* /scan/:eventId: the scanner for the event's current phase. */
export function ScannerPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const store = useAppStore()
  const { events, scan, undoScan, userId, online } = store
  const event = events.find((e) => e.id === eventId)

  const [manual, setManual] = React.useState("")
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [camera, setCamera] = React.useState(false)
  const [sound, setSound] = React.useState(true)
  const [list, setList] = React.useState<"pending" | "done">("pending")
  const [sheet, setSheet] = React.useState(false)
  const [, rerender] = React.useReducer((x: number) => x + 1, 0)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const counter = React.useRef(0)

  const handleCode = React.useCallback(
    (code: string) => {
      if (!eventId) return
      const result = scan(eventId, code)
      const ok = result.status === "ok"
      navigator.vibrate?.(ok ? 35 : [70, 50, 70])
      if (sound) beep(ok && !result.skippedPrevious)
      setFeedback({ ...result, name: getAsset(result.code)?.name, key: ++counter.current, shownAt: Date.now() })
    },
    [eventId, scan, sound]
  )

  const { error: cameraError } = useBarcodeCamera(videoRef, camera, handleCode)

  // Expire the undo button.
  React.useEffect(() => {
    if (feedback?.status !== "ok") return
    const t = window.setTimeout(rerender, UNDO_WINDOW_MS + 50)
    return () => window.clearTimeout(t)
  }, [feedback])

  // Leaving the page with the camera on would keep the LED on in some browsers.
  React.useEffect(() => () => setCamera(false), [])

  if (!event) return <NotFound />
  const progress = getEventProgress(event, store)
  const phase = PHASES[event.phaseIndex]
  const assigned = event.crew.some((c) => c.personId === userId)

  if (!assigned || !progress || !phase?.requiresScan) {
    return (
      <div>
        <TopBar title={event.couple} back={`/event/${event.id}`} />
        <EmptyState
          icon={!assigned ? Ban : Info}
          title={
            !assigned
              ? "You're not assigned to this event"
              : phase
                ? `${phase.label} doesn't need scanning`
                : "This event is closed"
          }
          body={!assigned ? "Ask the coordinator to add you to the team if this is a mistake." : undefined}
          action={
            <Button asChild variant="outline">
              <Link to={`/event/${event.id}`}>Back to event</Link>
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
  const daysAway = dayDiff(event.date)
  const canUndo =
    feedback?.status === "ok" &&
    Date.now() - feedback.shownAt < UNDO_WINDOW_MS &&
    progress.byAsset[feedback.code]?.state === "scanned"

  const simulate = () => {
    const code = progress.pending[Math.floor(Math.random() * progress.pending.length)]
    if (code) handleCode(code)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Dark capture area */}
      <div className="bg-[oklch(0.17_0.008_265)] text-white">
        <SyncStatus dark />
        <div className="flex h-14 items-center gap-2 px-3">
          <button
            type="button"
            aria-label="Close scanner"
            className="flex size-9 items-center justify-center rounded-full bg-white/10 active:scale-95"
            onClick={() => navigate(`/event/${event.id}`)}
          >
            <X className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{phase.label}</p>
            <p className="truncate text-xs text-white/55">{event.couple}</p>
          </div>
          <button
            type="button"
            aria-label={sound ? "Mute sound" : "Unmute sound"}
            onClick={() => setSound((s) => !s)}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 active:scale-95"
          >
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <ProgressRing
            value={pct}
            size={44}
            stroke={4}
            trackClassName="stroke-white/12"
            barClassName="stroke-[oklch(0.82_0.14_158)]"
          >
            <span className="text-[11px] font-bold tabular">{cleared}</span>
          </ProgressRing>
        </div>

        <div className="px-4">
          <PhaseTrack index={event.phaseIndex} showLabels={false} tone="dark" />
        </div>

        <div className="relative mx-4 mt-4 aspect-[4/3] overflow-hidden rounded-3xl bg-black/50">
          {camera && (
            <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />
          )}
          <Viewfinder active={camera} />
          {!camera && (
            <div className="absolute inset-x-0 bottom-4 px-6 text-center text-[13px] text-white/55">
              {cameraScanSupported
                ? "Turn on the camera and point it at the QR label"
                : "This browser can't scan with the camera yet. Type the code on the label."}
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-x-3 bottom-3 rounded-xl bg-black/75 px-3 py-2 text-xs">
              {cameraError}
            </div>
          )}
          {!online && (
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-[oklch(0.88_0.1_75)]">
              <CloudOff className="size-3" /> Offline
            </span>
          )}
        </div>

        <div className="px-4 pt-3 pb-4">
          <ScanFeedback
            feedback={feedback}
            canUndo={canUndo}
            onUndo={() => {
              if (!feedback) return
              undoScan(event.id, feedback.code)
              toast(`Scan of ${feedback.code} undone`)
              setFeedback(null)
            }}
            eventId={event.id}
          />
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
              placeholder="Type a code, e.g. KRS-TFG-01"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              maxLength={20}
              className="border-white/10 bg-white/8 font-mono text-[14px] text-white uppercase shadow-none placeholder:font-sans placeholder:normal-case placeholder:text-white/40"
            />
            <Button type="submit" size="icon" variant="secondary" aria-label="Submit code" disabled={!manual.trim()}>
              <CornerDownLeft />
            </Button>
          </form>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              className="bg-white/10 text-white shadow-none hover:bg-white/15"
              disabled={!cameraScanSupported}
              onClick={() => setCamera((c) => !c)}
            >
              {camera ? <CameraOff /> : <Camera />}
              {camera ? "Turn off" : "Camera"}
            </Button>
            <Button
              className="bg-white/10 text-white shadow-none hover:bg-white/15"
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
      <div className="flex-1 pb-32">
        {phase.key === "load_out" && daysAway > 1 && (
          <Callout icon={Info} tone="info" className="mx-4 mt-4">
            This event is still {daysAway} days away. Make sure you're loading for the right event.
          </Callout>
        )}
        {progress.flagged.length > 0 && (
          <Callout icon={TriangleAlert} className="mx-4 mt-4">
            {progress.flagged.length} items were scanned here without a scan at the previous checkpoint.
            This has been noted for the coordinator.
          </Callout>
        )}

        <div className="flex items-center px-4 pt-4 pb-3">
          <ToggleGroup type="single" value={list} onValueChange={(v) => v && setList(v as typeof list)}>
            <ToggleGroupItem value="pending">To scan · {progress.pending.length}</ToggleGroupItem>
            <ToggleGroupItem value="done">Recorded · {doneCodes.length}</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {list === "pending" && progress.pending.length === 0 && (
          <EmptyState
            icon={PackageCheck}
            title="Every item is recorded"
            body={next ? `Continue to ${next.label}.` : "The event is ready to close."}
          />
        )}
        {list === "done" && doneCodes.length === 0 && (
          <EmptyState icon={ScanLine} title="Nothing scanned yet" body="Start with the nearest item." />
        )}

        <ul className="list-card empty:hidden">
          {(list === "pending" ? progress.pending : doneCodes).map((code) => {
            const asset = getAsset(code)!
            const st = progress.byAsset[code]
            const flagged = progress.flagged.includes(code)
            return (
              <li key={code} className="flex items-center gap-3 px-4 py-3">
                {st.state === "scanned" ? (
                  flagged ? (
                    <TriangleAlert className="size-5 shrink-0 text-clay" />
                  ) : (
                    <CircleCheck className="size-5 shrink-0 text-brand" />
                  )
                ) : st.state === "reported" ? (
                  <TriangleAlert className="size-5 shrink-0 text-clay" />
                ) : (
                  <CircleDashed className="size-5 shrink-0 text-muted-foreground/50" />
                )}
                <Link to={`/event/${event.id}/items/${code}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{asset.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono text-[11px]">{code}</span> · {asset.unit}
                  </p>
                </Link>
                {st.state === "pending" && (
                  <Button asChild size="sm" variant="secondary" className="text-clay">
                    <Link to={`/new-report?event=${event.id}&type=damage&asset=${code}`}>Report</Link>
                  </Button>
                )}
                {st.state === "scanned" && (
                  <span className="flex flex-col items-end text-[11px] text-muted-foreground tabular">
                    <span className="flex items-center gap-1">
                      {st.record.synced === false && <CloudOff className="size-3" />}
                      {clock(st.record.at)}
                    </span>
                    <span>{personName(st.record.by).split(" ")[0]}</span>
                  </span>
                )}
                {st.state === "reported" && <Badge variant="warning">{st.report.category}</Badge>}
              </li>
            )
          })}
        </ul>

        {list === "pending" && progress.pending.length > 0 && (
          <p className="px-5 pt-3 text-xs text-muted-foreground">
            Item missing, short, or damaged? Tap <span className="font-semibold text-clay">Report</span>.
            Reported items don't block the phase, but they stay on record.
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[440px] bg-gradient-to-t from-background via-background to-transparent px-4 pt-6 pb-[max(env(safe-area-inset-bottom),14px)]">
        <Button
          size="lg"
          variant={progress.complete ? "brand" : "default"}
          className="w-full"
          disabled={!progress.complete}
          onClick={() => {
            setCamera(false)
            setSheet(true)
          }}
        >
          {progress.complete
            ? next
              ? `Done, continue to ${next.label}`
              : "Done, close event"
            : `${progress.pending.length} items to go`}
        </Button>
      </div>

      <PhaseCompleteSheet
        event={event}
        progress={progress}
        open={sheet}
        onOpenChange={setSheet}
        onDone={() => navigate(`/event/${event.id}`, { replace: true })}
      />
    </div>
  )
}

function Viewfinder({ active }: { active: boolean }) {
  const corner = "absolute size-8 border-white/90"
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative size-[58%]">
        <span className={cn(corner, "top-0 left-0 rounded-tl-2xl border-t-[3px] border-l-[3px]")} />
        <span className={cn(corner, "top-0 right-0 rounded-tr-2xl border-t-[3px] border-r-[3px]")} />
        <span className={cn(corner, "bottom-0 left-0 rounded-bl-2xl border-b-[3px] border-l-[3px]")} />
        <span className={cn(corner, "right-0 bottom-0 rounded-br-2xl border-r-[3px] border-b-[3px]")} />
        <div className="absolute inset-x-3 top-0 bottom-0 overflow-hidden">
          <div
            className={cn(
              "absolute inset-x-0 h-0.5 rounded-full bg-[oklch(0.85_0.14_158)] shadow-[0_0_16px_3px_oklch(0.85_0.14_158/0.6)]",
              active ? "animate-sweep" : "opacity-0"
            )}
          />
        </div>
        {!active && <ScanLine className="absolute top-1/2 left-1/2 size-9 -translate-1/2 text-white/20" />}
      </div>
    </div>
  )
}

function ScanFeedback({
  feedback,
  canUndo,
  onUndo,
  eventId,
}: {
  feedback: Feedback | null
  canUndo: boolean
  onUndo: () => void
  eventId: string
}) {
  if (!feedback)
    return (
      <div className="flex h-16 items-center justify-center rounded-2xl border border-dashed border-white/15 px-3 text-[13px] text-white/40">
        Scan results appear here
      </div>
    )

  const warnOk = feedback.status === "ok" && (feedback.skippedPrevious || feedback.conditionNote)
  const tone =
    feedback.status === "ok"
      ? warnOk
        ? "bg-[oklch(0.5_0.1_70)]"
        : "bg-[oklch(0.5_0.12_158)]"
      : feedback.status === "duplicate"
        ? "bg-white/12"
        : "bg-[oklch(0.5_0.17_25)]"

  let title: React.ReactNode
  let detail: React.ReactNode
  let Icon = X
  switch (feedback.status) {
    case "ok":
      Icon = warnOk ? TriangleAlert : CircleCheck
      title = feedback.name
      detail = feedback.skippedPrevious
        ? `Not recorded at ${PHASES.find((p) => p.key === feedback.skippedPrevious)?.short}. Flagged for a check.`
        : feedback.conditionNote
          ? `Check first: ${feedback.conditionNote}`
          : feedback.code
      break
    case "duplicate":
      Icon = Info
      title = `${feedback.name} already recorded`
      detail = `${clock(feedback.at)} by ${personName(feedback.by)}`
      break
    case "other-event":
      title = "This item isn't for this event"
      detail = feedback.eventName
        ? `${feedback.code} is booked for ${feedback.eventName}. Don't load it.`
        : `${feedback.code} isn't on this event's list.`
      break
    case "still-out":
      title = "Item is still at another event"
      detail = `${feedback.code} hasn't come back from ${feedback.eventName}. Check the label or call the warehouse.`
      break
    case "unknown":
      title = "Unknown code"
      detail = `${feedback.code} isn't in the inventory. The label may be damaged.`
      break
    case "invalid":
      title = "Wrong code format"
      detail = "Correct format, e.g. KRS-TFG-01"
      break
    default:
      Icon = Info
      title = "Scanning isn't available in this phase"
      detail = ""
  }

  const reportable = feedback.status === "unknown" || feedback.status === "other-event"

  return (
    <div
      key={feedback.key}
      role="alert"
      className={cn("flex min-h-16 animate-flash items-center gap-3 rounded-2xl px-3.5 py-2.5", tone)}
    >
      <Icon className="size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="line-clamp-2 text-[12px] leading-snug text-white/80">{detail}</p>
      </div>
      {canUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="flex shrink-0 items-center gap-1 rounded-full bg-black/20 px-2.5 py-1.5 text-[12px] font-semibold active:scale-95"
        >
          <Undo2 className="size-3.5" />
          Undo
        </button>
      )}
      {reportable && (
        <Link
          to={`/new-report?event=${eventId}&type=issue`}
          className="shrink-0 rounded-full bg-black/20 px-2.5 py-1.5 text-[12px] font-semibold"
        >
          Report
        </Link>
      )}
    </div>
  )
}
