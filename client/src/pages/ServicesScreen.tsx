// WHY WORK CLOUD IT PWA — Services Screen
// Design: Obsidian Command Interface — sci-fi service cards
export default function ServicesScreen() {
  const services = [
    { icon: "☁️", title: "Cloud Infrastructure", desc: "Scalable cloud solutions tailored for your business. AWS, Azure, GCP setup and management.", color: "#00d4ff" },
    { icon: "🔒", title: "Cybersecurity", desc: "End-to-end security audits, penetration testing, and 24/7 threat monitoring.", color: "#ff4466" },
    { icon: "🤖", title: "AI Integration", desc: "Custom AI assistants, automation workflows, and LLM integrations for your business.", color: "#d4a017" },
    { icon: "📱", title: "App Development", desc: "Native iOS/Android and PWA development. From concept to App Store.", color: "#00ff88" },
    { icon: "🌐", title: "Web Development", desc: "High-performance websites, e-commerce, and web applications.", color: "#a855f7" },
    { icon: "📊", title: "Data Analytics", desc: "Business intelligence dashboards, data pipelines, and reporting automation.", color: "#00d4ff" },
    { icon: "🛠️", title: "IT Support", desc: "Managed IT support, helpdesk, and infrastructure maintenance.", color: "#ff8c00" },
    { icon: "🔄", title: "Automation", desc: "Workflow automation, RPA, and n8n/Zapier integrations to save you time.", color: "#00ff88" },
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#000", padding: "16px" }}>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, color: "#00d4ff", marginBottom: 4, letterSpacing: "0.1em" }}>
        OUR SERVICES
      </div>
      <div style={{ fontSize: 12, color: "rgba(224,244,255,0.4)", marginBottom: 20 }}>
        We work so you don't have to — CloudIT
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {services.map((s, i) => (
          <div key={i} style={{
            padding: "16px 12px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${s.color}30`,
            boxShadow: `0 0 12px ${s.color}10`,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = `${s.color}10`)}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.color, fontFamily: "'Orbitron', sans-serif", marginBottom: 6, lineHeight: 1.3 }}>
              {s.title}
            </div>
            <div style={{ fontSize: 11, color: "rgba(224,244,255,0.5)", lineHeight: 1.5 }}>
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        marginTop: 24, padding: "20px", borderRadius: 16,
        background: "rgba(0,212,255,0.05)",
        border: "1px solid rgba(0,212,255,0.2)",
        textAlign: "center",
      }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, color: "#00d4ff", marginBottom: 8 }}>
          READY TO TRANSFORM YOUR BUSINESS?
        </div>
        <div style={{ fontSize: 12, color: "rgba(224,244,255,0.5)", marginBottom: 16 }}>
          Ask Genie anything or get in touch directly.
        </div>
        <a href="mailto:hello@dannygc.cloud" style={{
          display: "inline-block", padding: "10px 24px", borderRadius: 10,
          background: "rgba(0,212,255,0.15)", border: "1px solid #00d4ff",
          color: "#00d4ff", textDecoration: "none",
          fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 600,
        }}>
          GET IN TOUCH
        </a>
      </div>
    </div>
  );
}
