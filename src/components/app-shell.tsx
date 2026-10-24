import { NavLink, Outlet, useLocation } from "react-router-dom"
import { CalendarDays, CircleUserRound, ClipboardList, Package, ScanLine } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"

/* Routes that are task screens: no tab bar, full height for the task. */
const FOCUS_ROUTES = [/\/scan\/.+/, /^\/new-report$/]

export function AppShell() {
  const { pathname } = useLocation()
  const focus = FOCUS_ROUTES.some((r) => r.test(pathname))

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background min-[480px]:border-x">
      <main className={cn("flex flex-1 flex-col", !focus && "pb-24")}>
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
  count,
}: {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  end?: boolean
  count?: number
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "relative flex flex-1 flex-col items-center justify-center gap-1 text-[12px] font-medium text-muted-foreground",
          isActive && "text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn("relative flex h-7 w-14 items-center justify-center rounded-md", isActive && "bg-brand-soft")}>
            <Icon className={cn("size-5", isActive && "text-brand")} strokeWidth={1.75} />
            {!!count && (
              <span className="absolute -top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-white tabular">
                {count}
              </span>
            )}
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}

function BottomNav() {
  const { reports, userId } = useAppStore()
  // Count only what needs action from this crew member: open reports others raised.
  const open = reports.filter((r) => r.status === "Open" && r.by !== userId).length
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[440px] border-t bg-card pb-safe">
      <div className="flex h-16 items-stretch px-1">
        <Tab to="/" label="Events" icon={CalendarDays} end />
        <Tab to="/items" label="Items" icon={Package} />
        <Tab to="/scan" label="Scan" icon={ScanLine} />
        <Tab to="/reports" label="Reports" icon={ClipboardList} count={open} />
        <Tab to="/profile" label="Profile" icon={CircleUserRound} />
      </div>
    </nav>
  )
}
