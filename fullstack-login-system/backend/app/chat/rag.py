"""
rag.py — Simple in-memory RAG (Retrieval-Augmented Generation) using FAISS.

Flow:
  1. load_documents(texts) → chunk → embed → store in FAISS index
  2. retrieve(query, k) → embed query → FAISS nearest-neighbor → return chunks

Embedding uses OpenAI's text-embedding-3-small by default.
Swap the model name to use a different provider (e.g. Gemini embeddings).
"""

import os
from typing import Optional

import numpy as np

from app.core.config import settings

# ---------------------------------------------------------------------------
# Lazy imports so the server starts even if faiss / openai are not installed
# ---------------------------------------------------------------------------
try:
    import faiss  # type: ignore
    _FAISS_AVAILABLE = True
except ImportError:
    _FAISS_AVAILABLE = False

try:
    from openai import OpenAI as _OpenAI
    _openai_client: Optional[_OpenAI] = _OpenAI(api_key=settings.OPENAI_API_KEY)
except Exception:
    _openai_client = None

# ---------------------------------------------------------------------------
# Module-level state
# ---------------------------------------------------------------------------
_index: Optional[object] = None        # faiss.IndexFlatL2 instance
_chunks: list[str] = []                # parallel array of text chunks
_EMBED_MODEL = getattr(settings, "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
_CHUNK_SIZE = 500                      # characters per chunk
_DIM = 1536                            # embedding dimension for text-embedding-3-small


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _chunk_text(text: str, size: int = _CHUNK_SIZE) -> list[str]:
    """Split text into overlapping chunks of `size` characters."""
    chunks = []
    step = size - 50  # 50-char overlap
    for i in range(0, len(text), step):
        chunk = text[i : i + size].strip()
        if chunk:
            chunks.append(chunk)
    return chunks


def _embed(texts: list[str]) -> np.ndarray:
    """
    Embed a list of strings using the OpenAI embedding API.
    Returns a float32 numpy array of shape (len(texts), DIM).
    """
    if _openai_client is None:
        raise RuntimeError("OpenAI client not available — check OPENAI_API_KEY")

    response = _openai_client.embeddings.create(
        model=_EMBED_MODEL,
        input=texts,
    )
    vectors = [item.embedding for item in response.data]
    return np.array(vectors, dtype=np.float32)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def load_documents(texts: list[str]) -> int:
    """
    Chunk and embed a list of documents, adding them to the FAISS index.

    Returns the number of chunks added.
    """
    global _index, _chunks

    if not _FAISS_AVAILABLE:
        raise RuntimeError("faiss-cpu is not installed. Run: pip install faiss-cpu")
    if not texts:
        return 0

    new_chunks: list[str] = []
    for text in texts:
        new_chunks.extend(_chunk_text(text))

    if not new_chunks:
        return 0

    vectors = _embed(new_chunks)

    if _index is None:
        # Build a flat L2 index on first call
        _index = faiss.IndexFlatL2(_DIM)

    _index.add(vectors)  # type: ignore[attr-defined]
    _chunks.extend(new_chunks)

    return len(new_chunks)


def retrieve(query: str, k: int = 3) -> list[str]:
    """
    Find the top-k most relevant chunks for the given query.

    Returns an empty list if the index is empty or RAG is not set up.
    """
    global _index, _chunks

    if _index is None or not _chunks:
        return []

    query_vec = _embed([query])  # shape (1, DIM)
    actual_k = min(k, len(_chunks))

    distances, indices = _index.search(query_vec, actual_k)  # type: ignore[attr-defined]

    results = []
    for idx in indices[0]:
        if 0 <= idx < len(_chunks):
            results.append(_chunks[idx])
    return results


def clear_index() -> None:
    """Reset the vector store (useful for testing)."""
    global _index, _chunks
    _index = None
    _chunks = []


def index_stats() -> dict:
    """Return current index statistics."""
    return {
        "chunks": len(_chunks),
        "indexed": _index is not None and len(_chunks) > 0,
    }
