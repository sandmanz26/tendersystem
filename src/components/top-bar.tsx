import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function TopBar({
  title,
  subtitle,
  right,
  back = true,
  className,
}: {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  right?: React.ReactNode
  back?: boolean | string
  className?: string
}) {
  const navigate = useNavigate()
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-1 border-b bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-background/85",
        className
      )}
    >
      {back && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Kembali"
          onClick={() => (typeof back === "string" ? navigate(back) : navigate(-1))}
        >
          <ArrowLeft className="size-5" />
        </Button>
      )}
      <div className={cn("min-w-0 flex-1", !back && "pl-2")}>
        {title && <div className="truncate text-[15px] font-semibold leading-tight">{title}</div>}
        {subtitle && (
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
      {right && <div className="flex items-center gap-1">{right}</div>}
    </header>
  )
}
