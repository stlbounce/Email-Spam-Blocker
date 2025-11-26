// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Mail,
  Inbox as InboxIcon,
  AlertTriangle,
  Activity,
} from "lucide-react";

import InboxPage from "./InboxPage";
import SpamPage from "./SpamPage";
import LiveView from "./LiveView";
import EmailImportApp from "./EmailImportApp";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

const TABS = [
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "spam", label: "Spam", icon: AlertTriangle },
  { id: "live", label: "Live Stream", icon: Activity },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  // ---- shared loader for all tabs ----
  const loadMessages = useCallback(async () => {
    setLoadingMessages(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/messages`);
      if (!res.ok) {
        throw new Error(`Load failed: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error("loadMessages error", e);
      setError(e.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Called when import finishes
  const handleImported = () => {
    loadMessages();
  };

  // Called when user labels a message (from Inbox or Spam tab)
  const handleLabelChange = async (id, label) => {
    try {
      await fetch(`${API_URL}/api/messages/${id}/label?value=${label}`, {
        method: "POST",
      });
    } catch (e) {
      console.error("label error", e);
    }
    loadMessages();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top bar + tabs */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Email Spam Filter</h1>
              <p className="text-xs text-slate-400">
                Import, classify and review your messages.
              </p>
            </div>
          </div>

          <nav className="flex gap-2">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = id === activeTab;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition " +
                    (active
                      ? "bg-slate-800 text-slate-50 border border-slate-600"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800/80 hover:text-slate-100")
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Page content area (full height, scrollable) */}
      <main className="flex-1 overflow-auto bg-slate-950">
        {activeTab === "inbox" && (
          <InboxPage
            messages={messages}
            loading={loadingMessages}
            error={error}
            onRefresh={loadMessages}
            onLabelChange={handleLabelChange}
          >
            {/* Import widget at top of Inbox */}
            <EmailImportApp onImported={handleImported} />
          </InboxPage>
        )}

        {activeTab === "spam" && (
          <SpamPage
            messages={messages}
            loading={loadingMessages}
            error={error}
            onRefresh={loadMessages}
            onLabelChange={handleLabelChange}
          />
        )}

        {activeTab === "live" && <LiveView />}
      </main>
    </div>
  );
}
