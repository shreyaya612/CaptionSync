import { useRef, useCallback, useState } from 'react'

type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'error'

export function useAudioStreamer(stream: MediaStream | null) {
  const [status, setStatus] = useState<StreamStatus>('idle')
  const wsRef = useRef<WebSocket | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  const startStreaming = useCallback(() => {
    if (!stream || wsRef.current) return

    setStatus('connecting')
    const ws = new WebSocket('ws://localhost:8000/ws/audio')
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('streaming')

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(event.data)
        }
      }

      recorder.start(1000) // fire dataavailable every 1000ms
    }

    ws.onerror = () => {
      setStatus('error')
    }

    ws.onclose = () => {
      setStatus('idle')
    }
  }, [stream])

  const stopStreaming = useCallback(() => {
    recorderRef.current?.stop()
    recorderRef.current = null
    wsRef.current?.close()
    wsRef.current = null
    setStatus('idle')
  }, [])

  return { status, startStreaming, stopStreaming }
}