import { useRef } from 'react'                              // NEW
import { useMicrophone } from './hooks/useMicrophone'
import { useAudioVisualizer } from './hooks/useAudioVisualizer'  // NEW
import { useAudioStreamer } from './hooks/useAudioStreamer'

function App() {
  const { status, errorMessage, stream, requestAccess, stopStream } = useMicrophone()
  //                              ^^^^^^ NEW — you weren't pulling this out before
  const canvasRef = useRef<HTMLCanvasElement>(null)           // NEW

  useAudioVisualizer(stream, canvasRef)   // NEW

  const { status: streamStatus, startStreaming, stopStreaming } = useAudioStreamer(stream)


  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Live Captions — Waveform</h1>
      <p>Status: <span className="font-mono">{status}</span></p>
      {errorMessage && <p className="text-red-400">{errorMessage}</p>}

      <canvas ref={canvasRef} width={500} height={150} className="rounded border border-slate-700" />
      {/* NEW — this is what the hook draws onto */}

      <div className="flex gap-3">
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
    </div>
  )
}

export default App