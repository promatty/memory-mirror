"use client"

import { useEffect, useRef } from "react"

interface AudioWaveformProps {
  isPlaying: boolean
}

export function AudioWaveform({ isPlaying }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    let phase = 0

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      
      ctx.strokeStyle = "rgb(var(--foreground))"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      ctx.beginPath()
      
      const segments = 50
      const segmentWidth = width / segments

      for (let i = 0; i <= segments; i++) {
        const x = i * segmentWidth
        
        // Create waveform pattern
        const amplitude = isPlaying ? 30 : 15
        const frequency = 0.05
        const y = height / 2 + Math.sin((i * frequency) + phase) * amplitude * (Math.random() * 0.5 + 0.5)
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()

      if (isPlaying) {
        phase += 0.1
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  return (
    <div className="w-full h-32 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={200}
        height={100}
        className="w-full h-full"
      />
    </div>
  )
}
