import React, { useEffect, useMemo, useRef, useState } from "react";

const API_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8080";

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray:  "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
    green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    red:   "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export default function LiveView() {
  const [rows, setRows] = useState([]);     // newest first
  const [status, setStatus] = useState("disconnected");
  const esRef = useRef(null);

  useEffect(() => {
    const url = `${API_URL}/api/messages/stream?last=50`;
    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;

    es.onopen = () => setStatus("connected");
    es.onerror = () => setStatus("error");
    es.addEventListener("hello", () => setStatus("connected"));
    es.addEventListener("keepalive", () => { /* noop */ });

    es.addEventListener("message", (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        // de-dup by id, newest first
        setRows(prev => {
          const exist = msg.id && prev.some(r => r.id === msg.id);
          const next = exist ? prev.map(r => r.id === msg.id ? msg : r) : [msg, ...prev];
          return next.slice(0, 500); // cap
        });
      } catch { /* ignore parse errors */ }
    });

    return () => { es.close(); setStatus("disconnected"); };
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const spam = rows.filter(r => r.isSpam).length;
    const ham  = total - spam;
    return { total, spam, ham };
  }, [rows]);

  return (
    <div className="min-h-[100svh] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-semibold">Live Stream</h1>
          <span className="text-sm">
            Status:&nbsp;
            <Badge tone={status === "connected" ? "green" : (status === "error" ? "red" : "gray")}>
              {status}
            </Badge>
          </span>
          <button
            onClick={() => { setRows([]); }}
            className="ml-auto px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Clear
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900/60 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total seen</div>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-gray-900/60 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Spam</div>
            <div className="text-2xl font-semibold">{stats.spam}</div>
          </div>
          <div className="bg-white dark:bg-gray-900/60 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Ham</div>
            <div className="text-2xl font-semibold">{stats.ham}</div>
          </div>
        </div>

        {/* Streamed table */}
        <div className="bg-white dark:bg-gray-900/60 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 overflow-x-auto max-h-[75vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              <tr>
                {["Sender","Subject","Spam","Probability","Score","Classified"].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Waiting for events…
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-4 py-3 text-sm truncate max-w-xs" title={r.sender}>{r.sender}</td>
                  <td className="px-4 py-3 text-sm truncate max-w-lg" title={r.subject}>{r.subject}</td>
                  <td className="px-4 py-3">{r.isSpam ? <Badge tone="red">Spam</Badge> : <Badge tone="green">Ham</Badge>}</td>
                  <td className="px-4 py-3 text-sm">{((r.probability || 0) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm">{typeof r.score === "number" ? r.score.toFixed(3) : r.score}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{r.classifiedAt ? new Date(r.classifiedAt).toLocaleString() : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Open another tab and run an import/classify — new rows will appear here instantly.
        </p>
      </div>
    </div>
  );
}
