import { useMicrophone } from './hooks/useMicrophone'

function App() {
  const { status, errorMessage, requestAccess, stopStream } = useMicrophone()

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Live Captions — Mic Access</h1>
      <p>Status: <span className="font-mono">{status}</span></p>
      {errorMessage && <p className="text-red-400">{errorMessage}</p>}
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