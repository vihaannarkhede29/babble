import { motion } from 'framer-motion'

interface StarRatingProps {
  stars: number
  max?: number
}

export function StarRating({ stars, max = 3 }: StarRatingProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: max }, (_, index) => {
        const filled = index < stars
        return (
          <motion.span
            key={index}
            className="text-4xl"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: filled ? 1 : 0.7, rotate: 0 }}
            transition={{ delay: index * 0.15, type: 'spring', stiffness: 300 }}
          >
            {filled ? '⭐' : '☆'}
          </motion.span>
        )
      })}
    </div>
  )
}
