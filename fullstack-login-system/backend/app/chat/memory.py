"""
memory.py — In-memory chat history manager.

Stores per-session message history as a list of {role, content} dicts.
Provides truncation via tiktoken to stay within token budgets.
"""

import time
from typing import Any

import tiktoken

# ---------------------------------------------------------------------------
# In-memory store: session_id → list of message dicts
# ---------------------------------------------------------------------------
_store: dict[str, list[dict[str, Any]]] = {}

# Default model to count tokens against
_ENCODING_MODEL = "gpt-4o"

try:
    _enc = tiktoken.encoding_for_model(_ENCODING_MODEL)
except Exception:
    _enc = tiktoken.get_encoding("cl100k_base")


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def get_history(session_id: str) -> list[dict[str, Any]]:
    """Return the full message history for the given session."""
    return _store.get(session_id, [])


def add_message(session_id: str, role: str, content: str) -> None:
    """Append a single message to the session history."""
    if session_id not in _store:
        _store[session_id] = []
    _store[session_id].append(
        {"role": role, "content": content, "ts": time.time()}
    )


def clear_history(session_id: str) -> None:
    """Remove all messages for a session."""
    _store.pop(session_id, None)


def truncate_history(
    history: list[dict[str, Any]],
    max_tokens: int = 3000,
) -> list[dict[str, Any]]:
    """
    Truncate history from the OLDEST end to stay under max_tokens.

    We keep the most recent messages and discard old ones when the
    cumulative token count exceeds the budget.
    """
    if not history:
        return []

    # Count tokens for each message (role + content)
    def _token_count(msg: dict) -> int:
        return len(_enc.encode(msg.get("role", "") + msg.get("content", ""))) + 4

    total = sum(_token_count(m) for m in history)

    # Drop oldest messages until we're within budget
    result = list(history)
    while total > max_tokens and len(result) > 1:
        dropped = result.pop(0)
        total -= _token_count(dropped)

    return result
