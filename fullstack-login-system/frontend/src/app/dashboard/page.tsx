"use client";

/**
 * Dashboard page — protected route.
 *
 * Layout:
 *  ┌─────────────────────────────────────────────────────┐
 *  │  Header: App title · User pill · Logout            │
 *  ├──────────────┬──────────────────────────────────────┤
 *  │  Sidebar     │  ChatBox (main area)                 │
 *  │  · Profile   │                                      │
 *  │  · RAG Upload│                                      │
 *  │  · Stats     │                                      │
 *  └──────────────┴──────────────────────────────────────┘
 */

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatBox from "@/components/chat/ChatBox";
import DocumentUpload from "@/components/chat/DocumentUpload";

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Top header ───────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">AI Chat Dashboard</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Streaming · RAG · Memory</p>
          </div>
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/70 border border-slate-700/50">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="text-xs text-slate-300 max-w-[160px] truncate">{user?.email}</span>
          </div>
          <button
            id="logout-btn"
            onClick={logout}
            className="px-4 py-1.5 rounded-lg bg-red-600/20 border border-red-600/30 hover:bg-red-600/30 text-red-400 text-xs font-semibold transition-all active:scale-95"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 border-r border-slate-800/70 bg-slate-900/50 p-4 flex flex-col gap-4 overflow-y-auto hidden lg:flex">
          {/* User profile card */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-3">Profile</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div>
                <p className="text-sm text-white font-medium truncate max-w-[160px]">{user?.email}</p>
                <p className="text-[11px] text-slate-500">ID #{user?.id}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Joined</span>
                <span className="text-slate-300">
                  {user ? new Date(user.created_at).toLocaleDateString() : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* RAG Document uploader */}
          <DocumentUpload />

          {/* Tips card */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 mt-auto">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Tips</p>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li className="flex gap-2">
                <span className="text-violet-400 shrink-0">⌨</span>
                <span>Press <kbd className="bg-slate-700/60 border border-slate-600/50 rounded px-1 py-0.5 text-[10px]">Enter</kbd> to send</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400 shrink-0">📄</span>
                <span>Upload .txt files to enable RAG</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400 shrink-0">🧠</span>
                <span>Chat history is preserved per session</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400 shrink-0">⏹</span>
                <span>Click Stop to cancel generation</span>
              </li>
            </ul>
          </div>
        </aside>

        {/* ── Chat main area ──────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
          <div className="flex-1 min-h-0">
            <ChatBox />
          </div>
        </main>
      </div>
    </div>
  );
}
