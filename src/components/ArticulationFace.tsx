// ArticulationFace.tsx — A zoomed-in, front-view mouth that ANIMATES how to make
// a sound: it springs from a relaxed rest pose into the target articulation and
// back, on a loop, with airflow + tongue cues. Pure procedural SVG (no assets).

import { useEffect, useRef, useState, type ReactElement } from 'react'
import { restArticulation, type Articulation } from '../speech/articulation'

interface Props {
  target: Articulation
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function ArticulationFace({ target }: Props) {
  const [t, setT] = useState(0)
  const phaseRef = useRef(0)

  // Loop: ease in to the target, hold briefly, ease back — so the movement reads.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      phaseRef.current += 0.018
      const c = (1 - Math.cos(phaseRef.current)) / 2 // 0..1..0
      setT(c)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rest = restArticulation()
  const width = lerp(rest.width, target.width, t)
  const open = lerp(rest.open, target.open, t)
  const protrude = lerp(rest.protrude, target.protrude, t)
  const teeth = lerp(rest.teeth, target.teeth, t)

  // --- geometry (front view; mouth centred at 120,88) ---
  const CX = 120
  const CY = 88
  const halfW = 42 + width * 44
  const openH = 6 + open * 62
  const lipBand = 17 - protrude * 4
  const innerRx = Math.max(6, halfW - 8 - protrude * 18)
  const innerRy = openH / 2

  // teeth: gap shrinks as they come together
  const teethGap = innerRy * (1 - teeth * 0.7)
  const upperTeethY = CY - innerRy
  const upperTeethH = teeth > 0.05 ? 6 + teeth * 10 : 0
  const lowerTeethH = teeth > 0.05 ? 6 + teeth * 10 : 0

  // tongue position
  const tongueColor = '#e2728f'
  let tongue: ReactElement | null = null
  if (t > 0.35) {
    if (target.tongue === 'tip-teeth') {
      tongue = <path d={`M ${CX - 12} ${CY} L ${CX} ${CY + 8} L ${CX + 12} ${CY} Z`} fill={tongueColor} />
    } else if (target.tongue === 'tip-up') {
      tongue = <ellipse cx={CX} cy={CY - innerRy + 5} rx={innerRx * 0.5} ry={5} fill={tongueColor} />
    } else if (target.tongue === 'back') {
      tongue = <ellipse cx={CX} cy={CY + innerRy - 4} rx={innerRx * 0.6} ry={6} fill={tongueColor} opacity={0.85} />
    }
  }

  // airflow
  let airflow: ReactElement | null = null
  const flow = ((phaseRef.current * 30) % 20)
  if (target.airflow === 'stream' && t > 0.4) {
    airflow = (
      <g stroke="#a5d8ff" strokeWidth={2.5} strokeLinecap="round" opacity={0.8}>
        {[-10, 0, 10].map((dx, i) => (
          <line key={i} x1={CX + dx} y1={CY + innerRy + 4} x2={CX + dx} y2={CY + innerRy + 22 + (flow % 8)} />
        ))}
      </g>
    )
  } else if (target.airflow === 'burst' && t > 0.6) {
    const r = 6 + (t - 0.6) * 40
    airflow = <circle cx={CX} cy={CY + innerRy + 16} r={r} fill="none" stroke="#a5d8ff" strokeWidth={2} opacity={Math.max(0, 1 - (t - 0.6) * 2.5)} />
  }

  return (
    <svg viewBox="0 0 240 170" className="artic-face" role="img" aria-label={`How to shape your mouth for ${target.label}`}>
      {/* lower face / skin */}
      <rect x="0" y="0" width="240" height="170" rx="20" className="artic-skin" />
      {/* lips (outer band) */}
      <ellipse cx={CX} cy={CY} rx={halfW} ry={openH / 2 + lipBand} className="artic-lip" />
      {protrude > 0.4 && (
        <ellipse cx={CX} cy={CY} rx={halfW - 4} ry={openH / 2 + lipBand - 4} className="artic-lip-rim" />
      )}
      {/* mouth opening */}
      <ellipse cx={CX} cy={CY} rx={innerRx} ry={innerRy} className="artic-mouth" />
      {/* teeth */}
      {upperTeethH > 0 && (
        <rect x={CX - innerRx + 4} y={upperTeethY} width={innerRx * 2 - 8} height={upperTeethH} rx={3} className="artic-teeth" />
      )}
      {lowerTeethH > 0 && (
        <rect x={CX - innerRx + 4} y={CY + teethGap} width={innerRx * 2 - 8} height={lowerTeethH} rx={3} className="artic-teeth" />
      )}
      {tongue}
      {airflow}
    </svg>
  )
}
