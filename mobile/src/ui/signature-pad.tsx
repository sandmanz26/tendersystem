import { Eraser } from "lucide-react-native"
import * as React from "react"
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native"
import Svg, { Path } from "react-native-svg"

import { color, font, radius } from "../theme"

export interface Signature {
  /** SVG path data, stored with the phase log as proof of handover. */
  path: string
  width: number
  height: number
}

/**
 * Finger signature drawn with react-native-svg. Emits the path once the
 * stroke is long enough to be a signature, or null when cleared.
 */
export function SignaturePad({ onChange, onDrawingChange }: { onChange: (sig: Signature | null) => void; onDrawingChange?: (drawing: boolean) => void }) {
  const [paths, setPaths] = React.useState<string[]>([])
  const current = React.useRef("")
  const points = React.useRef(0)
  const size = React.useRef({ width: 0, height: 0 })
  const [, redraw] = React.useReducer((x: number) => x + 1, 0)

  const responder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Keep the gesture: a parent ScrollView or sheet must not steal it mid-signature.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          onDrawingChange?.(true)
          const { locationX: x, locationY: y } = e.nativeEvent
          current.current = `M${x.toFixed(1)},${y.toFixed(1)}`
          redraw()
        },
        onPanResponderMove: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent
          current.current += ` L${x.toFixed(1)},${y.toFixed(1)}`
          points.current += 1
          redraw()
        },
        onPanResponderRelease: () => {
          onDrawingChange?.(false)
          setPaths((p) => {
            const next = [...p, current.current]
            current.current = ""
            // Ignore taps and dots: a real signature has some length.
            if (points.current > 8) onChange({ path: next.join(" "), ...size.current })
            return next
          })
        },
      }),
    [onChange, onDrawingChange]
  )

  const empty = paths.length === 0 && !current.current
  return (
    <View>
      <View
        style={styles.pad}
        onLayout={(e) => (size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        accessibilityLabel="Signature area"
        {...responder.panHandlers}
      >
        <Svg width="100%" height="100%">
          {[...paths, current.current].filter(Boolean).map((d, i) => (
            <Path key={i} d={d} stroke={color.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
        <View pointerEvents="none" style={styles.line} />
        {empty && (
          <View pointerEvents="none" style={styles.hint}>
            <Text style={styles.hintText}>Sign here</Text>
          </View>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={empty}
        onPress={() => {
          setPaths([])
          points.current = 0
          onChange(null)
        }}
        style={styles.clear}
      >
        <Eraser size={16} color={empty ? color.faint : color.muted} />
        <Text style={{ color: empty ? color.faint : color.muted, fontSize: font.small }}>Clear</Text>
      </Pressable>
    </View>
  )
}

/** Renders a stored signature small, e.g. in the phase history. */
export function SignaturePreview({ path, size }: { path: string; size?: { width: number; height: number } }) {
  return (
    <View style={{ width: 64, height: 32, borderRadius: radius.control, backgroundColor: color.raised }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${size?.width || 300} ${size?.height || 140}`}>
        <Path d={path} stroke={color.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  pad: {
    height: 140,
    borderWidth: 1,
    borderColor: color.control,
    borderRadius: radius.control,
    backgroundColor: color.surface,
    overflow: "hidden",
  },
  line: { position: "absolute", left: 20, right: 20, bottom: 32, borderBottomWidth: 1, borderStyle: "dashed", borderColor: color.border },
  hint: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  hintText: { color: color.muted, fontSize: font.small },
  clear: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 8 },
})
