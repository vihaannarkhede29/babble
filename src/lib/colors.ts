// colors.ts — One place for the score→colour mapping so the meter, the mouth
// glow, and the vowel-space marker all agree.

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/** 0 (miss) → red, 0.5 → amber, 1 (perfect) → green. `acc` is 0..1. */
export function scoreColor(acc: number): string {
  const hue = Math.round(clamp01(acc) * 130) // 0=red … 130=green
  return `hsl(${hue} 85% 52%)`
}

/** Same ramp, for 0..100 percentages (dashboard). */
export function scoreColorPct(pct: number): string {
  return scoreColor(pct / 100)
}
