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
  titleAs,
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
  /** The bar's title is the screen's h1 unless the page sets its own. */
  titleAs?: "h1" | "p"
  className?: string
}) {
  const Title = titleAs ?? "h1"
  const navigate = useNavigate()
  const go = () => (typeof back === "string" ? navigate(back) : navigate(-1))

  if (large) {
    return (
      <header className={cn("sticky top-0 z-30 bg-background", className)}>
        <SyncStatus />
        <div className="flex items-end justify-between gap-3 px-4 pt-5 pb-3">
          <div className="min-w-0">
            {subtitle && <p className="text-[14px] text-muted-foreground">{subtitle}</p>}
            <Title className="truncate text-[24px] leading-tight font-bold tracking-[-0.01em]">{title}</Title>
          </div>
          {right && <div className="flex shrink-0 items-center gap-1.5 pb-1">{right}</div>}
        </div>
      </header>
    )
  }

  return (
    <header className={cn("sticky top-0 z-30 border-b bg-background", className)}>
      <SyncStatus />
      <div className="flex h-14 items-center gap-2 px-3">
        {back && (
          <button
            type="button"
            aria-label="Back"
            onClick={() => (onBack ? onBack(go) : go())}
            className="flex size-10 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-secondary active:translate-y-px"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div className={cn("min-w-0 flex-1", !back && "pl-1")}>
          {title && <Title className="truncate text-[16px] font-semibold leading-tight">{title}</Title>}
          {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        {right && <div className="flex items-center gap-1.5">{right}</div>}
      </div>
    </header>
  )
}
