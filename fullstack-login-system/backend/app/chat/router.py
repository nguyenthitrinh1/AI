"""
router.py — Chat API endpoints.

Endpoints:
  POST   /chat          — streaming chat with history + RAG
  POST   /chat/upload   — load documents into the RAG vector store
  DELETE /chat/history  — clear session history
  GET    /chat/stats    — index statistics
"""

import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Header, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.config import settings
from app.chat import memory, rag

# ---------------------------------------------------------------------------
# OpenAI client — swap to Gemini or Claude by replacing this block
# ---------------------------------------------------------------------------
try:
    from openai import OpenAI

    _openai = OpenAI(api_key=settings.OPENAI_API_KEY)
    _MODEL = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")
except Exception as exc:
    _openai = None  # type: ignore[assignment]
    _MODEL = "gpt-4o-mini"
    print(f"[WARN] OpenAI client init failed: {exc}")

router = APIRouter(prefix="/chat", tags=["chat"])

_MAX_HISTORY_TOKENS: int = getattr(settings, "MAX_HISTORY_TOKENS", 3000)


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None  # optional; auto-generated if missing


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------


def _build_messages(
    question: str,
    history: list[dict],
    context_chunks: list[str],
) -> list[dict]:
    """
    Compose the OpenAI messages list from RAG context + chat history.

    Format:
      system  → instructions + RAG context
      user/assistant pairs from history
      user    → current question
    """
    context_text = "\n\n".join(context_chunks) if context_chunks else "No context available."

    system_prompt = (
        "You are a helpful AI assistant.\n\n"
        "Context (retrieved documents):\n"
        f"{context_text}"
    )

    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    # Append history (already truncated)
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Append current user question
    messages.append({"role": "user", "content": question})
    return messages


# ---------------------------------------------------------------------------
# Streaming generator
# ---------------------------------------------------------------------------


async def _chat_stream(
    messages: list[dict],
    session_id: str,
    user_message: str,
) -> AsyncGenerator[str, None]:
    """
    Call OpenAI with stream=True, yield SSE-formatted chunks.

    Special events:
      data: <text_delta>          — incremental bot text
      data: [USAGE] ...           — token usage after completion
      data: [DONE]                — signals end of stream
    """
    if _openai is None:
        yield "data: [ERROR] OpenAI client not configured. Please set OPENAI_API_KEY.\n\n"
        yield "data: [DONE]\n\n"
        return

    full_response = ""

    try:
        # ----------------------------------------------------------------
        # streaming=True: iterate over chunks as they arrive
        # ----------------------------------------------------------------
        stream = _openai.chat.completions.create(
            model=_MODEL,
            messages=messages,  # type: ignore[arg-type]
            stream=True,
            stream_options={"include_usage": True},  # get usage in final chunk
        )

        usage_data: dict | None = None

        for chunk in stream:
            # Extract text delta
            delta = chunk.choices[0].delta if chunk.choices else None
            if delta and delta.content:
                text = delta.content
                full_response += text
                # Yield as SSE — escape newlines inside the data value
                safe = text.replace("\n", "\\n")
                yield f"data: {safe}\n\n"

            # Capture usage from the final chunk (stream_options include_usage)
            if hasattr(chunk, "usage") and chunk.usage:
                usage_data = {
                    "prompt_tokens": chunk.usage.prompt_tokens,
                    "completion_tokens": chunk.usage.completion_tokens,
                    "total_tokens": chunk.usage.total_tokens,
                }

        # ----------------------------------------------------------------
        # Save assistant response to memory
        # ----------------------------------------------------------------
        if full_response:
            memory.add_message(session_id, "user", user_message)
            memory.add_message(session_id, "assistant", full_response)

        # ----------------------------------------------------------------
        # Emit token usage event
        # ----------------------------------------------------------------
        if usage_data:
            yield (
                f"data: [USAGE] "
                f"prompt={usage_data['prompt_tokens']} "
                f"completion={usage_data['completion_tokens']} "
                f"total={usage_data['total_tokens']}\n\n"
            )

    except Exception as exc:
        yield f"data: [ERROR] {str(exc)}\n\n"

    finally:
        yield "data: [DONE]\n\n"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("")
async def chat(req: ChatRequest) -> StreamingResponse:
    """
    Main streaming chat endpoint.

    1. Resolve / create session_id
    2. Retrieve relevant RAG chunks for the user's message
    3. Load + truncate history
    4. Build prompt
    5. Stream OpenAI response back as SSE
    """
    session_id = req.session_id or str(uuid.uuid4())
    question = req.message.strip()

    if not question:
        raise HTTPException(status_code=400, detail="message cannot be empty")

    # RAG retrieval
    context_chunks = rag.retrieve(question, k=3)

    # History (truncated to budget)
    raw_history = memory.get_history(session_id)
    trimmed_history = memory.truncate_history(raw_history, max_tokens=_MAX_HISTORY_TOKENS)

    # Build chat messages list
    messages = _build_messages(question, trimmed_history, context_chunks)

    return StreamingResponse(
        _chat_stream(messages, session_id, question),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Session-Id": session_id,
        },
    )


@router.post("/upload")
async def upload_documents(files: list[UploadFile] = File(...)) -> dict:
    """
    Load text documents into the RAG vector store.

    Accepts one or more .txt files. The content is chunked, embedded,
    and added to the FAISS index.
    """
    if _openai is None:
        raise HTTPException(status_code=503, detail="OpenAI client not configured")

    total_chunks = 0
    processed: list[str] = []

    for file in files:
        if not file.filename or not file.filename.endswith(".txt"):
            raise HTTPException(
                status_code=400,
                detail=f"Only .txt files are accepted, got: {file.filename}",
            )
        content = await file.read()
        text = content.decode("utf-8", errors="replace")
        chunks_added = rag.load_documents([text])
        total_chunks += chunks_added
        processed.append(file.filename)

    return {
        "status": "ok",
        "files": processed,
        "chunks_added": total_chunks,
        "index": rag.index_stats(),
    }


@router.delete("/history")
async def clear_history(session_id: str) -> dict:
    """Clear the chat history for the given session."""
    memory.clear_history(session_id)
    return {"status": "cleared", "session_id": session_id}


@router.get("/stats")
async def stats() -> dict:
    """Return RAG index statistics."""
    return rag.index_stats()
