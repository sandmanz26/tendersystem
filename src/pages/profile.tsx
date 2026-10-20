import * as React from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Cloud, CloudOff, LogOut, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { PersonAvatar } from "@/components/person-row"
import { InfoRow, SectionLabel } from "@/components/section"
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
import { stamp } from "@/lib/format"
import { getPerson } from "@/lib/lookup"
import { isClosed } from "@/lib/progress"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"

export function ProfilePage() {
  const { userId, events, scans, reports, reset, forceOffline, setForceOffline, online, pendingSync, lastSyncAt } =
    useAppStore()
  const [confirmReset, setConfirmReset] = React.useState(false)
  const me = getPerson(userId)!
  const mine = events.filter((e) => e.crew.some((c) => c.personId === userId))
  const scanCount = Object.values(scans)
    .flatMap((byPhase) => Object.values(byPhase))
    .flatMap((byCode) => Object.values(byCode ?? {}))
    .filter((r) => r.by === userId).length
  const myReports = reports.filter((r) => r.by === userId).length
  const closed = mine.filter(isClosed)

  return (
    <div>
      <TopBar large back={false} title="Profil" />

      <section className="mx-4 rounded-3xl bg-card p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <PersonAvatar person={me} className="size-16 text-lg" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">{me.name}</h1>
            <p className="text-sm text-muted-foreground">{me.role}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            [mine.length, "Event"],
            [scanCount, "Scan"],
            [myReports, "Laporan"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-secondary py-3">
              <div className="text-xl font-bold tabular">{v}</div>
              <div className="text-[11px] text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <SectionLabel>Sinkronisasi</SectionLabel>
      <div className="list-card">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-xl",
              online ? "bg-accent text-accent-foreground" : "bg-warning/15 text-[oklch(0.5_0.1_60)]"
            )}
          >
            {online ? <Cloud className="size-[18px]" /> : <CloudOff className="size-[18px]" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{online ? "Online" : "Offline"}</p>
            <p className="text-xs text-muted-foreground">
              {pendingSync > 0 ? `${pendingSync} data menunggu dikirim` : `Tersinkron ${stamp(lastSyncAt)}`}
            </p>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Simulasi tanpa sinyal</p>
            <p className="text-xs text-muted-foreground">
              Coba scan & lapor seperti di venue tanpa sinyal. Data dikirim saat dimatikan.
            </p>
          </div>
          <Switch checked={forceOffline} onChange={setForceOffline} />
        </label>
      </div>

      <SectionLabel>Akun</SectionLabel>
      <div className="list-card">
        <InfoRow label="ID crew">KRU-{userId.toUpperCase()}</InfoRow>
        <InfoRow label="Telepon">{me.phone}</InfoRow>
        <InfoRow label="Tim">Logistik & Gudang</InfoRow>
      </div>

      {closed.length > 0 && (
        <>
          <SectionLabel>Riwayat event</SectionLabel>
          <ul className="list-card">
            {closed.map((e) => (
              <li key={e.id}>
                <Link to={`/event/${e.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-muted">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{e.couple}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {e.kind} · {e.venue.name}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground/50" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <SectionLabel>Demo</SectionLabel>
      <div className="space-y-2 px-4">
        <Button variant="outline" className="w-full" onClick={() => setConfirmReset(true)}>
          <RotateCcw />
          Reset data demo
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() =>
            pendingSync > 0
              ? toast.error(`Masih ada ${pendingSync} data belum terkirim. Tunggu online dulu sebelum keluar.`)
              : toast("Ini mode demo, tidak ada akun untuk keluar.")
          }
        >
          <LogOut />
          Keluar
        </Button>
      </div>
      <p className="px-4 pt-6 pb-4 text-center text-[11px] text-muted-foreground">Kru · v0.2 demo</p>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset data demo?</DialogTitle>
            <DialogDescription>
              Semua scan, laporan, dan tanda tangan yang kamu buat akan hilang dan kembali ke data awal.
              {pendingSync > 0 && ` ${pendingSync} data belum terkirim juga ikut terhapus.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Batal</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                reset()
                setConfirmReset(false)
                toast.success("Data demo dikembalikan")
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? "bg-brand" : "bg-input"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5"
        )}
      />
    </button>
  )
}
