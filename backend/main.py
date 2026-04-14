import antigravity 
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from database import supabase
from services.ingestion import extract_text_from_pdf, extract_text_from_image
from services.rag import chunk_text, push_chunks_to_supabase
from services.websocket_handler import handle_voice_interaction

app = FastAPI(
    title="SonicDoc AI API",
    description="Intelligent Document Understanding with RAG and Voice Integration",
    version="1.0.0"
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
    
    # Extract Text intelligently
    text = ""
    if file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)
    elif file.filename.endswith(".png") or file.filename.endswith(".jpg"):
        text = extract_text_from_image(file_bytes)
    else:
        text = file_bytes.decode('utf-8', errors='ignore')
        
    # Register document into Supabase and acquire ID
    doc_response = None
    if supabase:
        doc_response = supabase.table("documents").insert({
            "filename": file.filename,
            "storage_path": f"uploads/{file.filename}"
        }).execute()
    
    doc_id = doc_response.data[0]["id"] if doc_response and doc_response.data else "dev_bypass_id"
        
    # Process Chunks into pgvector
    chunks = chunk_text(text)
    push_chunks_to_supabase(doc_id, chunks, supabase)
    
    return {
        "status": "success", 
        "filename": file.filename, 
        "chunks_embedded": len(chunks)
    }

@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    await handle_voice_interaction(websocket, supabase)
