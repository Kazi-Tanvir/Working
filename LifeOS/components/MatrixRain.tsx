'use client'

import { useEffect, useRef } from 'react'

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 200
      canvas.height = canvas.parentElement?.clientHeight || 250
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const columns = Math.floor(canvas.width / 12)
    const yPositions = Array(columns).fill(0)

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#0F0'
      ctx.font = '10px monospace'

      for (let i = 0; i < yPositions.length; i++) {
        const char = String.fromCharCode(33 + Math.random() * 93)
        const x = i * 12
        const y = yPositions[i]

        ctx.fillText(char, x, y)

        if (y > canvas.height && Math.random() > 0.975) {
          yPositions[i] = 0
        } else {
          yPositions[i] = y + 10
        }
      }
    }

    const interval = setInterval(draw, 33)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full block opacity-70" />
}
