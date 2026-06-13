import type { WordImage } from '../../lib/words'

interface WordIllustrationProps {
  image: WordImage
  className?: string
}

export function WordIllustration({ image, className = '' }: WordIllustrationProps) {
  if (image === 'cat') {
    return (
      <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
        <ellipse cx="60" cy="70" rx="35" ry="22" fill="#EF6C57" />
        <circle cx="60" cy="45" r="28" fill="#FFD166" />
        <polygon points="35,25 42,10 48,28" fill="#FFD166" />
        <polygon points="85,25 78,10 72,28" fill="#FFD166" />
        <circle cx="50" cy="42" r="4" fill="#1B3A2D" />
        <circle cx="70" cy="42" r="4" fill="#1B3A2D" />
        <path d="M55 52 Q60 56 65 52" stroke="#1B3A2D" strokeWidth="2" fill="none" />
        <path d="M45 58 Q60 65 75 58" stroke="#EF6C57" strokeWidth="2" fill="none" />
      </svg>
    )
  }

  if (image === 'sun') {
    return (
      <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
        <circle cx="60" cy="50" r="28" fill="#FFD166" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="60"
            y1="50"
            x2={60 + Math.cos((angle * Math.PI) / 180) * 42}
            y2={50 + Math.sin((angle * Math.PI) / 180) * 42}
            stroke="#FFD166"
            strokeWidth="4"
            strokeLinecap="round"
          />
        ))}
        <circle cx="50" cy="45" r="3" fill="#1B3A2D" />
        <circle cx="70" cy="45" r="3" fill="#1B3A2D" />
        <path d="M50 58 Q60 66 70 58" stroke="#1B3A2D" strokeWidth="2" fill="none" />
      </svg>
    )
  }

  if (image === 'star') {
    return (
      <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
        <polygon
          points="60,12 72,44 106,44 78,64 88,96 60,76 32,96 42,64 14,44 48,44"
          fill="#FFD166"
          stroke="#1B3A2D"
          strokeWidth="2"
        />
      </svg>
    )
  }

  if (image === 'fish') {
    return (
      <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
        <ellipse cx="55" cy="50" rx="35" ry="22" fill="#3BBFBF" />
        <polygon points="90,50 110,35 110,65" fill="#3BBFBF" />
        <circle cx="35" cy="45" r="4" fill="#1B3A2D" />
        <path d="M30 55 Q40 62 50 55" stroke="#FFD166" strokeWidth="2" fill="none" />
      </svg>
    )
  }

  if (image === 'tree') {
    return (
      <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
        <rect x="54" y="55" width="12" height="35" rx="2" fill="#1B3A2D" />
        <circle cx="60" cy="40" r="28" fill="#3BBFBF" />
        <circle cx="45" cy="50" r="18" fill="#3BBFBF" />
        <circle cx="75" cy="50" r="18" fill="#3BBFBF" />
      </svg>
    )
  }

  if (image === 'bath') {
    return (
      <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
        <path d="M15 65 Q15 45 60 45 Q105 45 105 65 L105 75 Q105 85 60 85 Q15 85 15 75 Z" fill="#F7F4EF" stroke="#1B3A2D" strokeWidth="2" />
        <ellipse cx="60" cy="45" rx="45" ry="8" fill="#3BBFBF" />
        <circle cx="40" cy="35" r="8" fill="#FFD166" opacity="0.8" />
        <circle cx="70" cy="30" r="6" fill="#FFD166" opacity="0.8" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
      <ellipse cx="60" cy="72" rx="30" ry="18" fill="#3BBFBF" />
      <circle cx="60" cy="48" r="24" fill="#3BBFBF" />
      <circle cx="48" cy="44" r="6" fill="#FFD166" />
      <circle cx="72" cy="44" r="6" fill="#FFD166" />
      <circle cx="48" cy="44" r="2.5" fill="#1B3A2D" />
      <circle cx="72" cy="44" r="2.5" fill="#1B3A2D" />
      <path d="M52 54 Q60 58 68 54" stroke="#1B3A2D" strokeWidth="2" fill="none" />
      <ellipse cx="38" cy="58" rx="8" ry="5" fill="#EF6C57" opacity="0.5" />
      <ellipse cx="82" cy="58" rx="8" ry="5" fill="#EF6C57" opacity="0.5" />
    </svg>
  )
}
