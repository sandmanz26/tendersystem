import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Camera, Check, ChevronDown, ImagePlus, PackageX, Search, TriangleAlert, X } from "lucide-react"
import { toast } from "sonner"

import { CategoryIcon } from "@/components/category-icon"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
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
import type { ReportKind, Severity } from "@/data/types"
import { relativeDay } from "@/lib/format"
import { getAsset } from "@/lib/lookup"
import { isClosed } from "@/lib/progress"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"

const ISSUE_CATEGORIES = ["Venue", "Vendor", "Transport", "Klien", "Crew", "Keamanan", "Lainnya"]
const DAMAGE_TYPES = ["Rusak ringan", "Rusak berat", "Hilang", "Jumlah kurang"]
const SEVERITIES: Severity[] = ["Rendah", "Sedang", "Tinggi"]
const MAX_PHOTOS = 4

export function ReportNewPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { events, userId, addReport } = useAppStore()

  const mine = events
    .filter((e) => e.crew.some((c) => c.personId === userId))
    .sort((a, b) => Number(isClosed(a)) - Number(isClosed(b)) || a.date.localeCompare(b.date))

  const [kind, setKind] = React.useState<ReportKind>(
    params.get("type") === "damage" ? "damage" : "issue"
  )
  const [eventId, setEventId] = React.useState(params.get("event") ?? mine.find((e) => !isClosed(e))?.id ?? "")
  const [assetCode, setAssetCode] = React.useState(params.get("asset") ?? "")
  const [category, setCategory] = React.useState("")
  const [severity, setSeverity] = React.useState<Severity>("Sedang")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [photos, setPhotos] = React.useState<string[]>([])
  const [picker, setPicker] = React.useState<"event" | "asset" | null>(null)
  const [submitted, setSubmitted] = React.useState(false)

  const event = events.find((e) => e.id === eventId)
  const asset = assetCode ? getAsset(assetCode) : undefined

  const autoTitle = kind === "damage" && asset && category ? `${asset.name} · ${category.toLowerCase()}` : ""
  const errors = {
    event: !event,
    asset: kind === "damage" && !asset,
    category: !category,
    title: !(title.trim() || autoTitle),
    description: description.trim().length < 5,
  }
  const valid = !Object.values(errors).some(Boolean)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!valid) {
      toast.error("Lengkapi dulu yang ditandai merah")
      return
    }
    const report = addReport({
      eventId,
      kind,
      category,
      assetCode: kind === "damage" ? assetCode : undefined,
      severity,
      title: title.trim() || autoTitle,
      description: description.trim(),
      photos,
    })
    toast.success(`Laporan ${report.id} terkirim ke koordinator`)
    navigate(`/laporan/${report.id}`, { replace: true })
  }

  const addPhotos = async (files: FileList | null) => {
    if (!files) return
    const room = MAX_PHOTOS - photos.length
    const next = await Promise.all(Array.from(files).slice(0, room).map(compressImage))
    setPhotos((p) => [...p, ...next.filter((x): x is string => !!x)])
  }

  const err = (k: keyof typeof errors) => submitted && errors[k]

  return (
    <form onSubmit={submit} className="flex min-h-dvh flex-col">
      <TopBar title="Buat laporan" subtitle="Langsung diteruskan ke koordinator lapangan" />

      <div className="flex-1 space-y-6 px-4 pt-5 pb-28">
        {/* Kind */}
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["issue", "Masalah lapangan", "Venue, vendor, transport…", TriangleAlert],
              ["damage", "Barang rusak", "Rusak, hilang, kurang", PackageX],
            ] as const
          ).map(([value, label, hint, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setKind(value)
                setCategory("")
              }}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left transition-colors",
                kind === value && "border-foreground ring-1 ring-foreground"
              )}
            >
              <Icon className={cn("size-5", value === "damage" ? "text-clay" : "text-muted-foreground")} />
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
            </button>
          ))}
        </div>

        <Field label="Event" error={err("event") && "Pilih event"}>
          <PickerButton onClick={() => setPicker("event")} invalid={err("event")}>
            {event ? (
              <span className="min-w-0">
                <span className="block truncate font-medium">{event.couple}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {relativeDay(event.date)} · {event.venue.name}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Pilih event</span>
            )}
          </PickerButton>
        </Field>

        {kind === "damage" && (
          <Field label="Barang" error={err("asset") && "Pilih barang yang bermasalah"}>
            <PickerButton onClick={() => setPicker("asset")} disabled={!event} invalid={err("asset")}>
              {asset ? (
                <span className="flex min-w-0 items-center gap-3">
                  <CategoryIcon category={asset.category} className="size-8" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{asset.name}</span>
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">
                      {asset.code}
                    </span>
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">Pilih dari daftar barang event</span>
              )}
            </PickerButton>
          </Field>
        )}

        <Field
          label={kind === "damage" ? "Kondisi" : "Kategori"}
          error={err("category") && "Pilih salah satu"}
        >
          <ToggleGroup type="single" value={category} onValueChange={(v) => v && setCategory(v)}>
            {(kind === "damage" ? DAMAGE_TYPES : ISSUE_CATEGORIES).map((c) => (
              <ToggleGroupItem key={c} value={c}>
                {c}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field label="Urgensi">
          <div className="grid grid-cols-3 overflow-hidden rounded-lg border bg-card">
            {SEVERITIES.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 text-[13px] font-medium",
                  i > 0 && "border-l",
                  severity === s && "bg-foreground text-background"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    s === "Rendah" && "bg-muted-foreground/50",
                    s === "Sedang" && "bg-warning",
                    s === "Tinggi" && "bg-destructive"
                  )}
                />
                {s}
              </button>
            ))}
          </div>
          {severity === "Tinggi" && (
            <p className="text-xs text-destructive">
              Urgensi tinggi: setelah kirim, telepon juga koordinator.
            </p>
          )}
        </Field>

        <Field label="Judul singkat" error={err("title") && "Isi judul"}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={autoTitle || "Mis. Listrik panggung mati"}
            aria-invalid={err("title") || undefined}
          />
        </Field>

        <Field label="Apa yang terjadi?" error={err("description") && "Ceritakan singkat (min. 5 huruf)"}>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Lokasi, kronologi, dan apa yang sudah kamu lakukan."
            aria-invalid={err("description") || undefined}
          />
        </Field>

        <Field label={`Foto (${photos.length}/${MAX_PHOTOS})`}>
          <div className="grid grid-cols-4 gap-2">
            {photos.map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
                <img src={src} alt={`Foto ${i + 1}`} className="size-full object-cover" />
                <button
                  type="button"
                  aria-label="Hapus foto"
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <>
                <PhotoInput capture icon={Camera} label="Kamera" onFiles={addPhotos} />
                {photos.length < MAX_PHOTOS - 1 && (
                  <PhotoInput icon={ImagePlus} label="Galeri" onFiles={addPhotos} />
                )}
              </>
            )}
          </div>
        </Field>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[440px] border-t bg-card/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur">
        <Button type="submit" size="lg" className="w-full">
          Kirim laporan
        </Button>
      </div>

      <Drawer open={picker === "event"} onOpenChange={(o) => !o && setPicker(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Pilih event</DrawerTitle>
            <DrawerDescription>Event yang kamu ikuti</DrawerDescription>
          </DrawerHeader>
          <ul className="overflow-y-auto pb-2">
            {mine.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted"
                  onClick={() => {
                    setEventId(e.id)
                    if (!e.assetCodes.includes(assetCode)) setAssetCode("")
                    setPicker(null)
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-[17px] font-medium">{e.couple}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {relativeDay(e.date)} · {e.venue.name}
                      {isClosed(e) && " · selesai"}
                    </span>
                  </span>
                  {e.id === eventId && <Check className="size-4" />}
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
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string | false
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className={cn(error && "text-destructive")}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
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
        "flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm disabled:opacity-50",
        invalid && "border-destructive"
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
    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-card text-[11px] text-muted-foreground active:bg-muted">
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
          <DrawerTitle>Pilih barang</DrawerTitle>
        </DrawerHeader>
        <div className="relative px-4 pb-2">
          <Search className="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau kode" className="pl-9" />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {assets.map((a) => (
            <li key={a.code}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-muted"
                onClick={() => onPick(a.code)}
              >
                <CategoryIcon category={a.category} className="size-9" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{a.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    <span className="font-mono text-[11px]">{a.code}</span> · {a.unit}
                  </span>
                </span>
                {a.code === value && <Check className="size-4" />}
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
