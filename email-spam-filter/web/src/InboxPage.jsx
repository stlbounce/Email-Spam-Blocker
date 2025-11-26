// src/InboxPage.jsx
import React, { useMemo } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function InboxPage({
  messages,
  loading,
  error,
  onRefresh,
  onLabelChange,
  children, // EmailImportApp will be passed in here
}) {
  // HAM = not spam OR explicitly labeled HAM
  const ham = useMemo(
    () =>
      (messages || []).filter(
        (m) => m.label === "HAM" || (!m.isSpam && m.label !== "SPAM")
      ),
    [messages]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* Import widget */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-lg">
        {children}
      </div>

      {/* Stats + controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>{ham.length} messages in Inbox view (HAM only)</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {loading && <span className="text-slate-400">Refreshing…</span>}
          {error && (
            <span className="text-amber-400 inline-flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {error}
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-100 text-xs border border-slate-700 hover:bg-slate-700"
          >
            Reload inbox
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Sender
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Subject
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Probability
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Score
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Label
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {ham.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No HAM messages yet. Try importing some emails.
                  </td>
                </tr>
              )}

              {ham.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-slate-800/70 transition-colors"
                >
                  <td className="px-4 py-2 align-top max-w-xs truncate">
                    <div className="text-slate-100 truncate" title={m.sender}>
                      {m.sender}
                    </div>
                  </td>
                  <td className="px-4 py-2 align-top max-w-lg truncate">
                    <div
                      className="text-slate-200 truncate"
                      title={m.subject}
                    >
                      {m.subject}
                    </div>
                  </td>
                  <td className="px-4 py-2 align-top text-slate-300">
                    {(m.probability * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 align-top text-slate-300">
                    {m.score?.toFixed?.(3) ?? m.score}
                  </td>
                  <td className="px-4 py-2 align-top">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
                      HAM
                    </span>
                  </td>
                  <td className="px-4 py-2 align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onLabelChange(m.id, "SPAM")}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/40 hover:bg-rose-500/20"
                      >
                        Mark as Spam
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-slate-400"
                  >
                    Loading inbox…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
