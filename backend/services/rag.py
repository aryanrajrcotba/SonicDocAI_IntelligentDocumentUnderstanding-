from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import time

# Load local HuggingFace embedding model ($0 Cost, local inference)
# We use all-MiniLM-L6-v2 which yields dimensions of 384
try:
    encoder = SentenceTransformer('all-MiniLM-L6-v2') 
    d = 384  # Dimension of all-MiniLM-L6-v2
except Exception as e:
    print(f"Failed to load sentence_transformers: {e}")
    encoder = None
    d = 384

# Singleton In-Memory Local Database (FAISS index)
index = faiss.IndexFlatL2(d)
stored_chunks = []  # Maps FAISS int matrix index to the actual text chunk

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_text(text)

def generate_embedding(text: str) -> np.ndarray:
    if encoder:
        return encoder.encode(text)
    return np.zeros(d)

def push_chunks_to_local_db(document_id: str, text_chunks: list[str]):
    """Embeds text locally and stores in FAISS index returning metrics."""
    global stored_chunks
    if not text_chunks:
        return 0, 0.0
        
    start_time = time.time()
    
    if encoder:
        embeddings = encoder.encode(text_chunks)
        index.add(np.array(embeddings).astype('float32'))
    else:
        # Fallback for failing library
        for _ in text_chunks:
            index.add(np.zeros((1, d)).astype('float32'))
    
    # Track text chunks and their document relationships
    for chunk in text_chunks:
        stored_chunks.append({
            "document_id": document_id,
            "chunk_text": chunk
        })
        
    end_time = time.time()
    return len(text_chunks), (end_time - start_time)

def semantic_search(query_text: str, limit: int = 3, threshold: float = 1.8) -> str:
    """Returns aggregated context string from top matched documents locally in FAISS."""
    if index.ntotal == 0:
        return ""
        
    if not encoder:
        return ""
        
    query_emb = encoder.encode([query_text])
    D, I = index.search(np.array(query_emb).astype('float32'), limit)
    
    context_chunks = []
    # D is distance, I is matching index. Closer L2 distance is better.
    for distance, idx in zip(D[0], I[0]):
        if idx != -1 and distance <= threshold:
            chunk_data = stored_chunks[idx]
            context_chunks.append(chunk_data["chunk_text"])
            
    return "\n\n---\n\n".join(context_chunks)
