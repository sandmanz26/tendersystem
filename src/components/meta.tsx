import { cn } from "@/lib/utils"

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>

/** An icon standing in for a label: "06:00" next to a clock reads faster than "Call time 06:00". */
export function Meta({
  icon: Icon,
  children,
  label,
  className,
}: {
  icon: IconType
  children: React.ReactNode
  /** Spoken label for screen readers, since the icon replaces the visible word. */
  label?: string
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap tabular", className)}>
      <Icon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      {label && <span className="sr-only">{label}</span>}
      {children}
    </span>
  )
}

/** A row of inline metas separated by space, wrapping as a unit. */
export function MetaRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground", className)}>{children}</div>
}
