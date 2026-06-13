import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export function ConfettiOverlay() {
  useEffect(() => {
    const duration = 2500
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#FFD166', '#3BBFBF', '#EF6C57', '#1B3A2D'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#FFD166', '#3BBFBF', '#EF6C57', '#1B3A2D'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FFD166', '#3BBFBF', '#EF6C57'],
    })

    frame()
  }, [])

  return null
}
