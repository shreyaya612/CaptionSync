import { useRef } from 'react'                              // NEW
import { useMicrophone } from './hooks/useMicrophone'
import { useAudioVisualizer } from './hooks/useAudioVisualizer'  // NEW

function App() {
  const { status, errorMessage, stream, requestAccess, stopStream } = useMicrophone()
  //                              ^^^^^^ NEW — you weren't pulling this out before
  const canvasRef = useRef<HTMLCanvasElement>(null)           // NEW

  useAudioVisualizer(stream, canvasRef)                       // NEW

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
        <button onClick={stopStream} className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600">
          Stop
        </button>
      </div>
    </div>
  )
}

export default App