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
    <div className={cn("flex items-center justify-between px-4 pt-6 pb-2", className)}>
      <h2 className="text-[15px] font-semibold text-foreground">{children}</h2>
      {action}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center px-8 py-12 text-center", className)}>
      <Icon className="mb-3 size-6 text-muted-foreground" />
      <p className="text-[15px] font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-[260px] text-[13px] text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
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
    <div className={cn("flex items-start justify-between gap-4 px-4 py-3 text-sm", className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}

/** Coloured callout for warnings/tips inside a page. */
export function Callout({
  icon: Icon,
  tone = "warning",
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  tone?: "warning" | "info" | "danger" | "success"
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl px-3.5 py-3 text-[14px] leading-snug",
        tone === "warning" && "border border-[#fde68a] bg-pill-warning text-pill-warning-ink",
        tone === "info" && "bg-secondary text-foreground",
        tone === "danger" && "bg-pill-negative text-pill-negative-ink",
        tone === "success" && "bg-brand-soft text-brand-ink",
        className
      )}
    >
      <Icon className="mt-px size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
