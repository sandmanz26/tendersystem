import { NavLink, Outlet, useLocation } from "react-router-dom"
import { CalendarDays, CircleUserRound, ClipboardList, ScanLine } from "lucide-react"

import { cn } from "@/lib/utils"

const NAV = [
  { to: "/", label: "Event", icon: CalendarDays, end: true },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/laporan", label: "Laporan", icon: ClipboardList },
  { to: "/profil", label: "Profil", icon: CircleUserRound },
]

/* Routes that are task screens: no tab bar, full height for the task. */
const FOCUS_ROUTES = [/\/scan\/.+/, /^\/lapor/]

export function AppShell() {
  const { pathname } = useLocation()
  const focus = FOCUS_ROUTES.some((r) => r.test(pathname))

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background min-[480px]:border-x min-[480px]:shadow-[0_0_0_1px_oklch(0_0_0/0.02),0_20px_60px_-20px_oklch(0_0_0/0.15)]">
      <main className={cn("flex flex-1 flex-col", !focus && "pb-20")}>
        <Outlet />
      </main>
      {!focus && <BottomNav />}
    </div>
  )
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[440px] border-t bg-card/95 pb-safe backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <ul className="grid h-16 grid-cols-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors",
                  isActive && "text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Icon className="size-[19px]" strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
