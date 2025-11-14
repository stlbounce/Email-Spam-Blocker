import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, MoveRight, ShieldAlert, Mail, Lock, Server, RefreshCw, Loader2 } from "lucide-react";

const API_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8080";

const PROVIDER_PRESETS = {
  Yahoo: { host: "imap.mail.yahoo.com", port: 993, ssl: true, folder: "INBOX", note: "Use Yahoo App Password (not your normal password)." },
  Gmail: { host: "imap.gmail.com", port: 993, ssl: true, folder: "INBOX", note: "Use a Google App Password if 2FA is on. Basic password may be blocked." },
  iCloud: { host: "imap.mail.me.com", port: 993, ssl: true, folder: "INBOX", note: "Requires Apple App-Specific Password." },
  Outlook: { host: "outlook.office365.com", port: 993, ssl: true, folder: "INBOX", note: "Many tenants disable basic auth; may fail without OAuth." },
  Custom: { host: "", port: 993, ssl: true, folder: "INBOX" },
};

function FieldLabel({ children }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

function Input(props) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2 shadow-sm " +
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
        "w-full rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2 shadow-sm bg-white " +
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
      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    amber: "bg-amber-100 text-amber-800",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

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

  useEffect(() => {
    const p = PROVIDER_PRESETS[provider];
    if (!p) return;
    setHost(p.host);
    setPort(p.port);
    setSsl(p.ssl);
    setFolder(p.folder);
  }, [provider]);

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
        try {
          const err = JSON.parse(text);
          setError(err.message || `${res.status} ${res.statusText}`);
        } catch {
          setError(text || `${res.status} ${res.statusText}`);
        }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="flex items-center gap-3 mb-6">
          <ShieldAlert className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Email Import & Bayes Classifier</h1>
        </header>

        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel>Provider</FieldLabel>
              <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
                {Object.keys(PROVIDER_PRESETS).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </Select>
              {PROVIDER_PRESETS[provider]?.note && (
                <p className="text-xs text-amber-700 mt-1">{PROVIDER_PRESETS[provider].note}</p>
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
              <label htmlFor="ssl" className="text-sm text-gray-700">Use SSL</label>
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
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading}
                title="Connect and import"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoveRight className="h-4 w-4" />}
                {loading ? "Connecting…" : "Connect & Import"}
              </button>

              <button
                type="button"
                onClick={clearResults}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white text-gray-800 px-4 py-2 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" /> Clear
              </button>

              {error && <Badge tone="amber">{error}</Badge>}
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-sm text-gray-500">Imported</div>
            <div className="text-2xl font-semibold">{rows.length}</div>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-sm text-gray-500">Spam / Ham</div>
            <div className="text-2xl font-semibold">
              {rows.filter(r => r.isSpam).length} / {rows.filter(r => !r.isSpam).length}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-sm text-gray-500">Avg probability</div>
            <div className="text-2xl font-semibold">
              {rows.length ? (rows.reduce((a,b)=>a+(b.probability||0),0)/rows.length*100).toFixed(1) : "0.0"}%
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spam</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classified</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No results yet. Use the form above to import.</td>
                </tr>
              )}
              {rows.map((r, idx) => (
                <tr key={r.id ?? idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 truncate max-w-xs" title={r.sender}>{r.sender}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-lg" title={r.subject}>{r.subject}</td>
                  <td className="px-4 py-3">{r.isSpam ? <Badge tone="red">Spam</Badge> : <Badge tone="green">Ham</Badge>}</td>
                  <td className="px-4 py-3 text-sm">{((r.probability || 0) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm">{typeof r.score === "number" ? r.score.toFixed(3) : r.score}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.classifiedAt ? new Date(r.classifiedAt).toLocaleString() : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-8 text-xs text-gray-500 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>Passwords are used only for this request and never stored by the UI. Prefer provider App Passwords.</span>
        </footer>
      </div>
    </div>
  );
}
