// web/src/App.jsx
import React, { useState } from "react";
import EmailImportApp from "./EmailImportApp";
import SpamPage from "./SpamPage";

export default function App() {
  const [view, setView] = useState("import"); // "import" | "spam"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <span className="font-semibold text-sm text-slate-100">
            Email Spam Blocker
          </span>
          <button
            onClick={() => setView("import")}
            className={`text-xs px-2 py-1 rounded-lg ${
              view === "import"
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Import & Classify
          </button>
          <button
            onClick={() => setView("spam")}
            className={`text-xs px-2 py-1 rounded-lg ${
              view === "spam"
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Spam Review
          </button>
        </div>
      </div>

      {view === "import" ? <EmailImportApp /> : <SpamPage />}
    </div>
  );
}
