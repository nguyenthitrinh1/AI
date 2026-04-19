/**
 * ChatInput.tsx
 *
 * Prompt input area:
 *  - Auto-resizing textarea (capped at 200 px)
 *  - Send on Enter (Shift+Enter = newline), or Ctrl+Enter
 *  - Stop button while streaming
 *  - Character counter (soft limit 2000)
 *  - Paste support, emoji-ready
 */

"use client";

import { useCallback, useEffect, useRef, KeyboardEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  value: string;
  onChange: (val: string) => void;
}

const MAX_CHARS = 2000;

export default function ChatInput({ onSend, onStop, isStreaming, value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Auto-resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // ── Focus on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ── Send handler ─────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    onChange("");
  }, [value, isStreaming, onSend, onChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter (without Shift) = send
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
        return;
      }
      // Ctrl+Enter also sends (multiline users comfortable with Shift+Enter)
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const remaining = MAX_CHARS - value.length;
  const overLimit = remaining < 0;

  return (
    <div className="relative flex flex-col gap-2">
      {/* Input row */}
      <div
        className={`flex items-end gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${
          overLimit
            ? "border-red-500/60 bg-red-950/20"
            : isStreaming
            ? "border-violet-500/40 bg-slate-800/70"
            : "border-slate-700/60 bg-slate-800/80 focus-within:border-violet-500/70 focus-within:ring-1 focus-within:ring-violet-500/20"
        } backdrop-blur-sm`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="chat-input"
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS + 50))}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder={isStreaming ? "Waiting for response…" : "Ask anything… (Enter to send, Shift+Enter for newline)"}
          className={`flex-1 resize-none bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none leading-relaxed transition-colors ${
            isStreaming ? "cursor-not-allowed opacity-60" : ""
          }`}
          style={{ maxHeight: 200 }}
        />

        {/* Send / Stop button */}
        {isStreaming ? (
          <button
            id="chat-stop-btn"
            onClick={onStop}
            title="Stop generation"
            className="shrink-0 w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-all active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            id="chat-send-btn"
            onClick={handleSend}
            disabled={!value.trim() || overLimit}
            title="Send (Enter)"
            className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer: char counter + hint */}
      <div className="flex justify-between items-center px-1 text-[11px]">
        <span className="text-slate-600">Enter to send · Shift+Enter for newline</span>
        <span className={`font-mono ${overLimit ? "text-red-400" : remaining < 200 ? "text-amber-400" : "text-slate-600"}`}>
          {remaining < MAX_CHARS ? `${remaining >= 0 ? remaining : 0} / ${MAX_CHARS}` : ""}
        </span>
      </div>
    </div>
  );
}
