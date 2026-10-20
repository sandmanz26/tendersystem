import * as React from "react"

interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike

function getDetectorCtor(): BarcodeDetectorCtor | undefined {
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
}

export const cameraScanSupported =
  typeof window !== "undefined" &&
  !!getDetectorCtor() &&
  !!navigator.mediaDevices?.getUserMedia

/**
 * Streams the rear camera into `videoRef` while `enabled` and calls `onCode`
 * for each QR/barcode found. The same code is ignored for 2.5s so a label held
 * in frame doesn't fire repeatedly.
 */
export function useBarcodeCamera(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onCode: (code: string) => void
) {
  const [error, setError] = React.useState<string | null>(null)
  const onCodeRef = React.useRef(onCode)
  React.useLayoutEffect(() => {
    onCodeRef.current = onCode
  }, [onCode])

  React.useEffect(() => {
    if (!enabled) return
    const Ctor = getDetectorCtor()
    if (!Ctor) return

    let stream: MediaStream | undefined
    let timer: number | undefined
    let stopped = false
    const last = { code: "", at: 0 }
    const detector = new Ctor({ formats: ["qr_code", "code_128", "code_39", "ean_13"] })

    const tick = async () => {
      const video = videoRef.current
      if (stopped || !video) return
      if (video.readyState >= 2) {
        try {
          const found = await detector.detect(video)
          const code = found[0]?.rawValue
          const now = Date.now()
          if (code && (code !== last.code || now - last.at > 2500)) {
            last.code = code
            last.at = now
            onCodeRef.current(code)
          }
        } catch {
          /* a dropped frame is fine */
        }
      }
      timer = window.setTimeout(tick, 250)
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        const video = videoRef.current
        if (video) {
          video.srcObject = s
          video.play().catch(() => {})
        }
        setError(null)
        tick()
      })
      .catch(() => setError("Can't access the camera. Check the browser's camera permission."))

    return () => {
      stopped = true
      window.clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [enabled, videoRef])

  return { error }
}
