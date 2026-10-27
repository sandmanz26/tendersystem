import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>

export interface Action {
  icon: IconType
  label: string
  to?: string
  href?: string
  onClick?: () => void
  /** The one action the screen exists for: filled with the hue. */
  primary?: boolean
  disabled?: boolean
}

/**
 * The frequent jobs as thumb-sized buttons, icon over a one-word label.
 * Replaces scattered text links so the common job is one tap away.
 */
export function ActionBar({ actions, className }: { actions: Action[]; className?: string }) {
  return (
    <div className={cn("grid gap-2", className)} style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
      {actions.map((a) => {
        const cls = cn(
          "flex h-16 flex-col items-center justify-center gap-1 rounded-xl border text-[13px] font-medium transition-[background-color] active:translate-y-px",
          a.primary ? "border-brand bg-brand text-white hover:bg-brand/90" : "border-border bg-card hover:bg-secondary",
          a.disabled && "pointer-events-none border-border bg-secondary text-muted-foreground"
        )
        const inner = (
          <>
            <a.icon className="size-5" strokeWidth={1.75} />
            {a.label}
          </>
        )
        if (a.to) return <Link key={a.label} to={a.to} className={cls} aria-disabled={a.disabled}>{inner}</Link>
        if (a.href)
          return (
            <a key={a.label} href={a.href} className={cls} target={a.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {inner}
            </a>
          )
        return (
          <button key={a.label} type="button" onClick={a.onClick} className={cls} disabled={a.disabled}>
            {inner}
          </button>
        )
      })}
    </div>
  )
}
