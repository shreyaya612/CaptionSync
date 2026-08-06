import asyncio
import json
import os
import websockets
from websockets.exceptions import ConnectionClosed
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
    "?model=nova-3"
    "&language=multi"
    "&punctuate=true"
    "&diarize=true"
    "&smart_format=true"
    "&interim_results=true"
    "&endpointing=300"
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
                except ConnectionClosed:
                    pass

            async def forward_transcripts_to_client():
                try:
                    async for message in dg_ws:
                        data = json.loads(message)
                        alt = data.get("channel", {}).get("alternatives", [{}])[0]
                        words = alt.get("words", "")
                        is_final = data.get("is_final", False)

                        if not words:
                            continue
                        
                        segments = []
                        current_speaker = words[0].get("speaker")
                        current_words = [words[0].get("punctuated_word") or words[0].get("word")]

                        for w in words[1:]:
                             spk = w.get("speaker")
                             token = w.get("punctuated_word") or w.get("word")
                             if spk == current_speaker:
                                 current_words.append(token)
                             else:
                                 segments.append((current_speaker, " ".join(current_words)))
                                 current_speaker = spk
                                 current_words = [token]
                        segments.append((current_speaker, " ".join(current_words)))
                        for speaker, text in segments:
                            await client_ws.send_json({
                                "transcript": text,
                                "speaker": speaker,
                                "is_final": is_final,
                            })
                except ConnectionClosed:
                    print("Deepgram connection closed")

            tasks = [
                asyncio.create_task(forward_audio_to_deepgram()),
                asyncio.create_task(forward_transcripts_to_client()),
            ]

            # Wait for EITHER side to finish, then cancel whatever's left —
            # this is the fix. gather() alone doesn't do this.
            done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            for task in pending:
                task.cancel()
            await asyncio.gather(*pending, return_exceptions=True)

    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        print("Session ended cleanly")