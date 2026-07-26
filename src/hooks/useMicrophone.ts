import { useState, useCallback, useRef } from 'react'

type MicStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error'

export function useMicrophone() {
  const [status, setStatus] = useState<MicStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const requestAccess = useCallback(async () => {
    setStatus('requesting')
    setErrorMessage(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      const [audioTrack] = stream.getAudioTracks()
console.log('initial muted state:', audioTrack.muted)
console.log('track state:', audioTrack.readyState)

audioTrack.onmute = () => console.log('track muted at hardware/OS level')
audioTrack.onunmute = () => console.log('track unmuted')

const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
console.log(result.state) // 'granted' | 'denied' | 'prompt'
result.onchange = () => console.log('permission changed to', result.state)

      streamRef.current = stream
      setStatus('granted')
  
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setErrorMessage('Microphone permission was denied.')
        } else if (err.name === 'NotFoundError') {
          setErrorMessage('No microphone was found on this device.')
        } else {
          setErrorMessage(`Microphone error: ${err.name}`)
        }
      } else {
        setErrorMessage('Unknown error accessing microphone.')
      }
      setStatus('error')
    }
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStatus('idle')
  }, [])

  return { status, errorMessage, stream: streamRef.current, requestAccess, stopStream }
}