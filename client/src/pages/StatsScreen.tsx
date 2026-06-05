// WHY WORK CLOUD IT PWA — Stats Screen
// Design: Obsidian Command Interface — live website analytics, uptime, Genie daily summary
import { useState, useEffect } from "react";

const BASE_URL = "https://genie.dannygc.cloud";
const ANALYTICS_URL = "https://analytics.dannygc.cloud"; // Umami or similar

interface HealthData {
  status: string;
  uptime: number;
  responseTime: number;
  chatCount: number;
  imageCount: number;
  version: string;
}

interface StatCard {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: string;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function StatsScreen() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const start = Date.now();
      const r = await fetch(`${BASE_URL}/api/health`, { cache: "no-store" });
      const responseTime = Date.now() - start;
      if (r.ok) {
        const d = await r.json();
        setHealth({ ...d, responseTime });
      } else {
        setHealth(null);
      }
    } catch {
      setHealth(null);
    }
    setLastChecked(new Date());
    setLoading(false);
  };

  const fetchDailySummary = async () => {
    setSummaryLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Give me a brief daily summary for Why Work Cloud IT. Today is ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}. Include: 1) A motivational opener, 2) Key reminder to check emails and calendar, 3) One AI tip for productivity. Keep it under 100 words, sci-fi tone.`,
          system: "You are Genie, the AI assistant for Why Work Cloud IT. Be concise and energetic.",
        }),
      });
      const d = await r.json();
      setSummary(d.reply || d.message || "");
    } catch {
      setSummary("Unable to fetch daily summary. Check your connection.");
    }
    setSummaryLoading(false);
  };

  useEffect(() => {
    void fetchHealth();
    void fetchDailySummary();
    // Auto-refresh health every 60 seconds
    const interval = setInterval(() => void fetchHealth(), 60000);
    return () => clearInterval(interval);
  }, []);

  const cards: StatCard[] = health ? [
    {
      label: "SERVER STATUS",
      value: health.status === "ok" ? "ONLINE" : "DEGRADED",
      sub: `Response: ${health.responseTime}ms`,
      color: health.status === "ok" ? "#00ff88" : "#ff4466",
      icon: health.status === "ok" ? "🟢" : "🔴",
    },
    {
      label: "UPTIME",
      value: formatUptime(health.uptime || 0),
      sub: "Since last restart",
      color: "#00d4ff",
      icon: "⏱️",
    },
    {
      label: "CHATS TODAY",
      value: String(health.chatCount || 0),
      sub: "AI conversations",
      color: "#a855f7",
      icon: "💬",
    },
    {
      label: "IMAGES GEN",
      value: String(health.imageCount || 0),
      sub: "AI images created",
      color: "#d4a017",
      icon: "🎨",
    },
  ] : [];

  const services = [
    { name: "genie.dannygc.cloud", url: `${BASE_URL}/api/health`, label: "Genie AI" },
    { name: "n8n.dannygc.cloud", url: "https://n8n.dannygc.cloud/healthz", label: "n8n Automations" },
    { name: "app.dannygc.cloud", url: "https://app.dannygc.cloud", label: "PWA" },
  ];

  const [serviceStatus, setServiceStatus] = useState<Record<string, "checking" | "up" | "down">>({});

  useEffect(() => {
    services.forEach(s => {
      setServiceStatus(prev => ({ ...prev, [s.name]: "checking" }));
      fetch(s.url, { mode: "no-cors", cache: "no-store" })
        .then(() => setServiceStatus(prev => ({ ...prev, [s.name]: "up" })))
        .catch(() => setServiceStatus(prev => ({ ...prev, [s.name]: "down" })));
    });
  }, []);

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#000", padding: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, color: "#00d4ff", letterSpacing: "0.1em" }}>
            COMMAND STATS
          </div>
          {lastChecked && (
            <div style={{ fontSize: 10, color: "rgba(224,244,255,0.3)", marginTop: 2 }}>
              Updated {lastChecked.toLocaleTimeString()}
            </div>
          )}
        </div>
        <button onClick={() => void fetchHealth()} style={{
          padding: "6px 14px", borderRadius: 8, fontSize: 11,
          background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)",
          color: "#00d4ff", cursor: "pointer", fontFamily: "'Orbitron', sans-serif",
        }}>
          ↻ REFRESH
        </button>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" />
          </div>
        </div>
      ) : health ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {cards.map((card, i) => (
            <div key={i} style={{
              padding: "16px 12px", borderRadius: 12,
              background: `${card.color}08`,
              border: `1px solid ${card.color}30`,
              boxShadow: `0 0 12px ${card.color}08`,
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{card.icon}</div>
              <div style={{ fontSize: 10, color: "rgba(224,244,255,0.4)", fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.08em", marginBottom: 4 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: card.color, fontFamily: "'Orbitron', sans-serif" }}>
                {card.value}
              </div>
              {card.sub && <div style={{ fontSize: 10, color: "rgba(224,244,255,0.3)", marginTop: 2 }}>{card.sub}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "20px", textAlign: "center", color: "#ff4466", fontSize: 13, marginBottom: 20 }}>
          ⚠️ Could not reach Genie server
        </div>
      )}

      {/* Service Status */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: "rgba(0,212,255,0.6)", letterSpacing: "0.15em", marginBottom: 12 }}>
          SERVICE STATUS
        </div>
        {services.map(s => {
          const status = serviceStatus[s.name] || "checking";
          return (
            <div key={s.name} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 10, marginBottom: 8,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div>
                <div style={{ fontSize: 13, color: "#e0f4ff", fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "rgba(224,244,255,0.3)" }}>{s.name}</div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700, fontFamily: "'Orbitron', sans-serif",
                color: status === "up" ? "#00ff88" : status === "down" ? "#ff4466" : "#d4a017",
              }}>
                {status === "up" ? "● ONLINE" : status === "down" ? "● OFFLINE" : "○ CHECKING"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Summary from Genie */}
      <div style={{
        padding: "16px", borderRadius: 16,
        background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)",
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: "rgba(168,85,247,0.8)", letterSpacing: "0.15em" }}>
            🧞 GENIE DAILY BRIEF
          </div>
          <button onClick={() => void fetchDailySummary()} style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 10,
            background: "transparent", border: "1px solid rgba(168,85,247,0.3)",
            color: "rgba(168,85,247,0.7)", cursor: "pointer",
          }}>
            REFRESH
          </button>
        </div>
        {summaryLoading ? (
          <div style={{ display: "flex", gap: 6 }}>
            <div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" />
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "rgba(224,244,255,0.8)", lineHeight: 1.7 }}>
            {summary || "Generating your daily brief..."}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: "rgba(0,212,255,0.6)", letterSpacing: "0.15em", marginBottom: 12 }}>
        QUICK LINKS
      </div>
      {[
        { label: "Genie Web App", url: "https://genie.dannygc.cloud", icon: "🧞" },
        { label: "n8n Automations", url: "https://n8n.dannygc.cloud", icon: "⚡" },
        { label: "Coolify Dashboard", url: "https://coolify.dannygc.cloud", icon: "🚀" },
      ].map(link => (
        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", borderRadius: 10, marginBottom: 8,
          background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.1)",
          textDecoration: "none",
        }}>
          <span style={{ fontSize: 20 }}>{link.icon}</span>
          <span style={{ fontSize: 13, color: "#00d4ff" }}>{link.label}</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(224,244,255,0.3)" }}>↗</span>
        </a>
      ))}
    </div>
  );
}
