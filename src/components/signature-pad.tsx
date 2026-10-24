import * as React from "react"
import { Eraser } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Finger signature on a canvas. Emits a PNG data URL, or null when cleared. */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const drawing = React.useRef(false)
  const strokes = React.useRef(0)
  const [empty, setEmpty] = React.useState(true)

  React.useEffect(() => {
    const canvas = canvasRef.current!
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext("2d")!
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#1c1d22"
  }, [])

  const point = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top] as const
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-md border border-input bg-card">
        <canvas
          ref={canvasRef}
          data-vaul-no-drag
          className="block h-36 w-full touch-none"
          aria-label="Signature area"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            drawing.current = true
            const ctx = canvasRef.current!.getContext("2d")!
            const [x, y] = point(e)
            ctx.beginPath()
            ctx.moveTo(x, y)
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            const ctx = canvasRef.current!.getContext("2d")!
            const [x, y] = point(e)
            ctx.lineTo(x, y)
            ctx.stroke()
            strokes.current++
          }}
          onPointerUp={() => {
            drawing.current = false
            // Ignore taps/dots: a real signature has some length.
            if (strokes.current > 8) {
              setEmpty(false)
              onChange(canvasRef.current!.toDataURL("image/png"))
            }
          }}
        />
        <div className="pointer-events-none absolute inset-x-5 bottom-8 border-b border-dashed border-border" />
        {empty && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] text-muted-foreground">
            Sign here
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-1 text-muted-foreground"
        disabled={empty}
        onClick={() => {
          const c = canvasRef.current!
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height)
          strokes.current = 0
          setEmpty(true)
          onChange(null)
        }}
      >
        <Eraser />
        Clear
      </Button>
    </div>
  )
}
