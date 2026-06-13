// StarRating.tsx — Up to `max` stars, `stars` of them filled, with a staggered
// CSS pop-in. Ported from the partner shell (Framer Motion → CSS animation).

interface Props {
  stars: number
  max?: number
}

export function StarRating({ stars, max = 3 }: Props) {
  return (
    <div className="star-rating">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < stars
        return (
          <span
            key={i}
            className={`star${filled ? ' star--filled' : ''}`}
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            {filled ? '⭐' : '☆'}
          </span>
        )
      })}
    </div>
  )
}
