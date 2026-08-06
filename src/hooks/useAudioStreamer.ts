import { useRef, useCallback, useState } from 'react'

type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'error'

export interface Caption {
  transcript: string
  speaker: number | null
  isFinal: boolean
}

export function useAudioStreamer(stream: MediaStream | null) {
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [captions, setCaptions] = useState<Caption[]>([])
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
        audioBitsPerSecond: 128000,

      })
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(event.data)
        }
      }

      recorder.start(1000) // fire dataavailable every 1000ms
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setCaptions((prev) => {
        // Replace the last caption if it was an interim result being updated,
        // otherwise append a new one.
        const last = prev[prev.length - 1]
        if (last && !last.isFinal) {
          return [
            ...prev.slice(0, -1),
            { transcript: data.transcript, speaker: data.speaker, isFinal: data.is_final },
          ]
        }
        return [...prev, { transcript: data.transcript, speaker: data.speaker, isFinal: data.is_final }]
      })
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

  return { status, captions, startStreaming, stopStreaming }
}