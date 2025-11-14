import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, MoveRight, ShieldAlert, Mail, Lock, Server, RefreshCw, Loader2 } from "lucide-react";

/**
 * EmailImportApp (dark + sleek + labeling)
 * - Connects to IMAP via POST /api/email/connect-and-import
 * - Lists classified emails
 * - Lets the user label each email (SPAM/HAM), which trains your Bayes model:
 *     POST /api/messages/{id}/label?value=SPAM|HAM
 */

const API_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8080";

/* Presets for common providers */
const PROVIDER_PRESETS = {
  Yahoo:   { host: "imap.mail.yahoo.com",   port: 993, ssl: true, folder: "INBOX", note: "Use a Yahoo App Password (not your normal password)." },
  Gmail:   { host: "imap.gmail.com",        port: 993, ssl: true, folder: "INBOX", note: "Use a Google App Password if 2FA is on." },
  iCloud:  { host: "imap.mail.me.com",      port: 993, ssl: true, folder: "INBOX", note: "Requires Apple app-specific password." },
  Outlook: { host: "outlook.office365.com", port: 993, ssl: true, folder: "INBOX", note: "Basic auth may be disabled by your tenant." },
  Custom:  { host: "", port: 993, ssl: true, folder: "INBOX" },
};

/* ---------- UI bits (dark-aware) ---------- */
function FieldLabel({ children }) {
  return <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{children}</label>;
}

function Input(props) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border border-gray-300 dark:border-gray-600 " +
        "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 " +
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2 shadow-sm " +
        (props.className || "")
      }
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={
        "w-full rounded-xl border border-gray-300 dark:border-gray-600 " +
        "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 " +
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2 shadow-sm " +
        (props.className || "")
      }
    />
  );
}

