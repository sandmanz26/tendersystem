import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-[15px] transition-[color,box-shadow] outline-none placeholder:text-muted-foreground/80 focus-visible:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
