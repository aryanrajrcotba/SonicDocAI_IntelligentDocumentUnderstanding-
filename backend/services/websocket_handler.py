import asyncio
import os
import json
from fastapi import WebSocket, WebSocketDisconnect
from groq import AsyncGroq
from services.rag import semantic_search

# Initialize Groq client
async_groq_client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY", "dummy_key"))

async def handle_voice_interaction(websocket: WebSocket):
    await websocket.accept()
    print("Engine B: WebSocket Connection Established.")

    try:
        while True:
            # Receive text or audio events from frontend
            message = await websocket.receive()
            
            transcript = ""
            if "text" in message:
                try:
                    data = json.loads(message["text"])
                    transcript = data.get("text", "")
                except:
                    transcript = message["text"]
            
            if not transcript:
                # If binary audio is received, we would normally proxy to Deepgram's streaming STT socket here.
                # For this implementation, we echo a placeholder unless mapped explicitly to STT.
                continue

            print(f"Triggering Engine B inference for: {transcript}")
            await websocket.send_json({"type": "status", "content": "searching"})

            # 1. Engine B: Semantic Search internally via FAISS
            context = semantic_search(transcript)
            prompt = f"Answer concisely based on the following text:\n{context}\n\nQuestion: {transcript}"
            
            await websocket.send_json({"type": "status", "content": "generating"})

            # 2. Engine B: Fire prompt to Groq LLaMA 3
            try:
                chat_completion = await async_groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="llama3-8b-8192",
                    stream=True,
                )
                
                # 3. Engine B: Stream back output text tokens
                # In full pipeline, tokens go instantly into Deepgram TTS WS, streaming binary back.
                async for chunk in chat_completion:
                    token = chunk.choices[0].delta.content or ""
                    if token:
                        await websocket.send_json({"type": "token", "content": token})
                        
                await websocket.send_json({"type": "status", "content": "done"})
                
            except Exception as ml_err:
                await websocket.send_json({"type": "error", "content": str(ml_err)})
                print(f"Groq API Error: {ml_err}")

    except WebSocketDisconnect:
        print("Engine B: Client Disconnected")
    except Exception as e:
        print(f"Error in websocket loop: {e}")
