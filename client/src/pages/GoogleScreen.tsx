// WHY WORK CLOUD IT PWA — Google Screen
// Cross-domain auth: after OAuth, Genie server redirects to app.dannygc.cloud?genie_token=XXX
// Token is stored in localStorage and sent as X-Genie-Session header on all API calls
import { useState, useEffect, useCallback } from "react";

const BASE_URL = "https://genie.dannygc.cloud";
const TOKEN_KEY = "genie_google_token";

interface Email { id: string; from: string; subject: string; snippet: string; date: string; }
interface DriveFile { id: string; name: string; mimeType: string; modifiedTime: string; }
interface CalEvent { id: string; summary: string; start: string; end: string; }
interface GoogleUser { email: string; name: string; picture: string; }

type Panel = "gmail" | "drive" | "calendar";

function getToken(): string { return localStorage.getItem(TOKEN_KEY) || ""; }
function setToken(t: string) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

function genieHeaders(): HeadersInit {
  const token = getToken();
  return token ? { "X-Genie-Session": token } : {};
}

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
  const [user, setUser] = useState<GoogleUser | null>(null);
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

  // On mount: capture token from URL if redirected from OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("genie_token");
    const googleStatus = params.get("google");
    if (urlToken) {
      setToken(urlToken);
      // Clean the URL
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
    if (googleStatus === "error") {
      setError("Google sign-in failed. Please try again.");
    }
    // Check status with stored token
    checkStatus();
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const r = await fetch(`${BASE_URL}/api/google/status`, {
        headers: genieHeaders(),
      });
      const d = await r.json();
      if (d.connected) {
        setConnected(true);
        setUser({ email: d.email, name: d.name, picture: d.picture });
      } else {
        setConnected(false);
        setUser(null);
      }
    } catch {
      setConnected(false);
    }
  }, []);

  const connectGoogle = () => {
    // Redirect to Genie OAuth — callback will redirect back to app.dannygc.cloud with token
    window.location.href = `${BASE_URL}/api/auth/google`;
  };

  const disconnectGoogle = async () => {
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, { headers: genieHeaders() });
    } catch {}
    clearToken();
    setConnected(false);
    setUser(null);
    setEmails([]); setFiles([]); setEvents([]);
  };

  const loadGmail = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${BASE_URL}/api/google/gmail/inbox`, { headers: genieHeaders() });
      if (!r.ok) throw new Error("Not connected");
      const d = await r.json();
      setEmails(d.emails || []);
    } catch { setError("Could not load Gmail. Try reconnecting."); }
    setLoading(false);
  }, []);

  const loadDrive = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${BASE_URL}/api/google/drive/files`, { headers: genieHeaders() });
      if (!r.ok) throw new Error("Not connected");
      const d = await r.json();
      setFiles(d.files || []);
    } catch { setError("Could not load Drive. Try reconnecting."); }
    setLoading(false);
  }, []);

  const loadCalendar = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${BASE_URL}/api/google/calendar/events`, { headers: genieHeaders() });
      if (!r.ok) throw new Error("Not connected");
      const d = await r.json();
      setEvents(d.events || []);
    } catch { setError("Could not load Calendar. Try reconnecting."); }
    setLoading(false);
  }, []);

  const handlePanelChange = (p: Panel) => {
    setPanel(p); setError("");
    if (p === "gmail") void loadGmail();
    if (p === "drive") void loadDrive();
    if (p === "calendar") void loadCalendar();
  };

  useEffect(() => {
    if (connected) void loadGmail();
  }, [connected, loadGmail]);

  const sendEmail = async () => {
    setSendStatus("Sending...");
    try {
      const r = await fetch(`${BASE_URL}/api/google/gmail/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...genieHeaders() },
        body: JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody }),
      });
      if (!r.ok) throw new Error("Failed");
      setSendStatus("✅ Sent!");
      setTimeout(() => {
        setComposeOpen(false); setSendStatus("");
        setComposeTo(""); setComposeSubject(""); setComposeBody("");
      }, 2000);
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
          Link your Google account so Genie can access Gmail, Drive, and Calendar on your behalf.
        </div>
        {error && <div style={{ color: "#ff4466", fontSize: 13, textAlign: "center" }}>{error}</div>}
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
        <div style={{ fontSize: 11, color: "rgba(224,244,255,0.3)", textAlign: "center" }}>
          You will be redirected to Google to authorise access. Your credentials are stored securely on your Genie server only.
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#000" }}>
      {/* User header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
        borderBottom: "1px solid rgba(0,212,255,0.1)", flexShrink: 0,
        background: "rgba(0,0,0,0.9)",
      }}>
        {user?.picture && (
          <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(0,212,255,0.3)" }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "#e0f4ff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
          <div style={{ fontSize: 10, color: "rgba(224,244,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
        </div>
        <button onClick={() => void disconnectGoogle()} style={{
          padding: "4px 10px", borderRadius: 6, fontSize: 10,
          background: "rgba(255,68,102,0.08)", border: "1px solid rgba(255,68,102,0.3)",
          color: "#ff4466", cursor: "pointer", fontFamily: "'Orbitron', sans-serif",
        }}>DISCONNECT</button>
      </div>

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
        {panel === "gmail" && !loading && emails.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: 32, color: "rgba(224,244,255,0.3)", fontSize: 13 }}>No emails found</div>
        )}
        {panel === "gmail" && !loading && emails.map(email => (
          <div key={email.id} className="glass-panel animate-slide-up" style={{
            padding: "12px 14px", borderRadius: 10, marginBottom: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: "#00d4ff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{email.from}</div>
              <div style={{ fontSize: 10, color: "rgba(224,244,255,0.3)", flexShrink: 0 }}>{email.date}</div>
            </div>
            <div style={{ fontSize: 13, color: "#e0f4ff", fontWeight: 500, marginBottom: 4 }}>{email.subject}</div>
            <div style={{ fontSize: 12, color: "rgba(224,244,255,0.5)", lineHeight: 1.4 }}>{email.snippet}</div>
          </div>
        ))}

        {/* Drive */}
        {panel === "drive" && !loading && files.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: 32, color: "rgba(224,244,255,0.3)", fontSize: 13 }}>No files found</div>
        )}
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
        {panel === "calendar" && !loading && events.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: 32, color: "rgba(224,244,255,0.3)", fontSize: 13 }}>No upcoming events</div>
        )}
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
                  boxSizing: "border-box",
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
                boxSizing: "border-box",
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
