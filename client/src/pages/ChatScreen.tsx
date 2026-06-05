// WHY WORK CLOUD IT PWA — Chat Screen
// Design: Genie avatar top-center, floating animated, chat messages below, input at bottom
// TTS: uses useTTS hook — server-side audio (iOS-safe) with browser fallback
import { useState, useRef, useEffect } from "react";
import { useTTS, unlockAudio } from "../hooks/useTTS";

const BASE_URL = "https://genie.dannygc.cloud";

interface Message {
  id: string;
  role: "user" | "genie";
  content: string;
  timestamp: Date;
}

type GenieState = "idle" | "thinking" | "speaking";

async function streamChat(
  messages: { role: string; content: string }[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`Chat error: ${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No stream");
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content || "";
          if (text) { full += text; onChunk(text); }
        } catch {}
      }
    }
  }
  return full;
}

async function sendSMS(to: string, body: string): Promise<void> {
  await fetch(`${BASE_URL}/api/sms/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, body }),
  });
}

export default function ChatScreen() {
  const { speak, stop } = useTTS();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "genie",
      content: "Hello! I'm Genie — your AI assistant. I can chat, access your Google account, send texts, and more. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [genieState, setGenieState] = useState<GenieState>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [smsMode, setSmsMode] = useState(false);
  const [smsTo, setSmsTo] = useState(() => localStorage.getItem("genie_sms_phone") || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    // Unlock audio on first user interaction (iOS requirement)
    unlockAudio();
    setInput("");

    // SMS mode
    if (smsMode && smsTo) {
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: `📱 Text to ${smsTo}: ${text}`, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);
      setGenieState("thinking");
      try {
        await sendSMS(smsTo, text);
        const reply: Message = { id: (Date.now() + 1).toString(), role: "genie", content: `✅ Text sent to ${smsTo}: "${text}"`, timestamp: new Date() };
        setMessages(prev => [...prev, reply]);
        setGenieState("speaking");
        await speak(reply.content, {
          onEnd: () => setGenieState("idle"),
        });
      } catch {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "genie", content: "❌ Failed to send text. Please try again.", timestamp: new Date() }]);
        setGenieState("idle");
      }
      setIsLoading(false);
      setSmsMode(false);
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setGenieState("thinking");

    const genieId = (Date.now() + 1).toString();
    const genieMsg: Message = { id: genieId, role: "genie", content: "", timestamp: new Date() };
    setMessages(prev => [...prev, genieMsg]);

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role === "genie" ? "assistant" : "user",
        content: m.content,
      }));

      let fullResponse = "";
      setGenieState("speaking");
      await streamChat(history, (chunk) => {
        fullResponse += chunk;
        setMessages(prev => prev.map(m => m.id === genieId ? { ...m, content: fullResponse } : m));
      });

      // Speak the full response via iOS-safe TTS
      await speak(fullResponse, {
        onEnd: () => setGenieState("idle"),
      });
    } catch {
      setMessages(prev => prev.map(m => m.id === genieId ? { ...m, content: "Sorry, I had trouble connecting. Please try again." } : m));
      setGenieState("idle");
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
  };

  const stateColor = genieState === "thinking" ? "#d4a017" : genieState === "speaking" ? "#00ff88" : "#00d4ff";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#000" }}>
      {/* Header with Genie */}
      <div className="circuit-bg" style={{
        padding: "16px 16px 12px",
        borderBottom: "1px solid rgba(0,212,255,0.1)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
      }}>
        {/* Genie avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div className="animate-float-slow" style={{
            width: 52, height: 52,
            borderRadius: "50%",
            overflow: "hidden",
            border: `2px solid ${stateColor}`,
            boxShadow: `0 0 16px ${stateColor}80`,
            transition: "border-color 0.3s, box-shadow 0.3s",
          }}>
            <img src="https://genie.dannygc.cloud/api/r2/get/assets/genie-avatar.png" alt="Genie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{
            position: "absolute", bottom: 2, right: 2,
            width: 10, height: 10, borderRadius: "50%",
            background: stateColor,
            border: "2px solid #000",
            boxShadow: `0 0 6px ${stateColor}`,
          }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: "#00d4ff" }}>GENIE</div>
          <div style={{ fontSize: 11, color: "rgba(224,244,255,0.5)", marginTop: 2 }}>
            {genieState === "thinking" ? "⚡ Thinking..." : genieState === "speaking" ? "🔊 Speaking..." : "● Online"}
          </div>
        </div>

        {/* Stop TTS button when speaking */}
        {genieState === "speaking" && (
          <button onClick={stop} style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 11,
            background: "rgba(255,68,102,0.1)", border: "1px solid rgba(255,68,102,0.3)",
            color: "#ff4466", cursor: "pointer",
          }}>
            ⏹ STOP
          </button>
        )}

        {/* SMS button */}
        <button
          onClick={() => setSmsMode(!smsMode)}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 11,
            fontFamily: "'Orbitron', sans-serif", cursor: "pointer",
            background: smsMode ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.05)",
            border: `1px solid ${smsMode ? "#00d4ff" : "rgba(0,212,255,0.2)"}`,
            color: smsMode ? "#00d4ff" : "rgba(224,244,255,0.5)",
          }}
        >
          📱 SMS
        </button>
      </div>

      {/* SMS To field */}
      {smsMode && (
        <div style={{ padding: "8px 16px", background: "rgba(0,212,255,0.05)", borderBottom: "1px solid rgba(0,212,255,0.1)", flexShrink: 0 }}>
          <input
            value={smsTo}
            onChange={e => setSmsTo(e.target.value)}
            placeholder="Phone number (e.g. +447700900000)"
            style={{
              width: "100%", padding: "8px 12px",
              background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,212,255,0.3)",
              borderRadius: 8, color: "#e0f4ff", fontSize: 13, fontFamily: "'Inter', sans-serif",
            }}
          />
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((msg) => (
          <div key={msg.id} className="animate-slide-up" style={{
            display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 8,
          }}>
            {msg.role === "genie" && (
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                overflow: "hidden", border: "1px solid rgba(0,212,255,0.3)", marginTop: 4,
              }}>
                <img src="https://genie.dannygc.cloud/api/r2/get/assets/genie-avatar.png" alt="G" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div className={msg.role === "user" ? "msg-user" : "msg-genie"} style={{
              maxWidth: "78%", padding: "10px 14px",
              fontSize: 14, lineHeight: 1.5, color: "#e0f4ff",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {msg.content === "" && msg.role === "genie" ? (
                <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px", borderTop: "1px solid rgba(0,212,255,0.1)",
        display: "flex", gap: 8, flexShrink: 0, background: "rgba(0,0,0,0.8)",
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={smsMode ? `Message to send via SMS to ${smsTo || "..."}` : "Ask Genie anything..."}
          rows={1}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 12, resize: "none",
            minHeight: 42, maxHeight: 120, fontSize: 14, lineHeight: 1.5,
            background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.2)",
            color: "#e0f4ff", fontFamily: "'Inter', sans-serif",
          }}
        />
        <button
          onClick={() => void sendMessage()}
          disabled={isLoading || !input.trim()}
          style={{
            width: 42, height: 42, borderRadius: 12,
            border: "1px solid rgba(0,212,255,0.4)",
            background: isLoading ? "rgba(0,212,255,0.05)" : "rgba(0,212,255,0.15)",
            color: "#00d4ff", fontSize: 18, cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all 0.2s",
          }}
        >
          {isLoading ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}
