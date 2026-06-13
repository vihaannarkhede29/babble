// Confetti.tsx — A short burst of celebratory confetti on a full-screen canvas.
//
// The partner used the `canvas-confetti` package; we hand-roll the same effect on
// a <canvas> so the port stays dependency-free. Mount it (e.g. on a win) and it
// runs for ~2.6s then idles. `replay` (a changing key/number) re-fires the burst.

import { useEffect, useRef } from 'react'

const COLORS = ['#FFD166', '#3BBFBF', '#EF6C57', '#1B3A2D', '#FF9600']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rot: number
  vr: number
  life: number
}

interface Props {
  /** Change this value to re-fire the burst. */
  replay?: number
}

export function Confetti({ replay = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const W = () => canvas.width
    const H = () => canvas.height
    const particles: Particle[] = []

    const burst = (cx: number, cy: number, count: number, spread: number) => {
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread
        const speed = (6 + Math.random() * 8) * dpr
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2 * dpr,
          vy: Math.sin(angle) * speed,
          size: (5 + Math.random() * 6) * dpr,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          life: 1,
        })
      }
    }

    // Center pop + two side cannons.
    burst(W() / 2, H() * 0.45, 110, Math.PI * 1.4)
    burst(W() * 0.04, H() * 0.7, 40, Math.PI * 0.7)
    burst(W() * 0.96, H() * 0.7, 40, Math.PI * 0.7)

    const gravity = 0.22 * dpr
    let raf = 0
    let frames = 0
    const draw = () => {
      ctx.clearRect(0, 0, W(), H())
      frames++
      // A light trickle for the first second.
      if (frames < 60 && frames % 6 === 0) {
        burst(W() * 0.04, H() * 0.7, 4, Math.PI * 0.5)
        burst(W() * 0.96, H() * 0.7, 4, Math.PI * 0.5)
      }
      for (const p of particles) {
        p.vy += gravity
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        p.life -= 0.006
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }
      // Drop dead particles.
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].life <= 0 || particles[i].y > H() + 40) particles.splice(i, 1)
      }
      if (particles.length > 0) raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [replay])

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />
}
