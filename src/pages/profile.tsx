import { Link } from "react-router-dom"
import { ChevronRight, LogOut, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { PersonAvatar } from "@/components/person-row"
import { InfoRow, SectionLabel } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { getPerson } from "@/lib/lookup"
import { isClosed } from "@/lib/progress"
import { useAppStore } from "@/store/app-store"

export function ProfilePage() {
  const { userId, events, scans, reports, reset } = useAppStore()
  const me = getPerson(userId)!
  const mine = events.filter((e) => e.crew.some((c) => c.personId === userId))
  const scanCount = Object.values(scans)
    .flatMap((byPhase) => Object.values(byPhase))
    .flatMap((byCode) => Object.values(byCode ?? {}))
    .filter((r) => r.by === userId).length
  const myReports = reports.filter((r) => r.by === userId).length

  return (
    <div>
      <TopBar back={false} title="Profil" />
      <section className="flex items-center gap-4 px-4 pt-6">
        <PersonAvatar person={me} className="size-16 text-lg" />
        <div>
          <h1 className="text-xl font-semibold">{me.name}</h1>
          <p className="text-sm text-muted-foreground">{me.role}</p>
        </div>
      </section>

      <div className="mx-4 mt-5 grid grid-cols-3 divide-x rounded-xl border bg-card text-center">
        {[
          [mine.length, "Event"],
          [scanCount, "Barang discan"],
          [myReports, "Laporan dibuat"],
        ].map(([v, l]) => (
          <div key={l} className="py-3">
            <div className="text-lg font-semibold tabular">{v}</div>
            <div className="text-[11px] text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      <SectionLabel>Akun</SectionLabel>
      <div className="divide-y border-y bg-card px-4">
        <InfoRow label="ID crew">KRU-{userId.toUpperCase()}</InfoRow>
        <InfoRow label="Telepon">{me.phone}</InfoRow>
        <InfoRow label="Tim">Logistik & Gudang</InfoRow>
      </div>

      <SectionLabel>Riwayat event</SectionLabel>
      <ul className="divide-y border-y bg-card">
        {mine
          .filter(isClosed)
          .map((e) => (
            <li key={e.id}>
              <Link to={`/event/${e.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-muted">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-base font-medium">{e.couple}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {e.kind} · {e.venue.name}
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground/60" />
              </Link>
            </li>
          ))}
      </ul>

      <SectionLabel>Demo</SectionLabel>
      <div className="space-y-2 px-4">
        <p className="text-[13px] text-muted-foreground">
          Data tersimpan di browser ini saja. Reset untuk kembali ke data awal.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            reset()
            toast.success("Data demo dikembalikan")
          }}
        >
          <RotateCcw />
          Reset data demo
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => toast("Ini mode demo, tidak ada akun untuk keluar.")}>
          <LogOut />
          Keluar
        </Button>
      </div>
      <p className="px-4 pt-6 pb-4 text-center text-[11px] text-muted-foreground">Kru · v0.1 demo</p>
    </div>
  )
}
