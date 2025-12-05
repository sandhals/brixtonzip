import { useState, useEffect, useRef } from 'react'

interface TrailPoint {
  x: number
  y: number
  radius: number
  opacity: number
  id: number
}

export default function GardenHeaderImage({ src, colorSrc, alt }: { src: string; colorSrc: string; alt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const trailPointsRef = useRef<TrailPoint[]>([])
  const lastPositionRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const nextIdRef = useRef(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return

    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const now = Date.now()

    let radius = 40

    // Calculate mouse speed to adjust circle size
    if (lastPositionRef.current) {
      const dx = x - lastPositionRef.current.x
      const dy = y - lastPositionRef.current.y
      const dt = now - lastPositionRef.current.time
      const distance = Math.sqrt(dx * dx + dy * dy)
      const speed = distance / Math.max(dt, 1)

      // More sensitive speed scaling for paintbrush effect
      radius = Math.min(180, Math.max(8, 25 + speed * 80))
    }

    lastPositionRef.current = { x, y, time: now }

    // Add new trail point
    trailPointsRef.current.push({
      x,
      y,
      radius,
      opacity: 1,
      id: nextIdRef.current++
    })

    // Limit trail points to prevent memory issues
    if (trailPointsRef.current.length > 100) {
      trailPointsRef.current.shift()
    }
  }

  const handleMouseLeave = () => {
    lastPositionRef.current = null
  }

  // Animation loop to update trail and apply mask
  useEffect(() => {
    const canvas = canvasRef.current
    const colorImg = document.querySelector('.color-image') as HTMLImageElement
    if (!canvas || !colorImg) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update trail points
      trailPointsRef.current = trailPointsRef.current
        .map(point => ({
          ...point,
          opacity: point.opacity - 0.015,
          radius: point.radius * 0.995
        }))
        .filter(point => point.opacity > 0)

      // Draw trail points as mask
      trailPointsRef.current.forEach(point => {
        ctx.save()
        ctx.globalAlpha = point.opacity
        ctx.beginPath()
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'white'
        ctx.fill()
        ctx.restore()
      })

      // Convert canvas to data URL and apply as mask
      const maskDataUrl = canvas.toDataURL()
      colorImg.style.webkitMaskImage = `url(${maskDataUrl})`
      colorImg.style.maskImage = `url(${maskDataUrl})`

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && imageContainerRef.current) {
        const rect = imageContainerRef.current.getBoundingClientRect()
        canvasRef.current.width = rect.width
        canvasRef.current.height = rect.height
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  return (
    <div className="header-image-wrapper">
      <div
        ref={imageContainerRef}
        className="image-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img src={src} alt={alt} className="base-image" />
        <canvas ref={canvasRef} className="reveal-mask" />
        <img src={colorSrc} alt={alt} className="color-image" />
      </div>

      <input type="checkbox" id="open-garden" className="zip-checkbox" />

      <div className="iframe-container">
        <iframe
          src="/unzip"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.932)'
          }}
          frameBorder={0}
        />
      </div>

      <style jsx>{`
        .header-image-wrapper {
          position: relative;
        }

        .image-container {
          position: relative;
          width: 100%;
          height: 50vh;
          overflow: hidden;
        }

        .base-image,
        .color-image {
          width: 100%;
          height: 50vh;
          object-fit: cover;
          object-position: 50% 35%;
          background-color: var(--black);
        }

        .base-image {
          display: block;
          mix-blend-mode: multiply;
        }

        .color-image {
          position: absolute;
          top: 0;
          left: 0;
          mix-blend-mode: normal;
          -webkit-mask-image: url('');
          mask-image: url('');
          -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
        }

        .reveal-mask {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0;
        }

        .iframe-container {
          display: none;
        }

        .zip-checkbox {
          z-index: 9999;
          filter: opacity(0.8);
          accent-color: blue;
          font-family: monospace;
          position: absolute;
          bottom: 0.6em;
          right: 0.4em;
          display: inline;
          opacity: 0.8;
          color: black;
        }

        .zip-checkbox:hover:after {
          content: ' UNZIP? ';
          background: white;
          margin-left: calc(-3rem - 2px);
          margin-bottom: 6px;
        }

        .zip-checkbox:checked:hover:after {
          content: 'ZIP?';
          color: blue;
          margin-left: calc(-2rem - 2px);
          margin-bottom: 6px;
        }

        .zip-checkbox:checked + .iframe-container {
          display: block;
        }
      `}</style>
    </div>
  )
}
