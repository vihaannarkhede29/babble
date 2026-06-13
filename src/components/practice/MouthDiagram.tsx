interface MouthDiagramProps {
  phoneme: string
}

type MouthShape = {
  lipGap: number
  tongueY: number
  tongueWidth: number
  label: string
}

const shapes: Record<string, MouthShape> = {
  C: { lipGap: 6, tongueY: 58, tongueWidth: 20, label: 'Back of tongue up' },
  A: { lipGap: 22, tongueY: 50, tongueWidth: 28, label: 'Mouth wide open' },
  T: { lipGap: 8, tongueY: 42, tongueWidth: 22, label: 'Tongue taps roof' },
  S: { lipGap: 4, tongueY: 52, tongueWidth: 18, label: 'Teeth together, air flow' },
  U: { lipGap: 10, tongueY: 55, tongueWidth: 24, label: 'Lips rounded' },
  N: { lipGap: 6, tongueY: 44, tongueWidth: 20, label: 'Tongue behind teeth' },
  F: { lipGap: 5, tongueY: 56, tongueWidth: 18, label: 'Top teeth on lip' },
  R: { lipGap: 12, tongueY: 48, tongueWidth: 26, label: 'Tongue curled back' },
  O: { lipGap: 16, tongueY: 54, tongueWidth: 26, label: 'Lips in a circle' },
  G: { lipGap: 8, tongueY: 56, tongueWidth: 22, label: 'Back tongue pressed' },
  K: { lipGap: 8, tongueY: 44, tongueWidth: 22, label: 'Back of tongue pops' },
  AH: { lipGap: 22, tongueY: 50, tongueWidth: 28, label: 'Mouth open wide' },
  I: { lipGap: 8, tongueY: 52, tongueWidth: 18, label: 'Mouth slightly open' },
  EE: { lipGap: 6, tongueY: 48, tongueWidth: 20, label: 'Lips spread wide' },
  AR: { lipGap: 14, tongueY: 50, tongueWidth: 24, label: 'Mouth open, tongue relaxed' },
  SH: { lipGap: 4, tongueY: 52, tongueWidth: 18, label: 'Lips forward, soft air' },
  TH: { lipGap: 5, tongueY: 50, tongueWidth: 16, label: 'Tongue between teeth' },
  B: { lipGap: 4, tongueY: 54, tongueWidth: 20, label: 'Lips pop open' },
}

const defaultShape: MouthShape = {
  lipGap: 10,
  tongueY: 52,
  tongueWidth: 22,
  label: 'Watch the dragon\'s mouth',
}

export function MouthDiagram({ phoneme }: MouthDiagramProps) {
  const shape = shapes[phoneme.toUpperCase()] ?? defaultShape

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 160 100" className="h-24 w-40" aria-hidden="true">
        <ellipse cx="80" cy="50" rx="70" ry="45" fill="#F7F4EF" stroke="#1B3A2D" strokeWidth="2" />
        <ellipse cx="80" cy="35" rx="55" ry="30" fill="#EF6C57" opacity="0.3" />
        <ellipse
          cx="80"
          cy={35 + shape.lipGap / 2}
          rx="40"
          ry={shape.lipGap}
          fill="#1B3A2D"
          opacity="0.15"
        />
        <ellipse
          cx="80"
          cy={shape.tongueY}
          rx={shape.tongueWidth}
          ry="14"
          fill="#EF6C57"
        />
        <path
          d={`M40 30 Q80 ${30 - shape.lipGap} 120 30`}
          stroke="#1B3A2D"
          strokeWidth="3"
          fill="none"
        />
        <path
          d={`M40 40 Q80 ${40 + shape.lipGap} 120 40`}
          stroke="#1B3A2D"
          strokeWidth="3"
          fill="none"
        />
      </svg>
      <p className="text-sm font-semibold text-forest/80">{shape.label}</p>
    </div>
  )
}
