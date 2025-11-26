import React, { useEffect, useState } from "react";
import { Trash2, Inbox, AlertTriangle, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

export default function SpamPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadSpam() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/messages/spam`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setRows(data);
    } catch (err) {
      setError(err.message || "Failed to load spam");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSpam();
  }, []);

  async function moveToInbox(id) {
    try {
      const res = await fetch(`${API_URL}/api/messages/${id}/move-to-inbox`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to move to inbox");
      // remove from local list
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message || "Error moving to inbox");
    }
  }

  async function deleteMessage(id) {
    if (!window.confirm("Delete this message from the spam list?")) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message || "Error deleting");
    }
  }

 return (
  <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
    <div className="max-w-7xl w-full mx-auto px-4 py-6 flex-shrink-0">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-7 w-7 text-amber-400" />
          <div>
            <h1 className="text-xl font-semibold">Spam Review</h1>
            <p className="text-sm text-slate-400">
              Messages flagged as spam by your classifier.
            </p>
          </div>
        </div>

        <button
          onClick={loadSpam}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Refresh
        </button>
      </header>

      {error && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>

    {/* ---------- TABLE AREA WITH FULL HEIGHT SCROLL ---------- */}
    <div className="flex-grow overflow-y-auto px-4 pb-6">
      <div className="max-w-7xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-400">Sender</th>
              <th className="px-4 py-2 text-left font-medium text-slate-400">Subject</th>
              <th className="px-4 py-2 text-left font-medium text-slate-400">Probability</th>
              <th className="px-4 py-2 text-left font-medium text-slate-400">Score</th>
              <th className="px-4 py-2 text-left font-medium text-slate-400">Classified</th>
              <th className="px-4 py-2 text-right font-medium text-slate-400">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No spam messages right now.
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/60">
                <td className="px-4 py-2 truncate max-w-xs" title={r.sender}>
                  {r.sender}
                </td>
                <td className="px-4 py-2 truncate max-w-lg" title={r.subject}>
                  {r.subject}
                </td>
                <td className="px-4 py-2">
                  {((r.probability ?? 0) * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-2">
                  {r.score != null ? r.score.toFixed?.(3) ?? r.score : ""}
                </td>
                <td className="px-4 py-2 text-xs text-slate-400">
                  {r.classifiedAt ? new Date(r.classifiedAt).toLocaleString() : ""}
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => moveToInbox(r.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 px-2 py-1 text-xs font-medium"
                    >
                      <Inbox className="h-3 w-3" />
                      To inbox
                    </button>

                    <button
                      onClick={() => deleteMessage(r.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-rose-500/90 hover:bg-rose-400 text-slate-950 px-2 py-1 text-xs font-medium"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading spam messages…</span>
                  </div>
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
