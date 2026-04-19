/**
 * DocumentUpload.tsx
 *
 * Allows users to upload .txt files into the backend's RAG vector store.
 * Shows current index stats (number of indexed chunks).
 */

"use client";

import { useCallback, useRef, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

interface IndexStats {
  chunks: number;
  indexed: boolean;
}

export default function DocumentUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<IndexStats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFiles, setLastFiles] = useState<string[]>([]);

  /** Fetch RAG index stats from the backend */
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/chat/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // silently ignore
    }
  }, []);

  /** Upload selected files to /chat/upload */
  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setUploading(true);
      setError(null);

      const formData = new FormData();
      const names: string[] = [];
      for (const file of Array.from(files)) {
        formData.append("files", file, file.name);
        names.push(file.name);
      }

      try {
        const res = await fetch(`${BACKEND_URL}/chat/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Upload failed" }));
          throw new Error(err.detail ?? "Upload failed");
        }

        const data = await res.json();
        setStats(data.index);
        setLastFiles(names);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    []
  );

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        {/* Icon */}
        <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-slate-300">Knowledge Base (RAG)</span>

        {/* Stats pill */}
        <div
          className={`ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full border ${
            stats?.indexed
              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
              : "text-slate-500 border-slate-700/40 bg-slate-800/50"
          }`}
          onClick={fetchStats}
          role="button"
          title="Click to refresh"
        >
          {stats?.indexed ? `${stats.chunks} chunks indexed` : "No documents loaded"}
        </div>
      </div>

      {/* Upload area */}
      <label
        htmlFor="rag-file-input"
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${
          uploading
            ? "border-violet-500/40 bg-violet-500/5 cursor-wait"
            : "border-slate-700/60 hover:border-violet-500/50 hover:bg-violet-500/5"
        }`}
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-violet-400 text-sm">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading & embedding…
          </div>
        ) : (
          <>
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-xs text-slate-500">
              Drop <strong className="text-slate-400">.txt</strong> files or{" "}
              <span className="text-violet-400 underline underline-offset-2">browse</span>
            </span>
          </>
        )}
      </label>
      <input
        id="rag-file-input"
        ref={fileInputRef}
        type="file"
        accept=".txt"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
        disabled={uploading}
      />

      {/* Error */}
      {error && (
        <p className="mt-2 text-[11px] text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-1.5">
          ⚠️ {error}
        </p>
      )}

      {/* Last uploaded */}
      {lastFiles.length > 0 && (
        <p className="mt-2 text-[11px] text-emerald-400">
          ✓ Indexed: {lastFiles.join(", ")}
        </p>
      )}
    </div>
  );
}
