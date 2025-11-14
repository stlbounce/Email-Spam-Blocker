<<<<<<< Updated upstream
import { useEffect, useState } from "react";
import { api } from "./api";

type Rule = { id?: number; type: "KEYWORD" | "SENDER"; value: string; action: "MARK_SPAM" | "ALLOW" };
type Message = { id?: number; sender?: string; subject?: string; snippet?: string; isSpam?: boolean };

export default function App() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [draftRule, setDraftRule] = useState<Rule>({ type: "KEYWORD", value: "", action: "MARK_SPAM" });
  const [msg, setMsg] = useState<Message>({ sender: "", subject: "", snippet: "" });
  const [classified, setClassified] = useState<Message | null>(null);

  const loadRules = async () => {
    const { data } = await api.get<Rule[]>("/rules");
    setRules(data);
  };

  useEffect(() => { loadRules(); }, []);

  const addRule = async () => {
    await api.post("/rules", draftRule);
    setDraftRule({ type:"KEYWORD", value:"", action:"MARK_SPAM" });
    loadRules();
  };

  const delRule = async (id: number) => {
    await api.delete(`/rules/${id}`);
    loadRules();
  };

  const classify = async () => {
    const { data } = await api.post<Message>("/messages/classify", msg);
    setClassified(data);
  };

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Spam Filter (MVP)</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Rules</h2>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <label>Type</label>
          <select value={draftRule.type} onChange={e => setDraftRule(r => ({...r, type: e.target.value as any}))}>
            <option>KEYWORD</option>
            <option>SENDER</option>
          </select>
          <label>Value</label>
          <input placeholder="win money or bad@spam.com" value={draftRule.value}
                 onChange={e => setDraftRule(r => ({...r, value: e.target.value}))}/>
          <label>Action</label>
          <select value={draftRule.action} onChange={e => setDraftRule(r => ({...r, action: e.target.value as any}))}>
            <option>MARK_SPAM</option>
            <option>ALLOW</option>
          </select>
          <button onClick={addRule}>Add</button>
        </div>

        <ul>
          {rules.map(r => (
            <li key={r.id}>
              [{r.type}] "{r.value}" → {r.action} <button onClick={() => delRule(r.id!)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Test Classification</h2>
        <div style={{ display:"grid", gap:8 }}>
          <input placeholder="sender" value={msg.sender} onChange={e => setMsg(m => ({...m, sender: e.target.value}))}/>
          <input placeholder="subject" value={msg.subject} onChange={e => setMsg(m => ({...m, subject: e.target.value}))}/>
          <textarea placeholder="snippet" value={msg.snippet} onChange={e => setMsg(m => ({...m, snippet: e.target.value}))}/>
          <button onClick={classify}>Classify</button>
        </div>

        {classified && (
          <div style={{ marginTop: 8, padding: 8, border: "1px solid #ddd" }}>
            <div><b>Spam?</b> {String(classified.isSpam)}</div>
            <div><b>Saved ID:</b> {classified.id}</div>
          </div>
        )}
      </section>
    </div>
  );
=======
import React from 'react';
import EmailImportApp from './EmailImportApp.jsx'; 
import './index.css';

export default function App() {
  return <EmailImportApp />;
>>>>>>> Stashed changes
}
