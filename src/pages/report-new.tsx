import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  Camera,
  Check,
  ChevronDown,
  CloudOff,
  ImagePlus,
  Info,
  Loader2,
  PackageX,
  Phone,
  Search,
  TriangleAlert,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { CategoryIcon } from "@/components/category-icon"
import { Callout } from "@/components/section"
import { TopBar } from "@/components/top-bar"
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PHASES } from "@/data/phases"
import type { ReportKind, Severity } from "@/data/types"
import { relativeDay } from "@/lib/format"
import { getAsset, getPerson } from "@/lib/lookup"
import { isClosed } from "@/lib/progress"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"

const ISSUE_CATEGORIES = ["Venue", "Vendor", "Transport", "Client", "Crew", "Security", "Other"]
const DAMAGE_TYPES = ["Minor damage", "Major damage", "Missing", "Short count"]
const SEVERITIES: Severity[] = ["Low", "Medium", "High"]
const MAX_PHOTOS = 4
const MAX_PHOTO_MB = 15
const DESC_MIN = 10
const DESC_MAX = 500

export function ReportNewPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { events, userId, addReport, reports, online } = useAppStore()

  const mine = events
    .filter((e) => e.crew.some((c) => c.personId === userId))
    .sort((a, b) => Number(isClosed(a)) - Number(isClosed(b)) || a.date.localeCompare(b.date))

  const initialEvent = mine.find((e) => e.id === params.get("event")) ?? mine.find((e) => !isClosed(e))
  const initialAsset = params.get("asset") ?? ""

  const [kind, setKind] = React.useState<ReportKind>(params.get("type") === "damage" ? "damage" : "issue")
  const [eventId, setEventId] = React.useState(initialEvent?.id ?? "")
  const [assetCode, setAssetCode] = React.useState(
    initialEvent?.assetCodes.includes(initialAsset) ? initialAsset : ""
  )
  const [category, setCategory] = React.useState("")
  const [severity, setSeverity] = React.useState<Severity>("Medium")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [photos, setPhotos] = React.useState<string[]>([])
  const [processing, setProcessing] = React.useState(false)
  const [picker, setPicker] = React.useState<"event" | "asset" | null>(null)
  const [submitted, setSubmitted] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [leave, setLeave] = React.useState<null | (() => void)>(null)

  const event = events.find((e) => e.id === eventId)
  const asset = assetCode ? getAsset(assetCode) : undefined
  const phaseKey = event ? PHASES[Math.min(event.phaseIndex, PHASES.length - 1)].key : undefined
  const lead = event && getPerson(event.crew.find((c) => c.lead)?.personId ?? "")

  const dirty = !!(category || title.trim() || description.trim() || photos.length)

  // Warn before a reload/close throws away a half-written report.
  React.useEffect(() => {
    if (!dirty || submitting) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty, submitting])

  // Same asset already reported in this phase and still open: likely a duplicate.
  const existing =
    kind === "damage" && asset && event
      ? reports.find(
          (r) =>
            r.eventId === event.id &&
            r.assetCode === asset.code &&
            r.phase === phaseKey &&
            r.status !== "Resolved"
        )
      : undefined

  const autoTitle = kind === "damage" && asset && category ? `${asset.name} · ${category.toLowerCase()}` : ""
  const desc = description.trim()
  const errors = {
    event: !event,
    asset: kind === "damage" && !asset,
    category: !category,
    title: !(title.trim() || autoTitle),
    description: desc.length < DESC_MIN,
  }
  const valid = !Object.values(errors).some(Boolean)
  const err = (k: keyof typeof errors) => submitted && errors[k]

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || processing) return
    setSubmitted(true)
    if (!valid) {
      toast.error("Fill in the fields marked in red first")
      return
    }
    setSubmitting(true)
    const report = addReport({
      eventId,
      kind,
      category,
      assetCode: kind === "damage" ? assetCode : undefined,
      severity,
      title: title.trim() || autoTitle,
      description: desc,
      photos,
    })
    toast.success(
      online ? `Report ${report.id} sent to the coordinator` : `Report ${report.id} saved, will send when online`
    )
    navigate(`/reports/${report.id}`, { replace: true })
  }

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return
    const room = MAX_PHOTOS - photos.length
    const list = Array.from(files)
    if (list.length > room) toast(`Up to ${MAX_PHOTOS} photos. ${list.length - room} photo(s) not added.`)
    const accepted = list.slice(0, room).filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`)
        return false
      }
      if (f.size > MAX_PHOTO_MB * 1024 * 1024) {
        toast.error(`${f.name} is larger than ${MAX_PHOTO_MB} MB`)
        return false
      }
      return true
    })
    if (!accepted.length) return
    setProcessing(true)
    const out = await Promise.all(accepted.map(compressImage))
    setProcessing(false)
    const ok = out.filter((x): x is string => !!x)
    if (ok.length < accepted.length) toast.error("Some photos couldn't be read. Try taking them again.")
    setPhotos((p) => [...p, ...ok].slice(0, MAX_PHOTOS))
  }

  return (
    <form onSubmit={submit} className="flex min-h-dvh flex-col" noValidate>
      <TopBar
        title="New report"
        subtitle="Goes to the field coordinator"
        onBack={(go) => (dirty ? setLeave(() => go) : go())}
      />

      <div className="flex-1 space-y-6 px-4 pt-3 pb-32">
        {!online && (
          <Callout icon={CloudOff}>You're offline. The report is saved on this phone and sent automatically when signal returns.</Callout>
        )}

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["issue", "Field issue", "Venue, vendor, transport", TriangleAlert],
              ["damage", "Damaged item", "Damaged, missing, short", PackageX],
            ] as const
          ).map(([value, label, hint, Icon]) => (
            <button
              key={value}
              type="button"
              aria-pressed={kind === value}
              onClick={() => {
                setKind(value)
                setCategory("")
              }}
              className={cn(
                "flex flex-col items-start gap-3 rounded-xl border border-input bg-card p-4 text-left transition-[color,background-color,border-color]",
                kind === value && "border-brand bg-brand-soft"
              )}
            >
              <Icon className={cn("size-5", value === "damage" ? "text-warning" : "text-muted-foreground")} strokeWidth={1.6} />
              <span>
                <span className="block text-[15px] font-semibold">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
            </button>
          ))}
        </div>

        <Field label="Event" error={err("event") && "Pick an event"}>
          <PickerButton onClick={() => setPicker("event")} invalid={err("event")}>
            {event ? (
              <span className="min-w-0">
                <span className="block truncate font-semibold">{event.couple}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {relativeDay(event.date)} · {event.venue.name}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                {mine.length ? "Pick an event" : "You aren't assigned to any event yet"}
              </span>
            )}
          </PickerButton>
          {event && isClosed(event) && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5" />
              This event is closed. The report is still kept on record.
            </p>
          )}
        </Field>

        {kind === "damage" && (
          <Field label="Item" error={err("asset") && "Pick the affected item"}>
            <PickerButton onClick={() => setPicker("asset")} disabled={!event} invalid={err("asset")}>
              {asset ? (
                <span className="flex min-w-0 items-center gap-3">
                  <CategoryIcon category={asset.category} className="size-9" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{asset.name}</span>
                    <span className="block truncate font-mono text-[12px] text-muted-foreground">{asset.code}</span>
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {event ? "Pick from this event's items" : "Pick an event first"}
                </span>
              )}
            </PickerButton>
            {existing && (
              <Callout icon={Info} tone="info">
                This item was already reported in this phase ({existing.id}, {existing.status.toLowerCase()}).{" "}
                <Link to={`/reports/${existing.id}`} className="font-semibold underline underline-offset-2">
                  Add an update there
                </Link>{" "}
                if it's the same problem.
              </Callout>
            )}
          </Field>
        )}

        <Field label={kind === "damage" ? "Condition" : "Category"} error={err("category") && "Pick one"}>
          <ToggleGroup type="single" value={category} onValueChange={(v) => v && setCategory(v)}>
            {(kind === "damage" ? DAMAGE_TYPES : ISSUE_CATEGORIES).map((c) => (
              <ToggleGroupItem key={c} value={c}>
                {c}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field label="Urgency">
          <div className="grid grid-cols-3 gap-1 rounded-md bg-secondary p-1">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={severity === s}
                onClick={() => setSeverity(s)}
                className={cn(
                  "flex h-9 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold text-muted-foreground transition-[color,background-color,border-color]",
                  severity === s && "bg-card text-foreground ring-1 ring-border"
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    s === "Low" && "bg-[#9ca3af]",
                    s === "Medium" && "bg-warning",
                    s === "High" && "bg-destructive"
                  )}
                />
                {s}
              </button>
            ))}
          </div>
          {severity === "High" && lead && (
            <Callout icon={Phone} tone="danger">
              High urgency: after sending, call{" "}
              <a href={`tel:${lead.phone}`} className="font-semibold underline underline-offset-2">
                {lead.name}
              </a>{" "}
              right away.
            </Callout>
          )}
        </Field>

        <Field label="Short title" error={err("title") && "Add a title"}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={autoTitle || "e.g. Stage power is out"}
            maxLength={80}
            aria-invalid={err("title") || undefined}
          />
        </Field>

        <Field
          label="What happened?"
          error={err("description") && `Describe it briefly (min. ${DESC_MIN} characters)`}
          hint={`${desc.length}/${DESC_MAX}`}
        >
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
            placeholder="Where, what happened, and what you've done so far."
            aria-invalid={err("description") || undefined}
          />
        </Field>

        <Field label={`Photos (${photos.length}/${MAX_PHOTOS})`}>
          <div className="grid grid-cols-4 gap-2">
            {photos.map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-md edge">
                <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {processing && (
              <div className="flex aspect-square items-center justify-center rounded-md edge">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!processing && photos.length < MAX_PHOTOS && (
              <>
                <PhotoInput capture icon={Camera} label="Camera" onFiles={addPhotos} />
                {photos.length < MAX_PHOTOS - 1 && <PhotoInput icon={ImagePlus} label="Gallery" onFiles={addPhotos} />}
              </>
            )}
          </div>
          {kind === "damage" && photos.length === 0 && (
            <p className="text-xs text-muted-foreground">Photos help the warehouse team assess the damage.</p>
          )}
        </Field>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[440px] border-t bg-card px-4 pt-3 pb-[max(env(safe-area-inset-bottom),14px)]">
        <Button type="submit" size="lg" className="w-full" disabled={submitting || processing}>
          {submitting ? <Loader2 className="animate-spin" /> : null}
          {online ? "Send report" : "Save report"}
        </Button>
      </div>

      <Drawer open={picker === "event"} onOpenChange={(o) => !o && setPicker(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Pick an event</DrawerTitle>
            <DrawerDescription>Events you're assigned to</DrawerDescription>
          </DrawerHeader>
          <ul className="overflow-y-auto px-2 pb-2">
            {mine.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left active:bg-muted"
                  onClick={() => {
                    setEventId(e.id)
                    if (!e.assetCodes.includes(assetCode)) setAssetCode("")
                    setPicker(null)
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{e.couple}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {relativeDay(e.date)} · {e.venue.name}
                      {isClosed(e) && " · done"}
                    </span>
                  </span>
                  {e.id === eventId && <Check className="size-4 text-brand" />}
                </button>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>

      <AssetPicker
        open={picker === "asset"}
        onClose={() => setPicker(null)}
        codes={event?.assetCodes ?? []}
        value={assetCode}
        onPick={(c) => {
          setAssetCode(c)
          setPicker(null)
        }}
      />

      <Dialog open={!!leave} onOpenChange={(o) => !o && setLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard this report?</DialogTitle>
            <DialogDescription>Unsent text and photos will be lost.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Keep writing</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                const go = leave
                setLeave(null)
                go?.()
              }}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string | false
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className={cn(error && "text-destructive")}>{label}</Label>
        {hint && <span className="text-[12px] text-muted-foreground tabular">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}

function PickerButton({
  children,
  invalid,
  ...props
}: React.ComponentProps<"button"> & { invalid?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-14 w-full items-center justify-between gap-3 rounded-md border border-input bg-card px-3.5 py-2 text-left text-sm disabled:text-muted-foreground",
        invalid && "ring-2 ring-destructive"
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

function PhotoInput({
  capture,
  icon: Icon,
  label,
  onFiles,
}: {
  capture?: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  onFiles: (files: FileList | null) => void
}) {
  return (
    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#9ca3af] bg-card text-[12px] font-medium text-muted-foreground active:bg-muted">
      <Icon className="size-5" />
      {label}
      <input
        type="file"
        accept="image/*"
        multiple={!capture}
        capture={capture ? "environment" : undefined}
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </label>
  )
}

function AssetPicker({
  open,
  onClose,
  codes,
  value,
  onPick,
}: {
  open: boolean
  onClose: () => void
  codes: string[]
  value: string
  onPick: (code: string) => void
}) {
  const [q, setQ] = React.useState("")
  const s = q.trim().toLowerCase()
  const assets = codes
    .map((c) => getAsset(c)!)
    .filter((a) => !s || a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s))

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="h-[80dvh]">
        <DrawerHeader>
          <DrawerTitle>Pick an item</DrawerTitle>
        </DrawerHeader>
        <div className="relative px-4 pb-2">
          <Search className="pointer-events-none absolute top-1/2 left-7.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or code" className="pl-10" />
        </div>
        <ul className="flex-1 overflow-y-auto px-2">
          {assets.length === 0 && (
            <li className="py-8 text-center text-sm text-muted-foreground">No items match “{q}”</li>
          )}
          {assets.map((a) => (
            <li key={a.code}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-muted"
                onClick={() => onPick(a.code)}
              >
                <CategoryIcon category={a.category} className="size-9" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{a.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    <span className="font-mono text-[12px]">{a.code}</span> · {a.unit}
                  </span>
                </span>
                {a.code === value && <Check className="size-4 text-brand" />}
              </button>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  )
}

/** Downscale to ~960px JPEG so a few photos fit in localStorage. */
function compressImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 960 / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", 0.72))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}
