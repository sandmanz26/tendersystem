import * as React from "react"

/** Re-render once a minute so "in x min" and "Now" stay honest. */
export function useMinuteTick() {
  const [, tick] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    const t = setInterval(tick, 60_000)
    return () => clearInterval(t)
  }, [])
}
