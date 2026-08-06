# CaptionSync

Live, speaker-labeled captions for group conversations — built for real personal use, not just as a demo.

## The problem

I have moderately severe sensorineural hearing loss. Group settings — meetings, lectures, casual conversations with more than one person — are genuinely hard to follow. I tried Google's live transcribe and it consistently failed at the moments that mattered most:

- No speaker labels in group settings, so a wall of unattributed text is nearly as hard to follow as the original audio
- Struggled badly with voices that weren't close to the mic
- Broke down completely on sudden language switches mid-conversation

## What it does

- Real-time captions from live microphone audio, streamed and transcribed with under ~1s of added latency
- **Speaker diarization** — captions are labeled `Speaker 0`, `Speaker 1`, etc., so you can follow who said what in a group setting, which most free transcription tools don't offer
- Interim vs. final caption states shown visually (gray italic while still being refined, white once settled) — an accuracy/readability signal, not just a transcript dump
- A live waveform showing actual audio signal, independent of permission/mute state — a deliberate accessibility feature, not just a debug tool (see [Findings](#findings-worth-noting) below for why this matters)
- Multilingual code-switching support via Deepgram Nova-3, with known limitations (see below)

## Architecture

```
Browser (React + TS)
  → getUserMedia (mic access)
  → MediaRecorder (chunked Opus-encoded audio, ~1s chunks)
  → WebSocket
       ↓
FastAPI backend (Python, async)
  → proxies audio to Deepgram's real-time WebSocket API
  → relays transcript + speaker labels back to browser
       ↓
Browser renders live caption feed
```

The backend acts as a **proxy** between the browser and Deepgram — this keeps the Deepgram API key server-side only, never exposed to client-side JS.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Tailwind | Type safety on audio/caption data shapes; fast iteration with Vite |
| Backend | FastAPI (Python, async) | Native async WebSocket support, needed to proxy two concurrent live connections without blocking |
| Speech-to-text | Deepgram (Nova-3, real-time streaming) | Built-in diarization, multilingual code-switching support, sub-second streaming latency |
| Audio capture | Web Audio API + MediaRecorder | Web Audio API (`AnalyserNode`) for live signal visualization, `MediaRecorder` for encoded chunk streaming |

## Setup [run both at the same time in different terminals]

**Backend**
```bash
cd backend
python3 -m venv venv
venv\Scripts\activate   # Mac: source venv/bin/activate
pip install -r requirements.txt
# create .env with: DEEPGRAM_API_KEY=your_key_here
uvicorn main:app --reload --port 8000
```

**Frontend** 
```bash
cd live-captions # here the frontend part is directly inside the live-captions folder 
npm install
npm run dev
```

## Findings worth noting

Built and tested honestly, including the failures — these are real discoveries, not assumptions:

- **Permission granted ≠ audio actually flowing.** A hardware/keyboard mic mute does not change the browser's permission state or its "using the microphone" indicator — the stream stays technically "live" while carrying silence. This is why the app keeps a persistent, always-visible waveform rather than relying on permission status alone to reassure the user that audio is being captured.
- **Real-time multilingual code-switching is a genuinely unsolved problem industry-wide, not just in this project.** Even Deepgram's newer multilingual model has real limitations here — this was tested directly against a Hindi/English switch and the results were inconsistent. Documenting this honestly rather than overclaiming.
- **Far-away voices are partly a hardware problem, not a pure software one.** `autoGainControl` in the browser mic constraints helps somewhat but amplifies background noise along with the target voice — it is not a full fix.
- **`asyncio.gather()` does not cancel sibling tasks** when one finishes or errors — a real gotcha that caused a silent background crash after every "stop" click, fixed using `asyncio.wait(..., return_when=FIRST_COMPLETED)` with explicit task cancellation.

## Known limitations / not yet built

- Multilingual code-switching accuracy is inconsistent for some language pairs
- No persistent history — captions are lost on refresh
- No "catch-up" panel yet for quickly re-reading the last ~30 seconds after losing the thread
- Not yet deployed — currently local-only

## Roadmap

- [ ] Catch-up panel (rolling recent transcript, pinned/highlighted)
- [ ] Persist caption history per session
- [ ] Evaluate self-hosted diarization (pyannote.audio) vs. vendor API tradeoffs
- [ ] Deploy to a reachable URL for real meeting/lecture use
- [ ] Auto-reconnect on dropped connection mid-session
