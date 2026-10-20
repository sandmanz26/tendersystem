import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-[color,background-color,box-shadow,transform] outline-none select-none active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_1px_2px_oklch(0_0_0/0.2),inset_0_1px_0_oklch(1_0_0/0.12)] hover:bg-primary/90",
        brand: "bg-brand text-white shadow-[0_1px_2px_oklch(0_0_0/0.15),inset_0_1px_0_oklch(1_0_0/0.2)] hover:bg-brand/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "bg-card shadow-soft hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 rounded-lg px-3 text-[13px]",
        lg: "h-13 rounded-2xl px-5 text-[15px]",
        icon: "size-11",
        "icon-sm": "size-9 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
