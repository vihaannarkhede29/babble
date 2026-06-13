import { motion } from 'framer-motion'

export type DragonState =
  | 'idle'
  | 'listening'
  | 'celebrating'
  | 'confused'
  | 'demonstrating'
  | 'waving'

interface DragonCompanionProps {
  state: DragonState
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'h-20 w-20',
  md: 'h-28 w-28',
  lg: 'h-40 w-40',
  xl: 'h-52 w-52',
}

const palette = {
  body: '#EF5350',
  belly: '#FFAB91',
  outline: '#C62828',
  horn: '#FFD166',
  beak: '#FF9600',
  mouth: '#D84315',
  foot: '#FF9600',
  eye: '#5D2E2E',
  sparkle: '#FFD166',
}

function DragonSvg({ state }: { state: DragonState }) {
  const mouthOpen = state === 'demonstrating' || state === 'celebrating'
  const confused = state === 'confused'
  const celebrating = state === 'celebrating'
  const listening = state === 'listening'
  const waving = state === 'waving'

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <ellipse cx="60" cy="108" rx="30" ry="6" fill="rgba(27,58,45,0.12)" />

      {/* Torso + left wing — wing stub grows from the body edge, not a separate limb */}
      <path
        d="M34 28 C30 22 32 16 38 18 C42 20 44 24 46 26
           C48 22 52 18 58 18 C64 18 68 22 70 26
           C72 24 74 20 78 18 C84 16 86 22 82 28
           L74 40 L74 58 L76 90 Q60 100 44 90
           L46 58 L32 52 L44 40 Z"
        fill={palette.body}
      />

      {/* Right wing — same fill, flush at shoulder; animates for wave */}
      {waving ? (
        <motion.path
          d="M74 40 L92 48 L78 56 L74 58 Z"
          fill={palette.body}
          animate={{ rotate: [0, 18, -6, 18, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          style={{ originX: '74px', originY: '49px' }}
        />
      ) : (
        <path d="M74 40 L92 48 L78 56 L74 58 Z" fill={palette.body} />
      )}

      {/* Belly / face mask */}
      <path
        d="M44 34 Q60 28 76 34 Q82 48 78 62 Q60 72 42 62 Q38 48 44 34 Z"
        fill={palette.belly}
      />

      {/* Horns */}
      <path d="M50 22 L54 12 L58 22 Z" fill={palette.horn} />
      <path d="M62 22 L66 12 L70 22 Z" fill={palette.horn} />

      {celebrating && (
        <>
          <path d="M18 38 L14 24 M14 38 L18 24" stroke={palette.sparkle} strokeWidth="3" strokeLinecap="round" />
          <path d="M102 38 L106 24 M106 38 L102 24" stroke={palette.sparkle} strokeWidth="3" strokeLinecap="round" />
          <circle cx="14" cy="56" r="3" fill={palette.sparkle} />
          <circle cx="106" cy="56" r="3" fill={palette.sparkle} />
        </>
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

export function DragonCompanion({ state, size = 'md', className = '' }: DragonCompanionProps) {
  const baseAnimate =
    state === 'idle'
      ? { y: [0, -4, 0] }
      : state === 'waving'
        ? { y: [0, -3, 0] }
        : state === 'listening'
          ? { y: [0, -2, 0], scale: [1, 1.03, 1] }
          : state === 'celebrating'
            ? { y: [0, -12, 0], rotate: [-3, 3, -3, 0] }
            : state === 'confused'
              ? { rotate: [0, -8, 8, -4, 0] }
              : { y: [0, -3, 0] }

  const baseTransition =
    state === 'idle'
      ? { repeat: Infinity, duration: 2.5 }
      : state === 'waving'
        ? { repeat: Infinity, duration: 2 }
        : state === 'listening'
          ? { repeat: Infinity, duration: 1.2 }
          : state === 'celebrating'
            ? { repeat: Infinity, duration: 0.8 }
            : state === 'confused'
              ? { duration: 0.6 }
              : { repeat: Infinity, duration: 1.5 }

  return (
    <motion.div
      className={`${sizeMap[size]} ${className}`}
      key={state}
      initial={{ opacity: 0.6, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1, ...baseAnimate }}
      transition={baseTransition}
    >
      <DragonSvg state={state} />
    </motion.div>
  )
}
