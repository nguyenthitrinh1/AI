/**
 * MessageBubble.tsx
 *
 * Renders a single chat message:
 *  - User message: right-aligned, indigo gradient bubble
 *  - Bot message:  left-aligned, slate bubble + blinking cursor while streaming
 *  - Token usage badge shown below bot messages once [USAGE] is received
 */

import React, { memo } from "react";
import type { Message } from "@/hooks/useChatStream";

interface Props {
  message: Message;
}

const MessageBubble = memo(function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[78%]`}>
        {/* Avatar + Label */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              isUser
                ? "bg-indigo-500 text-white"
                : "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white"
            }`}
          >
            {isUser ? "U" : "AI"}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {isUser ? "You" : "Assistant"}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-md ${
            isUser
              ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm"
              : message.error
              ? "bg-red-950/60 border border-red-800/50 text-red-300 rounded-tl-sm"
              : "bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tl-sm backdrop-blur-sm"
          }`}
        >
          {/* Message text */}
          <span>{message.content}</span>

          {/* Blinking cursor while streaming */}
          {message.streaming && !message.error && (
            <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 align-middle animate-[cursor-blink_0.85s_step-end_infinite]" />
          )}

          {/* Loading skeleton while waiting for first token */}
          {message.streaming && message.content === "" && (
            <div className="flex gap-1.5 items-center py-0.5">
              <span
                className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          )}
        </div>

        {/* Token usage badge */}
        {message.usage && (
          <div className="flex items-center gap-2 mt-1.5 px-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-800/50 border border-slate-700/40 rounded-full px-2.5 py-0.5">
              <span title="Prompt tokens">📥 {message.usage.prompt}</span>
              <span className="text-slate-600">·</span>
              <span title="Completion tokens">📤 {message.usage.completion}</span>
              <span className="text-slate-600">·</span>
              <span title="Total tokens" className="text-violet-400 font-semibold">
                Σ {message.usage.total}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default MessageBubble;
