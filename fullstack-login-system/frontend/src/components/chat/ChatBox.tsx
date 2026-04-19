/**
 * ChatBox.tsx
 *
 * The main chat container. Wires together:
 *  - useChatStream hook for streaming state
 *  - MessageBubble list with virtual-safe auto-scroll
 *  - ChatInput for user input
 *  - Welcome empty state
 *  - Clear history button
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStream } from "@/hooks/useChatStream";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

export default function ChatBox() {
  const { messages, isStreaming, sendMessage, clearHistory, stopStream } =
    useChatStream();

  const [inputValue, setInputValue] = useState("");
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll to bottom whenever messages grow ─────────────────────────
  useEffect(() => {
    const anchor = scrollAnchorRef.current;
    if (!anchor) return;
    anchor.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // ── Scroll to bottom on new streaming chunk without jerking ──────────────
  useEffect(() => {
    if (!isStreaming) return;
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      scrollAnchorRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
    }
  });

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm overflow-hidden shadow-2xl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50 bg-slate-800/60 shrink-0">
        <div className="flex items-center gap-3">
          {/* Animated pulse ring */}
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            {isStreaming && (
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 leading-none">AI Assistant</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isStreaming ? "Generating response…" : "Powered by OpenAI · RAG enabled"}
            </p>
          </div>
        </div>

        {/* Clear button */}
        {messages.length > 0 && (
          <button
            id="chat-clear-btn"
            onClick={clearHistory}
            disabled={isStreaming}
            title="Clear conversation"
            className="text-[11px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* ── Messages area ───────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-5 py-5 space-y-1 scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
      >
        {messages.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 select-none">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 border border-violet-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-slate-300 font-semibold text-lg mb-1">Start a conversation</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Ask me anything. I support chat history and can reference uploaded documents via RAG.
              </p>
            </div>
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                "What can you help me with?",
                "Explain how RAG works",
                "Summarize my documents",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInputValue(prompt);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-700/70 bg-slate-800/60 text-slate-400 hover:border-violet-500/50 hover:text-violet-300 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {/* Scroll anchor */}
        <div ref={scrollAnchorRef} className="h-1" />
      </div>

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-slate-700/50 bg-slate-800/40 shrink-0">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={sendMessage}
          onStop={stopStream}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
