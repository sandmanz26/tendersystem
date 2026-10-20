import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xl border border-transparent bg-card shadow-soft px-3 text-[15px] transition-[color,box-shadow] outline-none placeholder:text-muted-foreground/80 focus-visible:border-brand/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
