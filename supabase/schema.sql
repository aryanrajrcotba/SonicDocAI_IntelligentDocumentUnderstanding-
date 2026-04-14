-- Enable pgvector extension
create extension if not exists vector;

-- Documents table to track file metadata
create table public.documents (
    id uuid primary key default gen_random_uuid(),
    filename text not null,
    storage_path text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Document chunks table with embeddings
create table public.document_chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid references public.documents(id) on delete cascade not null,
    chunk_text text not null,
    -- We'll use 1536 dimensions for OpenAI text-embedding-3-small model
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for HNSW algorithm to speed up searches (optional but recommended for pgvector)
create index on public.document_chunks using hnsw (embedding vector_cosine_ops);

-- Create a function to search for similar chunks
create or replace function match_document_chunks(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
returns table (
    id uuid,
    document_id uuid,
    chunk_text text,
    similarity float
)
language sql stable
as $$
    select
        dc.id,
        dc.document_id,
        dc.chunk_text,
        1 - (dc.embedding <=> query_embedding) as similarity
    from
        public.document_chunks dc
    where
        1 - (dc.embedding <=> query_embedding) > match_threshold
    order by
        dc.embedding <=> query_embedding
    limit match_count;
$$;
