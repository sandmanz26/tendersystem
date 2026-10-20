import { useNavigate } from "react-router-dom"
import { ChevronLeft } from "lucide-react"

import { SyncStatus } from "@/components/sync-status"
import { cn } from "@/lib/utils"

export function TopBar({
  title,
  subtitle,
  right,
  back = true,
  onBack,
  large,
  className,
}: {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  right?: React.ReactNode
  back?: boolean | string
  /** Intercept back, e.g. to confirm discarding a draft. */
  onBack?: (go: () => void) => void
  /** Large title layout for tab roots. */
  large?: boolean
  className?: string
}) {
  const navigate = useNavigate()
  const go = () => (typeof back === "string" ? navigate(back) : navigate(-1))

  if (large) {
    return (
      <header className={cn("sticky top-0 z-30 bg-background/85 backdrop-blur-xl", className)}>
        <SyncStatus />
        <div className="flex items-end justify-between gap-3 px-4 pt-5 pb-3">
          <div className="min-w-0">
            {subtitle && <p className="text-[13px] font-medium text-muted-foreground">{subtitle}</p>}
            <h1 className="truncate text-[28px] leading-tight font-bold tracking-tight">{title}</h1>
          </div>
          {right && <div className="flex shrink-0 items-center gap-1.5 pb-1">{right}</div>}
        </div>
      </header>
    )
  }

  return (
    <header className={cn("sticky top-0 z-30 bg-background/85 backdrop-blur-xl", className)}>
      <SyncStatus />
      <div className="flex h-14 items-center gap-2 px-3">
        {back && (
          <button
            type="button"
            aria-label="Kembali"
            onClick={() => (onBack ? onBack(go) : go())}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card shadow-soft active:scale-95"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div className={cn("min-w-0 flex-1", !back && "pl-1")}>
          {title && <div className="truncate text-[15px] font-semibold leading-tight">{title}</div>}
          {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        {right && <div className="flex items-center gap-1.5">{right}</div>}
      </div>
    </header>
  )
}
