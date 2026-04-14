from langchain.text_splitter import RecursiveCharacterTextSplitter
from openai import OpenAI
import os
import uuid

# Synchronous OpenAI client to replace sentence-transformers
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))



def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_text(text)

def generate_embedding(text: str) -> list[float]:
    if not openai_client or not os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY") == "your_openai_api_key_here":
        # Fallback dummy for development if key isn't provided yet
        return [0.0] * 1536
    
    response = openai_client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def push_chunks_to_supabase(document_id: str, text_chunks: list[str], supabase_client):
    if not supabase_client:
        print("Warning: Supabase client not initialized. Cannot push chunks.")
        return
        
    records = []
    for chunk in text_chunks:
        emb = generate_embedding(chunk)
        records.append({
            "document_id": document_id,
            "chunk_text": chunk,
            "embedding": emb
        })
    
    # Bulk insert into Supabase pgvector table
    response = supabase_client.table("document_chunks").insert(records).execute()
    return response

def semantic_search(query_text: str, supabase_client, limit: int = 3, threshold: float = 0.5) -> str:
    """Returns aggregated context string from top matched documents in Supabase DB"""
    if not supabase_client:
        return ""
        
    query_emb = generate_embedding(query_text)
    
    # Uses the RPC function created in schema.sql
    response = supabase_client.rpc(
        "match_document_chunks",
        {
            "query_embedding": query_emb,
            "match_threshold": threshold,
            "match_count": limit
        }
    ).execute()
    
    if len(response.data) == 0:
        return ""
        
    # Aggregate text
    context_chunks = [match["chunk_text"] for match in response.data]
    return "\n\n---\n\n".join(context_chunks)
