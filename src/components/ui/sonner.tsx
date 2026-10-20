import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      style={
        {
          "--normal-bg": "var(--foreground)",
          "--normal-text": "var(--background)",
          "--normal-border": "transparent",
          "--border-radius": "14px",
        } as React.CSSProperties
      }
      toastOptions={{ className: "!font-sans !text-[13px]" }}
      {...props}
    />
  )
}

export { Toaster }
