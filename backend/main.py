import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from services.ingestion import extract_text_from_pdf, extract_text_from_image
from services.rag import chunk_text, push_chunks_to_local_db
from services.websocket_handler import handle_voice_interaction

app = FastAPI(
    title="SonicDoc AI API",
    description="Intelligent Document Understanding (Engine A & Engine B)",
    version="2.0.0"
)

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "SonicDoc AI Core Systems Online"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # Read file bytes
    file_bytes = await file.read()
    doc_type = "Unknown"
    extraction_time = 0.0
    
    # Engine A: Extract Text & Triage
    text = ""
    if file.filename.endswith(".pdf"):
        text, doc_type, extraction_time = extract_text_from_pdf(file_bytes)
    elif file.filename.endswith((".png", ".jpg", ".jpeg")):
        text, doc_type, extraction_time = extract_text_from_image(file_bytes)
    else:
        text = file_bytes.decode('utf-8', errors='ignore')
        
    doc_id = file.filename
        
    # Engine A: Process Chunks into local memory (FAISS)
    chunks = chunk_text(text)
    chunks_embedded, embed_time = push_chunks_to_local_db(doc_id, chunks)
    
    return {
        "status": "success", 
        "filename": file.filename, 
        "classification": doc_type,
        "extraction_time_sec": round(extraction_time, 3),
        "embedding_time_sec": round(embed_time, 3),
        "chunks_embedded": chunks_embedded,
        "cost": "$0.00"
    }

@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    # Engine B: Ultra-Low Latency Flow
    await handle_voice_interaction(websocket)
