import asyncio
import json
import os
import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv


load_dotenv()
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEEPGRAM_URL = (
    "wss://api.deepgram.com/v1/listen"
    "?punctuate=true"
    "&diarize=true"
    "&smart_format=true"
    "&interim_results=true"
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.websocket("/ws/audio")
async def audio_stream(client_ws: WebSocket):
    await client_ws.accept()
    print("Client connected")

    try:
        async with websockets.connect(
            DEEPGRAM_URL,
            additional_headers={"Authorization": f"Token {DEEPGRAM_API_KEY}"}
        ) as dg_ws:

            async def forward_audio_to_deepgram():
                try:
                    while True:
                        chunk = await client_ws.receive_bytes()
                        await dg_ws.send(chunk)
                except WebSocketDisconnect:
                    print("Client disconnected (audio side)")

            async def forward_transcripts_to_client():
                async for message in dg_ws:
                    data = json.loads(message)
                    alt = data.get("channel", {}).get("alternatives", [{}])[0]
                    transcript = alt.get("transcript", "")

                    if not transcript:
                        continue

                    speaker = None
                    words = alt.get("words", [])
                    if words:
                        speaker = words[0].get("speaker")

                    await client_ws.send_json({
                        "transcript": transcript,
                        "speaker": speaker,
                        "is_final": data.get("is_final", False),
                    })

            await asyncio.gather(
                forward_audio_to_deepgram(),
                forward_transcripts_to_client(),
            )

    except WebSocketDisconnect:
        print("Client disconnected")