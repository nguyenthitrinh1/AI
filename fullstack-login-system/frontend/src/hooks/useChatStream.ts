/**
 * useChatStream.ts
 *
 * Custom hook that manages the entire chat lifecycle:
 *  - Sending a message via fetch
 *  - Reading the SSE streaming response via ReadableStream + TextDecoder
 *  - Appending text deltas to the current bot message (non-blocking)
 *  - Parsing [USAGE] and [DONE] sentinel events
 *  - Auto-retry on stream failure (up to MAX_RETRIES)
 *  - Storing the full conversation in local state
 */

"use client";

import { useCallback, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Populated once the [USAGE] event arrives (assistant messages only) */
  usage?: TokenUsage;
  /** True while this message is still being streamed */
  streaming?: boolean;
  error?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const MAX_RETRIES = 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * Parse the [USAGE] sentinel:
 *   "data: [USAGE] prompt=42 completion=128 total=170"
 */
function parseUsage(line: string): TokenUsage | null {
  const match = line.match(/\[USAGE\]\s+prompt=(\d+)\s+completion=(\d+)\s+total=(\d+)/);
  if (!match) return null;
  return {
    prompt: parseInt(match[1], 10),
    completion: parseInt(match[2], 10),
    total: parseInt(match[3], 10),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  /** Stable session-id across page lifecycle */
  const sessionIdRef = useRef<string>(generateId());

  /** Used to abort an in-flight stream */
  const abortControllerRef = useRef<AbortController | null>(null);

  // -------------------------------------------------------------------------
  // Core streaming logic
  // -------------------------------------------------------------------------

  const _streamOnce = useCallback(
    async (userText: string, botMsgId: string): Promise<boolean> => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          session_id: sessionIdRef.current,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const reader = res.body.getReader();
      // TextDecoder converts Uint8Array bytes → string
      const decoder = new TextDecoder();
      let buffer = "";

      // -----------------------------------------------------------------------
      // Read loop — runs until the stream closes or [DONE] arrives
      // Non-blocking: the browser stays responsive between each iteration
      // -----------------------------------------------------------------------
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Accumulate decoded bytes in a buffer (chunks may split across SSE lines)
        buffer += decoder.decode(value, { stream: true });

        // Process each complete SSE line (separated by \n\n)
        const events = buffer.split("\n\n");
        // The last element is either empty or an incomplete event — keep it
        buffer = events.pop() ?? "";

        for (const event of events) {
          // SSE format: "data: <payload>"
          const line = event.trim();
          if (!line.startsWith("data:")) continue;

          const payload = line.slice(5).trim(); // everything after "data: "

          // ── Terminal events ──────────────────────────────────────────────
          if (payload === "[DONE]") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId ? { ...m, streaming: false } : m
              )
            );
            return true; // success
          }

          if (payload.startsWith("[ERROR]")) {
            const errMsg = payload.slice(7).trim();
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, content: `⚠️ ${errMsg}`, streaming: false, error: true }
                  : m
              )
            );
            return false;
          }

          // ── Usage event ──────────────────────────────────────────────────
          if (payload.startsWith("[USAGE]")) {
            const usage = parseUsage(payload);
            if (usage) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, usage } : m
                )
              );
            }
            continue;
          }

          // ── Text delta ───────────────────────────────────────────────────
          // Restore newlines that were escaped before sending
          const textChunk = payload.replace(/\\n/g, "\n");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, content: m.content + textChunk }
                : m
            )
          );
        }
      }

      return true;
    },
    []
  );

  // -------------------------------------------------------------------------
  // Public: sendMessage
  // -------------------------------------------------------------------------

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      // Add user message immediately
      const userMsgId = generateId();
      const botMsgId = generateId();

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: trimmed },
        { id: botMsgId, role: "assistant", content: "", streaming: true },
      ]);

      setIsStreaming(true);

      let attempt = 0;
      let success = false;

      while (attempt <= MAX_RETRIES && !success) {
        try {
          if (attempt > 0) {
            // Brief pause before retry
            await new Promise((r) => setTimeout(r, 1000 * attempt));
            // Reset bot message content for retry
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, content: "", streaming: true, error: false }
                  : m
              )
            );
          }
          success = await _streamOnce(trimmed, botMsgId);
        } catch (err: unknown) {
          attempt++;
          if (attempt > MAX_RETRIES) {
            const msg = err instanceof Error ? err.message : String(err);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? {
                      ...m,
                      content: `⚠️ Connection error after ${MAX_RETRIES} retries: ${msg}`,
                      streaming: false,
                      error: true,
                    }
                  : m
              )
            );
          }
        } finally {
          if (success || attempt > MAX_RETRIES) break;
          attempt++;
        }
      }

      setIsStreaming(false);
      abortControllerRef.current = null;
    },
    [isStreaming, _streamOnce]
  );

  // -------------------------------------------------------------------------
  // Public: clearHistory
  // -------------------------------------------------------------------------

  const clearHistory = useCallback(async () => {
    // Clear local state
    setMessages([]);

    // Clear server-side history
    try {
      await fetch(
        `${BACKEND_URL}/chat/history?session_id=${sessionIdRef.current}`,
        { method: "DELETE" }
      );
    } catch {
      // non-fatal
    }

    // Regenerate session ID so old history doesn't bleed through
    sessionIdRef.current = generateId();
  }, []);

  // -------------------------------------------------------------------------
  // Public: stopStream
  // -------------------------------------------------------------------------

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
    );
  }, []);

  return { messages, isStreaming, sendMessage, clearHistory, stopStream };
}
