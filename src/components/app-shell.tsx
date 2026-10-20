import { NavLink, Outlet, useLocation } from "react-router-dom"
import { CalendarDays, CircleUserRound, ClipboardList, Package, ScanLine } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"

/* Routes that are task screens: no tab bar, full height for the task. */
const FOCUS_ROUTES = [/\/scan\/.+/, /^\/lapor$/]

export function AppShell() {
  const { pathname } = useLocation()
  const focus = FOCUS_ROUTES.some((r) => r.test(pathname))

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background min-[480px]:shadow-[0_0_0_1px_oklch(0_0_0/0.04),0_30px_80px_-30px_oklch(0_0_0/0.25)]">
      <main key={pathname} className={cn("flex flex-1 animate-page flex-col", !focus && "pb-28")}>
        <Outlet />
      </main>
      {!focus && <BottomNav />}
    </div>
  )
}

function Tab({
  to,
  label,
  icon: Icon,
  end,
  dot,
}: {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  end?: boolean
  dot?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold text-muted-foreground transition-colors",
          isActive && "text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="size-[22px]" strokeWidth={isActive ? 2.2 : 1.7} />
          {label}
          {dot && <span className="absolute top-2 right-[calc(50%-16px)] size-2 rounded-full bg-destructive ring-2 ring-card" />}
        </>
      )}
    </NavLink>
  )
}

function BottomNav() {
  const { reports, userId } = useAppStore()
  const hasOpen = reports.some((r) => r.status === "Terbuka" && r.by !== userId)
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[440px] px-3 pb-[max(env(safe-area-inset-bottom),12px)]">
      <div className="flex h-16 items-center rounded-[22px] bg-card/90 px-1 shadow-[0_0_0_1px_oklch(0_0_0/0.05),0_10px_30px_-8px_oklch(0_0_0/0.2)] backdrop-blur-xl">
        <Tab to="/" label="Event" icon={CalendarDays} end />
        <Tab to="/barang" label="Barang" icon={Package} />
        <NavLink
          to="/scan"
          aria-label="Scan"
          className={({ isActive }) =>
            cn(
              "mx-1 flex size-14 -translate-y-3 items-center justify-center rounded-full bg-ink text-white shadow-[0_8px_20px_-6px_oklch(0_0_0/0.5)] ring-4 ring-background transition-transform active:scale-95",
              isActive && "bg-brand"
            )
          }
        >
          <ScanLine className="size-6" strokeWidth={2.2} />
        </NavLink>
        <Tab to="/laporan" label="Laporan" icon={ClipboardList} dot={hasOpen} />
        <Tab to="/profil" label="Profil" icon={CircleUserRound} />
      </div>
    </nav>
  )
}
