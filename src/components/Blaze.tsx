// Blaze.tsx — The dragon companion, ported from the partner shell.
//
// Their version leaned on Tailwind sizing + Framer Motion; we keep the (nice)
// hand-drawn SVG and drive every animation with CSS classes instead, so the port
// adds no new dependencies. State changes the face (eyes / mouth / sparkles); the
// wrapper class drives the body motion (idle bob, listening pulse, celebrate
// bounce, confused shake, wave).

export type BlazeState =
  | 'idle'
  | 'listening'
  | 'celebrating'
  | 'confused'
  | 'demonstrating'
  | 'waving'

interface Props {
  state: BlazeState
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Adds a warm glow whose intensity tracks this 0..1 value (e.g. Blaze's energy). */
  glow?: number
  className?: string
}

const palette = {
  body: '#EF5350',
  belly: '#FFAB91',
  horn: '#FFD166',
  beak: '#FF9600',
  mouth: '#D84315',
  foot: '#FF9600',
  eye: '#5D2E2E',
  sparkle: '#FFD166',
}

function BlazeSvg({ state }: { state: BlazeState }) {
  const mouthOpen = state === 'demonstrating' || state === 'celebrating'
  const confused = state === 'confused'
  const celebrating = state === 'celebrating'
  const listening = state === 'listening'
  const waving = state === 'waving'

  return (
    <svg viewBox="0 0 120 120" className="blaze-svg" aria-hidden="true">
      <ellipse cx="60" cy="108" rx="30" ry="6" fill="rgba(27,58,45,0.12)" />

      {/* Torso */}
      <path
        d="M34 28 C30 22 32 16 38 18 C42 20 44 24 46 26
           C48 22 52 18 58 18 C64 18 68 22 70 26
           C72 24 74 20 78 18 C84 16 86 22 82 28
           L74 40 L74 58 L76 90 Q60 100 44 90
           L46 58 L32 52 L44 40 Z"
        fill={palette.body}
      />

      {/* Right wing — animates for the wave */}
      <path
        className={waving ? 'blaze-wing blaze-wing--wave' : 'blaze-wing'}
        d="M74 40 L92 48 L78 56 L74 58 Z"
        fill={palette.body}
      />

      {/* Belly / face mask */}
      <path d="M44 34 Q60 28 76 34 Q82 48 78 62 Q60 72 42 62 Q38 48 44 34 Z" fill={palette.belly} />

      {/* Horns */}
      <path d="M50 22 L54 12 L58 22 Z" fill={palette.horn} />
      <path d="M62 22 L66 12 L70 22 Z" fill={palette.horn} />

      {celebrating && (
        <g className="blaze-sparkles">
          <path d="M18 38 L14 24 M14 38 L18 24" stroke={palette.sparkle} strokeWidth="3" strokeLinecap="round" />
          <path d="M102 38 L106 24 M106 38 L102 24" stroke={palette.sparkle} strokeWidth="3" strokeLinecap="round" />
          <circle cx="14" cy="56" r="3" fill={palette.sparkle} />
          <circle cx="106" cy="56" r="3" fill={palette.sparkle} />
        </g>
      )}

      {/* Eyes */}
      {listening ? (
        <>
          <ellipse cx="48" cy="46" rx="7" ry="9" fill="white" />
          <ellipse cx="72" cy="46" rx="7" ry="9" fill="white" />
          <circle cx="48" cy="48" r="3.5" fill={palette.eye} />
          <circle cx="72" cy="48" r="3.5" fill={palette.eye} />
          <circle cx="49.5" cy="46.5" r="1.2" fill="white" />
          <circle cx="73.5" cy="46.5" r="1.2" fill="white" />
        </>
      ) : confused ? (
        <>
          <path d="M42 46 Q48 42 54 46" stroke={palette.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="72" cy="44" r="5" fill="white" />
          <circle cx="72" cy="45" r="2.5" fill={palette.eye} />
          <path d="M66 36 Q72 32 78 36" stroke={palette.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M42 46 Q48 50 54 46" stroke={palette.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M66 46 Q72 50 78 46" stroke={palette.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Beak / mouth */}
      {mouthOpen ? (
        <>
          <path d="M54 58 L60 72 L66 58 Z" fill={palette.beak} />
          <path d="M56 60 L60 68 L64 60 Z" fill={palette.mouth} />
        </>
      ) : (
        <>
          <path d="M56 58 L60 66 L64 58 Z" fill={palette.beak} />
          <path d="M54 66 Q60 69 66 66" stroke={palette.eye} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Feet */}
      <ellipse cx="48" cy="98" rx="9" ry="5" fill={palette.foot} />
      <ellipse cx="68" cy="98" rx="9" ry="5" fill={palette.foot} />
    </svg>
  )
}

export function Blaze({ state, size = 'md', glow, className = '' }: Props) {
  const glowStyle =
    glow && glow > 0
      ? {
          filter: `drop-shadow(0 0 ${6 + glow * 22}px rgba(255,150,0,${0.25 + glow * 0.5}))`,
        }
      : undefined
  return (
    <div
      className={`blaze blaze--${size} blaze--${state} ${className}`}
      style={glowStyle}
      // key forces the entry pop on each state change
      key={state}
    >
      <BlazeSvg state={state} />
    </div>
  )
}
