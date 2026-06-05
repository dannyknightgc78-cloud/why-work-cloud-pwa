// WHY WORK CLOUD IT PWA — Settings Screen
// Design: Obsidian Command Interface — sci-fi settings with persistent Google auth
import { useState, useEffect } from "react";
import { useGoogleAuth } from "../contexts/GoogleAuthContext";

const BASE_URL = "https://genie.dannygc.cloud";

export default function SettingsScreen() {
  const { connected, user, connect, disconnect, loading: authLoading } = useGoogleAuth();

  // SMS Settings
  const [smsPhone, setSmsPhone] = useState(() => localStorage.getItem("genie_sms_phone") || "");
  const [smsSaved, setSmsSaved] = useState(false);

  // Speaker Settings
  const [bridgeUrl, setBridgeUrl] = useState(() => localStorage.getItem("genie_bridge_url") || "https://crust-grub-revoke.ngrok-free.dev");
  const [speakerName, setSpeakerName] = useState(() => localStorage.getItem("genie_speaker_name") || "Family room speaker");
  const [speakerSaved, setSpeakerSaved] = useState(false);
  const [testStatus, setTestStatus] = useState("");

  // TTS Settings
  const [ttsMode, setTtsMode] = useState<"server" | "browser">(() =>
    (localStorage.getItem("genie_tts_mode") as "server" | "browser") || "server"
  );

  const saveSms = () => {
    localStorage.setItem("genie_sms_phone", smsPhone);
    setSmsSaved(true);
    setTimeout(() => setSmsSaved(false), 2000);
  };

  const saveSpeaker = () => {
    localStorage.setItem("genie_bridge_url", bridgeUrl);
    localStorage.setItem("genie_speaker_name", speakerName);
    setSpeakerSaved(true);
    setTimeout(() => setSpeakerSaved(false), 2000);
  };

  const testSpeaker = async () => {
    setTestStatus("Testing...");
    try {
      const url = localStorage.getItem("genie_bridge_url") || bridgeUrl;
      const r = await fetch(`${url}/cast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hello! Genie is connected and ready.", speaker: speakerName }),
      });
      setTestStatus(r.ok ? "✅ Speaker responded!" : "❌ Speaker not reachable");
    } catch {
      setTestStatus("❌ Bridge offline");
    }
    setTimeout(() => setTestStatus(""), 3000);
  };

  const saveTtsMode = (mode: "server" | "browser") => {
    setTtsMode(mode);
    localStorage.setItem("genie_tts_mode", mode);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 700,
        color: "rgba(0,212,255,0.6)", letterSpacing: "0.15em",
        marginBottom: 12, paddingBottom: 8,
        borderBottom: "1px solid rgba(0,212,255,0.1)",
      }}>
        {title}
      </div>
      {children}
    </div>
  );

  const InputRow = ({ label, value, onChange, placeholder, type = "text" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
  }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "rgba(224,244,255,0.5)", marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8,
          background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.2)",
          color: "#e0f4ff", fontSize: 14, fontFamily: "'Inter', sans-serif",
          outline: "none",
        }}
      />
    </div>
  );

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#000", padding: "20px 16px" }}>

      {/* Google Account */}
      <Section title="GOOGLE ACCOUNT">
        {authLoading ? (
          <div style={{ display: "flex", gap: 6, padding: "8px 0" }}>
            <div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" />
          </div>
        ) : connected ? (
          <div style={{
            padding: "14px", borderRadius: 12,
            background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              {user?.picture && (
                <img src={user.picture} alt="avatar" style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #00ff88" }} />
              )}
              <div>
                <div style={{ fontSize: 13, color: "#00ff88", fontWeight: 600 }}>{user?.name || "Connected"}</div>
                <div style={{ fontSize: 11, color: "rgba(224,244,255,0.5)" }}>{user?.email}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 20 }}>✅</div>
            </div>
            <div style={{ fontSize: 11, color: "rgba(0,255,136,0.7)", marginBottom: 12 }}>
              Gmail, Drive & Calendar access active. Sign-in remembered.
            </div>
            <button onClick={disconnect} style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 11,
              background: "transparent", border: "1px solid rgba(255,68,102,0.4)",
              color: "#ff4466", cursor: "pointer", fontFamily: "'Orbitron', sans-serif",
            }}>
              DISCONNECT
            </button>
          </div>
        ) : (
          <div style={{
            padding: "14px", borderRadius: 12,
            background: "rgba(255,68,102,0.05)", border: "1px solid rgba(255,68,102,0.2)",
          }}>
            <div style={{ fontSize: 13, color: "rgba(224,244,255,0.6)", marginBottom: 12 }}>
              Not connected. Link your Google account to enable Gmail, Drive, and Calendar.
            </div>
            <button onClick={connect} style={{
              padding: "10px 20px", borderRadius: 10,
              background: "rgba(0,212,255,0.15)", border: "1px solid #00d4ff",
              color: "#00d4ff", fontFamily: "'Orbitron', sans-serif", fontSize: 11,
              fontWeight: 700, cursor: "pointer",
            }}>
              CONNECT GOOGLE
            </button>
          </div>
        )}
      </Section>

      {/* SMS Settings */}
      <Section title="SMS SETTINGS">
        <InputRow
          label="Your Phone Number (for SMS alerts & briefings)"
          value={smsPhone}
          onChange={setSmsPhone}
          placeholder="+447700000000"
          type="tel"
        />
        <button onClick={saveSms} style={{
          padding: "10px 20px", borderRadius: 10,
          background: smsSaved ? "rgba(0,255,136,0.15)" : "rgba(0,212,255,0.1)",
          border: `1px solid ${smsSaved ? "#00ff88" : "rgba(0,212,255,0.3)"}`,
          color: smsSaved ? "#00ff88" : "#00d4ff",
          fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer",
        }}>
          {smsSaved ? "✅ SAVED" : "SAVE"}
        </button>
      </Section>

      {/* Speaker Settings */}
      <Section title="GOOGLE SPEAKER BRIDGE">
        <InputRow
          label="Bridge URL (ngrok tunnel to your Mac)"
          value={bridgeUrl}
          onChange={setBridgeUrl}
          placeholder="https://xxxx.ngrok-free.dev"
        />
        <InputRow
          label="Speaker Name"
          value={speakerName}
          onChange={setSpeakerName}
          placeholder="Family room speaker"
        />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={saveSpeaker} style={{
            flex: 1, padding: "10px", borderRadius: 10,
            background: speakerSaved ? "rgba(0,255,136,0.15)" : "rgba(0,212,255,0.1)",
            border: `1px solid ${speakerSaved ? "#00ff88" : "rgba(0,212,255,0.3)"}`,
            color: speakerSaved ? "#00ff88" : "#00d4ff",
            fontFamily: "'Orbitron', sans-serif", fontSize: 11, cursor: "pointer",
          }}>
            {speakerSaved ? "✅ SAVED" : "SAVE"}
          </button>
          <button onClick={() => void testSpeaker()} style={{
            flex: 1, padding: "10px", borderRadius: 10,
            background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
            color: "#ff8c00", fontFamily: "'Orbitron', sans-serif", fontSize: 11, cursor: "pointer",
          }}>
            TEST SPEAKER
          </button>
        </div>
        {testStatus && (
          <div style={{ marginTop: 8, fontSize: 12, color: testStatus.includes("✅") ? "#00ff88" : "#ff4466" }}>
            {testStatus}
          </div>
        )}
      </Section>

      {/* TTS Mode */}
      <Section title="VOICE / TTS MODE">
        <div style={{ fontSize: 12, color: "rgba(224,244,255,0.5)", marginBottom: 12 }}>
          Server mode uses Genie's audio API (works on iPhone). Browser mode uses device speech synthesis.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {(["server", "browser"] as const).map(mode => (
            <button key={mode} onClick={() => saveTtsMode(mode)} style={{
              flex: 1, padding: "10px", borderRadius: 10,
              background: ttsMode === mode ? "rgba(0,212,255,0.15)" : "transparent",
              border: `1px solid ${ttsMode === mode ? "#00d4ff" : "rgba(255,255,255,0.1)"}`,
              color: ttsMode === mode ? "#00d4ff" : "rgba(224,244,255,0.4)",
              fontFamily: "'Orbitron', sans-serif", fontSize: 11, cursor: "pointer",
              fontWeight: ttsMode === mode ? 700 : 400,
            }}>
              {mode === "server" ? "🔊 SERVER (iOS)" : "📱 BROWSER"}
            </button>
          ))}
        </div>
      </Section>

      {/* About */}
      <Section title="ABOUT">
        <div style={{
          padding: "14px", borderRadius: 12,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(224,244,255,0.5)" }}>App</span>
            <span style={{ fontSize: 12, color: "#00d4ff" }}>Genie AI Assistant</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(224,244,255,0.5)" }}>Version</span>
            <span style={{ fontSize: 12, color: "#e0f4ff" }}>1.0.0</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(224,244,255,0.5)" }}>Backend</span>
            <span style={{ fontSize: 12, color: "#e0f4ff" }}>genie.dannygc.cloud</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "rgba(224,244,255,0.5)" }}>Model</span>
            <span style={{ fontSize: 12, color: "#e0f4ff" }}>Qwen (Vultr)</span>
          </div>
        </div>
      </Section>

    </div>
  );
}