function Checkbox({ checked, onChange, id }) {
  return (
    <input
      id={id}
      type="checkbox"
      className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray:  "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
    green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    red:   "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    blue:  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

/* ---------- Dark mode toggle (persisted) ---------- */
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}
function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") return saved;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
}
function ThemeToggle() {
  const [mode, setMode] = useState(getInitialTheme);
  useEffect(() => { applyTheme(mode); localStorage.setItem("theme", mode); }, [mode]);
  const isDark = mode === "dark";
  return (
    <button
      onClick={() => setMode(isDark ? "light" : "dark")}
      className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border
                 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
                 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}

/* ---------- Main component ---------- */
export default function EmailImportApp() {
  const [provider, setProvider] = useState("Yahoo");
  const [host, setHost] = useState(PROVIDER_PRESETS.Yahoo.host);
  const [port, setPort] = useState(PROVIDER_PRESETS.Yahoo.port);
  const [ssl, setSsl] = useState(PROVIDER_PRESETS.Yahoo.ssl);
  const [folder, setFolder] = useState(PROVIDER_PRESETS.Yahoo.folder);
  const [username, setUsername] = useState(localStorage.getItem("email.username") || "");
  const [password, setPassword] = useState("");
  const [max, setMax] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [labelingIds, setLabelingIds] = useState(() => new Set()); // track rows being labeled

  /* When provider changes, auto-fill fields */
  useEffect(() => {
    const p = PROVIDER_PRESETS[provider]; if (!p) return;
    setHost(p.host); setPort(p.port); setSsl(p.ssl); setFolder(p.folder);
  }, [provider]);

  /* Stats */
  const stats = useMemo(() => {
    const total = rows.length;
    const spam = rows.filter((r) => r.isSpam).length;
    const ham = total - spam;
    const avgProb = total ? rows.reduce((a, b) => a + (b.probability || 0), 0) / total : 0;
    return { total, spam, ham, avgProb };
  }, [rows]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!host || !username || !password) {
      setError("Host, username, and password are required.");
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem("email.username", username);
      const payload = { host, port: Number(port), ssl, folder, username, password, max: Number(max) };
      const res = await fetch(`${API_URL}/api/email/connect-and-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) {
        try { setError(JSON.parse(text).message || `${res.status} ${res.statusText}`); }
        catch { setError(text || `${res.status} ${res.statusText}`); }
        return;
      }
      const data = text ? JSON.parse(text) : [];
      setRows(data);
    } catch (err) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  function clearResults() { setRows([]); }

  /* Label + train one message */
  async function labelMessage(id, value) {
    if (!id) return;
    // mark loading for this id
    setLabelingIds(prev => new Set(prev).add(id));
    // optimistic UI
    setRows(prev => prev.map(r => r.id === id ? { ...r, label: value } : r));
    try {
      const res = await fetch(`${API_URL}/api/messages/${id}/label?value=${value}`, { method: "POST" });
      const text = await res.text();
      if (!res.ok) {
        // rollback label on failure
        setRows(prev => prev.map(r => r.id === id ? { ...r, label: undefined } : r));
        try { setError(JSON.parse(text).message || `${res.status} ${res.statusText}`); }
        catch { setError(text || `${res.status} ${res.statusText}`); }
        return;
      }
      const updated = text ? JSON.parse(text) : null;
      if (updated) setRows(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    } catch (err) {
      setError(err?.message || "Network error");
      // rollback label
      setRows(prev => prev.map(r => r.id === id ? { ...r, label: undefined } : r));
    } finally {
      setLabelingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  const actionsCell = (r) => {
    const busy = labelingIds.has(r.id);
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => labelMessage(r.id, "SPAM")}
          disabled={busy}
          className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-60"
          title="Mark as Spam and train"
        >
          {busy ? "…" : "Mark Spam"}
        </button>
        <button
          onClick={() => labelMessage(r.id, "HAM")}
          disabled={busy}
          className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-60"
          title="Mark as Ham and train"
        >
          {busy ? "…" : "Mark Ham"}
        </button>
        {r.label && <span className="ml-1"><Badge tone={r.label === "SPAM" ? "red" : "green"}>Labeled: {r.label}</Badge></span>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center gap-3 mb-6">
          <ShieldAlert className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-semibold">Email Import & Bayes Classifier</h1>
          <ThemeToggle />
        </header>

        {/* Card: Form */}
        <div className="bg-white dark:bg-gray-900/60 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel>Provider</FieldLabel>
              <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
                {Object.keys(PROVIDER_PRESETS).map((k) => <option key={k} value={k}>{k}</option>)}
              </Select>
              {PROVIDER_PRESETS[provider]?.note && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{PROVIDER_PRESETS[provider].note}</p>
              )}
            </div>

            <div>
              <FieldLabel>IMAP Host</FieldLabel>
              <div className="relative">
                <Server className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input style={{ paddingLeft: 34 }} value={host} onChange={(e) => setHost(e.target.value)} placeholder="imap.mail.yahoo.com" />
              </div>
            </div>

            <div>
              <FieldLabel>Port</FieldLabel>
              <Input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} />
            </div>

            <div className="flex items-center gap-2 mt-7">
              <Checkbox id="ssl" checked={ssl} onChange={setSsl} />
              <label htmlFor="ssl" className="text-sm text-gray-700 dark:text-gray-300">Use SSL</label>
            </div>

            <div>
              <FieldLabel>Folder</FieldLabel>
              <Input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="INBOX" />
            </div>

            <div>
              <FieldLabel>Email (username)</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input style={{ paddingLeft: 34 }} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="you@yahoo.com" autoComplete="username" />
              </div>
            </div>

            <div>
              <FieldLabel>App password</FieldLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input style={{ paddingLeft: 34 }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="•••• •••• •••• ••••" autoComplete="current-password" />
              </div>
            </div>

            <div>
              <FieldLabel>Max messages</FieldLabel>
              <Input type="number" value={max} min={1} max={100} onChange={(e) => setMax(Number(e.target.value))} />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 hover:bg-indigo-700 dark:hover:bg-indigo-400 disabled:opacity-50"
                disabled={loading}
                title="Connect and import"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoveRight className="h-4 w-4" />}
                {loading ? "Connecting…" : "Connect & Import"}
              </button>

              <button
                type="button"
                onClick={clearResults}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4" /> Clear
              </button>

              {error && <Badge tone="amber">{error}</Badge>}
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { title: "Imported", value: String(stats.total) },
            { title: "Spam / Ham", value: `${stats.spam} / ${stats.ham}` },
            { title: "Avg probability", value: `${(stats.avgProb * 100).toFixed(1)}%` },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900/60 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">{s.title}</div>
              <div className="text-2xl font-semibold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-gray-900/60 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {["Sender","Subject","Spam","Probability","Score","Classified","Actions"].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No results yet. Use the form above to import.
                  </td>
                </tr>
              )}
              {rows.map((r, idx) => (
                <tr key={r.id ?? idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs" title={r.sender}>{r.sender}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 truncate max-w-lg" title={r.subject}>{r.subject}</td>
                  <td className="px-4 py-3">{r.isSpam ? <Badge tone="red">Spam</Badge> : <Badge tone="green">Ham</Badge>}</td>
                  <td className="px-4 py-3 text-sm">{((r.probability || 0) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm">{typeof r.score === "number" ? r.score.toFixed(3) : r.score}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{r.classifiedAt ? new Date(r.classifiedAt).toLocaleString() : ""}</td>
                  <td className="px-4 py-3">{actionsCell(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-8 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>Passwords are used only for this request and never stored by the UI. Prefer provider App Passwords.</span>
        </footer>
      </div>
    </div>
  );
}
