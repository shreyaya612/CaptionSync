import { useEffect, useRef } from 'react'
import { useMicrophone } from './hooks/useMicrophone'
import { useAudioVisualizer } from './hooks/useAudioVisualizer'
import { useAudioStreamer } from './hooks/useAudioStreamer'

function App() {
  const { status, errorMessage, stream, requestAccess, stopStream } = useMicrophone()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useAudioVisualizer(stream, canvasRef)

  const { status: streamStatus, captions, startStreaming, stopStreaming } = useAudioStreamer(stream)

  // NEW — sentinel ref at the bottom of the captions list, and an effect
  // that scrolls to it every time `captions` changes (new caption arrives,
  // or an interim one updates in place).
  const captionsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    captionsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [captions])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Live Captions</h1>
      <p>Mic: <span className="font-mono">{status}</span> | Stream: <span className="font-mono">{streamStatus}</span></p>
      {errorMessage && <p className="text-red-400">{errorMessage}</p>}

      <canvas ref={canvasRef} width={500} height={150} className="rounded border border-slate-700" />

      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={requestAccess} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">
          Enable Microphone
        </button>
        <button onClick={startStreaming} disabled={!stream} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 disabled:opacity-40">
          Start Streaming
        </button>
        <button onClick={stopStreaming} className="px-4 py-2 bg-amber-600 rounded hover:bg-amber-500">
          Stop Streaming
        </button>
        <button onClick={stopStream} className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600">
          Stop Mic
        </button>
      </div>

      <div className="w-full max-w-xl bg-slate-800 rounded p-4 h-64 overflow-y-auto flex flex-col gap-2">
        {captions.map((c, i) => (
          <p key={i} className={c.isFinal ? 'text-white' : 'text-slate-400 italic'}>
            {c.speaker !== null && <span className="text-cyan-400 font-semibold">Speaker {c.speaker}: </span>}
            {c.transcript}
          </p>
        ))}
        {/* NEW — empty sentinel div, this is what we scroll into view */}
        <div ref={captionsEndRef} />
      </div>
    </div>
  )
}

export default App