import { cn } from "@/lib/utils"

export function SectionLabel({
  children,
  action,
  className,
}: {
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-baseline justify-between px-4 pt-6 pb-2", className)}>
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {children}
      </h2>
      {action}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-full border border-dashed text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="mt-1 text-[13px] text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Label/value row used in detail screens. */
export function InfoRow({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2.5 text-sm", className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}
