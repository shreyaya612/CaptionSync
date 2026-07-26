import { useEffect, useRef } from 'react'

export function useAudioVisualizer(
  stream: MediaStream | null,
  canvasRef: React.RefObject<HTMLCanvasElement | null>   // <-- fixed: allow null
) {
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    if (!stream || !canvasRef.current) return

    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    source.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    function draw() {
      animationFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#22d3ee'
      ctx.beginPath()

      const sliceWidth = canvas.width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        x += sliceWidth
      }

      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      source.disconnect()
      audioContext.close()
    }
  }, [stream, canvasRef])
}