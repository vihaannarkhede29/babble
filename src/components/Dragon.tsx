// Dragon.tsx — "Sparky", the companion who learns alongside the child.
//
// The dragon is drawn in SVG so it can react in real time: its mouth opens with
// the child's voice (mimicry), it bounces on success and wobbles when a sound
// is tricky. The collaborative framing — Sparky struggles too — is what turns a
// missed attempt from "I failed" into "we're figuring this out together".

interface Props {
  line: string
  mood: 'idle' | 'listening' | 'happy' | 'sad'
  /** 0..1 — how wide Sparky opens his mouth (mirrors the child). */
  mouthOpen?: number
}

export function Dragon({ line, mood, mouthOpen = 0 }: Props) {
  const open = Math.max(0, Math.min(1, mouthOpen))
  const mouthH = 4 + open * 22
  const happy = mood === 'happy'

  return (
    <div className={`dragon dragon--${mood}`}>
      <div className="speech-bubble" role="status" aria-live="polite">
        {line}
      </div>
      <svg viewBox="0 0 180 180" className="dragon-svg" aria-hidden="true">
        {/* wing */}
        <path d="M 30 96 Q 0 70 14 120 Q 26 116 44 110 Z" className="dragon-wing" />
        {/* body */}
        <ellipse cx="92" cy="120" rx="54" ry="46" className="dragon-body" />
        <ellipse cx="92" cy="132" rx="30" ry="26" className="dragon-belly" />
        {/* head */}
        <ellipse cx="96" cy="74" rx="50" ry="44" className="dragon-body" />
        {/* horns */}
        <path d="M 70 36 L 64 14 L 82 32 Z" className="dragon-horn" />
        <path d="M 120 34 L 128 12 L 132 34 Z" className="dragon-horn" />
        {/* snout */}
        <ellipse cx="120" cy="86" rx="26" ry="20" className="dragon-snout" />
        <circle cx="132" cy="80" r="2.4" className="dragon-nostril" />
        <circle cx="124" cy="92" r="2.4" className="dragon-nostril" />
        {/* eyes */}
        <circle cx="86" cy="64" r="11" className="dragon-eye" />
        <circle cx="112" cy="62" r="9" className="dragon-eye" />
        <circle cx={happy ? 88 : 86} cy={mood === 'sad' ? 68 : 66} r="4.5" className="dragon-pupil" />
        <circle cx={happy ? 114 : 112} cy={mood === 'sad' ? 66 : 64} r="3.8" className="dragon-pupil" />
        {/* mouth — opens with the child's voice */}
        <rect x="104" y="98" width="30" height={mouthH} rx={mouthH / 2} className="dragon-mouth" />
        {/* sparkles on success */}
        {happy && (
          <g className="dragon-sparkles">
            <text x="34" y="50">✨</text>
            <text x="150" y="60">⭐</text>
            <text x="150" y="130">✨</text>
          </g>
        )}
      </svg>
      <div className="dragon-name">Sparky</div>
    </div>
  )
}
