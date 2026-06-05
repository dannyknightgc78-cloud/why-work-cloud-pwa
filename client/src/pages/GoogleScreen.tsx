// WHY WORK CLOUD IT PWA — Google Screen
// Design: Obsidian Command Interface — Gmail, Drive, Calendar panels
import { useState, useEffect } from "react";

const BASE_URL = "https://genie.dannygc.cloud";

interface Email { id: string; from: string; subject: string; snippet: string; date: string; }
interface DriveFile { id: string; name: string; mimeType: string; modifiedTime: string; }
interface CalEvent { id: string; summary: string; start: string; end: string; }

type Panel = "gmail" | "drive" | "calendar";

function mimeIcon(mimeType: string) {
  if (mimeType.includes("folder")) return "📁";
  if (mimeType.includes("document")) return "📄";
  if (mimeType.includes("spreadsheet")) return "📊";
  if (mimeType.includes("presentation")) return "📽️";
  if (mimeType.includes("pdf")) return "📕";
  if (mimeType.includes("image")) return "🖼️";
  return "📎";
}

export default function GoogleScreen() {
  const [connected, setConnected] = useState(false);
  const [panel, setPanel] = useState<Panel>("gmail");
  const [emails, setEmails] = useState<Email[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sendStatus, setSendStatus] = useState("");

  useEffect(() => {
    // Check if Google is connected
    fetch(`${BASE_URL}/api/google/status`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setConnected(d.connected))
      .catch(() => setConnected(false));
  }, []);

  const connectGoogle = () => {
    window.location.href = `${BASE_URL}/api/auth/google`;
  };

  const loadGmail = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${BASE_URL}/api/google/gmail/inbox`, { credentials: "include" });
      if (!r.ok) throw new Error("Not connected");
      const d = await r.json();
      setEmails(d.emails || []);
    } catch { setError("Connect your Google account first."); }
    setLoading(false);
  };

  const loadDrive = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${BASE_URL}/api/google/drive/files`, { credentials: "include" });
      if (!r.ok) throw new Error("Not connected");
      const d = await r.json();
      setFiles(d.files || []);
    } catch { setError("Connect your Google account first."); }
    setLoading(false);
  };

  const loadCalendar = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${BASE_URL}/api/google/calendar/events`, { credentials: "include" });
      if (!r.ok) throw new Error("Not connected");
      const d = await r.json();
      setEvents(d.events || []);
    } catch { setError("Connect your Google account first."); }
    setLoading(false);
  };

  const handlePanelChange = (p: Panel) => {
    setPanel(p); setError("");
    if (p === "gmail") void loadGmail();
    if (p === "drive") void loadDrive();
    if (p === "calendar") void loadCalendar();
  };

  useEffect(() => {
    if (connected) void loadGmail();
  }, [connected]);

  const sendEmail = async () => {
    setSendStatus("Sending...");
    try {
      const r = await fetch(`${BASE_URL}/api/google/gmail/send`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody }),
      });
      if (!r.ok) throw new Error("Failed");
      setSendStatus("✅ Sent!");
      setTimeout(() => { setComposeOpen(false); setSendStatus(""); setComposeTo(""); setComposeSubject(""); setComposeBody(""); }, 2000);
    } catch { setSendStatus("❌ Failed to send"); }
  };

  const panelTabs: { id: Panel; label: string; icon: string }[] = [
    { id: "gmail", label: "GMAIL", icon: "✉️" },
    { id: "drive", label: "DRIVE", icon: "💾" },
    { id: "calendar", label: "CALENDAR", icon: "📅" },
  ];

  if (!connected) {
    return (
      <div className="circuit-bg" style={{
        height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 32, gap: 24, background: "#000",
      }}>
        <div style={{ fontSize: 64 }}>🔗</div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, color: "#00d4ff", textAlign: "center" }}>
          CONNECT GOOGLE
        </div>
        <div style={{ fontSize: 14, color: "rgba(224,244,255,0.5)", textAlign: "center", lineHeight: 1.6 }}>
          Link your Google account to access Gmail, Drive, and Calendar through Genie.
        </div>
        <button
          onClick={connectGoogle}
          style={{
            padding: "14px 32px", borderRadius: 12,
            background: "rgba(0,212,255,0.15)",
            border: "1px solid #00d4ff", color: "#00d4ff",
            fontFamily: "'Orbitron', sans-serif", fontSize: 13,
            fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer",
            boxShadow: "0 0 20px rgba(0,212,255,0.2)",
          }}
        >
          CONNECT GOOGLE ACCOUNT
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#000" }}>
      {/* Panel tabs */}
      <div style={{
        display: "flex", borderBottom: "1px solid rgba(0,212,255,0.1)",
        flexShrink: 0, background: "rgba(0,0,0,0.9)",
      }}>
        {panelTabs.map(t => (
          <button key={t.id} onClick={() => handlePanelChange(t.id)} style={{
            flex: 1, padding: "12px 4px",
            background: "none", border: "none", cursor: "pointer",
            borderBottom: panel === t.id ? "2px solid #00d4ff" : "2px solid transparent",
            color: panel === t.id ? "#00d4ff" : "rgba(224,244,255,0.4)",
            fontFamily: "'Orbitron', sans-serif", fontSize: 10,
            fontWeight: panel === t.id ? 700 : 400, letterSpacing: "0.05em",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(0,212,255,0.08)", flexShrink: 0 }}>
        {panel === "gmail" && (
          <button onClick={() => setComposeOpen(true)} style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 12,
            background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)",
            color: "#00d4ff", cursor: "pointer", fontFamily: "'Orbitron', sans-serif",
          }}>
            ✏️ COMPOSE
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" />
            </div>
          </div>
        )}
        {error && <div style={{ color: "#ff4466", fontSize: 13, padding: "16px 0", textAlign: "center" }}>{error}</div>}

        {/* Gmail */}
        {panel === "gmail" && !loading && emails.map(email => (
          <div key={email.id} className="glass-panel animate-slide-up" style={{
            padding: "12px 14px", borderRadius: 10, marginBottom: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: "#00d4ff", fontWeight: 600 }}>{email.from}</div>
              <div style={{ fontSize: 10, color: "rgba(224,244,255,0.3)" }}>{email.date}</div>
            </div>
            <div style={{ fontSize: 13, color: "#e0f4ff", fontWeight: 500, marginBottom: 4 }}>{email.subject}</div>
            <div style={{ fontSize: 12, color: "rgba(224,244,255,0.5)", lineHeight: 1.4 }}>{email.snippet}</div>
          </div>
        ))}

        {/* Drive */}
        {panel === "drive" && !loading && files.map(file => (
          <div key={file.id} className="glass-panel animate-slide-up" style={{
            padding: "12px 14px", borderRadius: 10, marginBottom: 8,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>{mimeIcon(file.mimeType)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "#e0f4ff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
              <div style={{ fontSize: 11, color: "rgba(224,244,255,0.3)", marginTop: 2 }}>{new Date(file.modifiedTime).toLocaleDateString()}</div>
            </div>
          </div>
        ))}

        {/* Calendar */}
        {panel === "calendar" && !loading && events.map(ev => (
          <div key={ev.id} className="glass-panel animate-slide-up" style={{
            padding: "12px 14px", borderRadius: 10, marginBottom: 8,
          }}>
            <div style={{ fontSize: 13, color: "#00d4ff", fontWeight: 600, marginBottom: 4 }}>{ev.summary}</div>
            <div style={{ fontSize: 11, color: "rgba(224,244,255,0.4)" }}>
              {new Date(ev.start).toLocaleString()} → {new Date(ev.end).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Compose modal */}
      {composeOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "flex-end", zIndex: 100,
        }}>
          <div style={{
            width: "100%", background: "#050a14",
            border: "1px solid rgba(0,212,255,0.2)",
            borderRadius: "16px 16px 0 0", padding: 20,
          }}>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, color: "#00d4ff", marginBottom: 16 }}>COMPOSE EMAIL</div>
            {["To", "Subject"].map((label, i) => (
              <input key={label}
                value={i === 0 ? composeTo : composeSubject}
                onChange={e => i === 0 ? setComposeTo(e.target.value) : setComposeSubject(e.target.value)}
                placeholder={label}
                style={{
                  width: "100%", padding: "10px 12px", marginBottom: 10, borderRadius: 8,
                  background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.2)",
                  color: "#e0f4ff", fontSize: 14, fontFamily: "'Inter', sans-serif",
                }}
              />
            ))}
            <textarea
              value={composeBody}
              onChange={e => setComposeBody(e.target.value)}
              placeholder="Message..."
              rows={4}
              style={{
                width: "100%", padding: "10px 12px", marginBottom: 12, borderRadius: 8,
                background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.2)",
                color: "#e0f4ff", fontSize: 14, fontFamily: "'Inter', sans-serif", resize: "none",
              }}
            />
            {sendStatus && <div style={{ color: sendStatus.includes("✅") ? "#00ff88" : "#ff4466", fontSize: 13, marginBottom: 8 }}>{sendStatus}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setComposeOpen(false)} style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "rgba(224,244,255,0.5)", cursor: "pointer",
              }}>CANCEL</button>
              <button onClick={() => void sendEmail()} style={{
                flex: 2, padding: "12px", borderRadius: 10,
                background: "rgba(0,212,255,0.15)", border: "1px solid #00d4ff",
                color: "#00d4ff", fontFamily: "'Orbitron', sans-serif", fontSize: 12,
                fontWeight: 700, cursor: "pointer",
              }}>SEND</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
