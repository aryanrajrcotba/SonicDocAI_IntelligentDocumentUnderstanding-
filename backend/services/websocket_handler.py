from fastapi import WebSocket
from openai import AsyncOpenAI
import os
import json
from .rag import semantic_search

openai_api_key = os.environ.get("OPENAI_API_KEY")

openai_client = AsyncOpenAI(api_key=openai_api_key) if openai_api_key and openai_api_key != "your_openai_api_key_here" else None


async def handle_voice_interaction(websocket: WebSocket, supabase_client):
    """
    Highly optimized bi-directional Voice & RAG logic path.
    Rejects HTTP overhead in favor of WebSockets.
    """
    await websocket.accept()
    try:
        while True:
            # 1. Listen for streaming text chunks from the Front-end Speech API or direct audio bits
            text_data = await websocket.receive_text()
            data = json.loads(text_data)
            query = data.get("query", "")
            
            if not query:
                continue

            # 2. Vector DB Similarity matching
            context = semantic_search(query, supabase_client)
            
            prompt = f"Use this context to accurately answer the user's query. If the context is empty, answer broadly but succinctly.\n\nContext:\n{context}\n\nQuery: {query}"
            
            # 3. Blazing fast generation (OpenAI GPT)
            answer = "OpenAI API key missing. Please configure in .env."
            if openai_client:
                completion = await openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are SonicDoc AI, a highly fast and accurate document assistant. Keep your answers conversational and helpful."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=600
                )
                answer = completion.choices[0].message.content
            
            # 4. Stream answer back. For ultra-low latency, the frontend will use the 
            # browser's native Web Speech Synthesis API to read the text instantly rather than waiting for an audio blob over the wire.
            await websocket.send_text(json.dumps({
                "type": "answer",
                "text": answer
            }))
            
    except Exception as e:
        print(f"WebSocket closed or encountered an error: {e}")
