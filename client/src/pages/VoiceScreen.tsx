// WHY WORK CLOUD IT PWA — Voice Screen
// Design: Large mic button centre-screen, Genie avatar above, transcript below
// TTS: uses useTTS hook — server-side audio (iOS-safe) with browser fallback
import { useState, useRef } from "react";
import { useTTS, unlockAudio } from "../hooks/useTTS";

const BASE_URL = "https://genie.dannygc.cloud";

async function askGenie(question: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
  });
  if (!res.ok) throw new Error("Chat error");
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
          if (text) full += text;
        } catch {}
      }
    }
  }
  return full;
}

type State = "idle" | "listening" | "thinking" | "speaking";

export default function VoiceScreen() {
  const { speak, stop } = useTTS();
  const [state, setState] = useState<State>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const latestTranscript = useRef("");

  const stateColor = {
    idle: "#00d4ff",
    listening: "#ff4466",
    thinking: "#d4a017",
    speaking: "#00ff88",
  }[state];

  const stateLabel = {
    idle: "TAP TO SPEAK",
    listening: "LISTENING...",
    thinking: "THINKING...",
    speaking: "SPEAKING...",
  }[state];

  const startListening = () => {
    setError("");
    // Unlock audio context on user gesture (iOS requirement)
    unlockAudio();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported. Try Chrome or Safari.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    latestTranscript.current = "";

    recognition.onstart = () => setState("listening");
    recognition.onresult = (e: any) => {
      const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join("");
      setTranscript(t);
      latestTranscript.current = t;
    };
    recognition.onend = async () => {
      const q = latestTranscript.current;
      if (!q.trim()) { setState("idle"); return; }
      setState("thinking");
      try {
        const answer = await askGenie(q);
        setResponse(answer);
        setState("speaking");
        await speak(answer, {
          onEnd: () => setState("idle"),
        });
      } catch {
        setError("Couldn't reach Genie. Check your connection.");
        setState("idle");
      }
    };
    recognition.onerror = (e: any) => {
      if (e.error !== "aborted") setError(`Mic error: ${e.error}`);
      setState("idle");
    };
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  const handleMicPress = () => {
    if (state === "idle") {
      setTranscript(""); setResponse("");
      startListening();
    } else if (state === "listening") {
      stopListening();
    } else if (state === "speaking") {
      stop();
      setState("idle");
    }
  };

  return (
    <div className="circuit-bg" style={{
      height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between",
      padding: "32px 24px 24px", background: "#000",
    }}>
      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, color: "#00d4ff", letterSpacing: "0.1em" }}>
          VOICE COMMAND
        </div>
        <div style={{ fontSize: 12, color: "rgba(224,244,255,0.4)", marginTop: 4 }}>Speak to Genie</div>
      </div>

      {/* Genie avatar */}
      <div style={{ position: "relative" }}>
        <div className={state === "idle" ? "animate-float" : ""} style={{
          width: 120, height: 120, borderRadius: "50%",
          overflow: "hidden",
          border: `3px solid ${stateColor}`,
          boxShadow: `0 0 30px ${stateColor}80`,
          transition: "border-color 0.3s, box-shadow 0.3s",
        }}>
          <img src="https://genie.dannygc.cloud/api/r2/get/assets/genie-avatar.png" alt="Genie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        {state === "thinking" && (
          <div style={{ position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            <div className="thinking-dot" />
            <div className="thinking-dot" />
            <div className="thinking-dot" />
          </div>
        )}
        {state === "speaking" && (
          <div style={{ position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 3, alignItems: "flex-end" }}>
            {[1, 2, 3, 4, 3].map((h, i) => (
              <div key={i} className="speaking-bar" style={{ width: 4, height: h * 5, background: "#00ff88", borderRadius: 2 }} />
            ))}
          </div>
        )}
      </div>

      {/* Transcript / Response */}
      <div style={{ width: "100%", maxWidth: 360, minHeight: 100, textAlign: "center" }}>
        {transcript && (
          <div style={{
            padding: "12px 16px", borderRadius: 12, marginBottom: 12,
            background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)",
            fontSize: 14, color: "rgba(224,244,255,0.7)", fontStyle: "italic",
          }}>
            "{transcript}"
          </div>
        )}
        {response && (
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 14, color: "#e0f4ff", lineHeight: 1.6, textAlign: "left",
            maxHeight: 160, overflowY: "auto",
          }}>
            {response}
          </div>
        )}
        {error && (
          <div style={{ color: "#ff4466", fontSize: 13, padding: "8px 0" }}>{error}</div>
        )}
      </div>

      {/* Mic button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <button
          onClick={handleMicPress}
          className={state === "listening" ? "animate-mic-pulse" : ""}
          style={{
            width: 80, height: 80, borderRadius: "50%",
            border: `2px solid ${stateColor}`,
            background: `${stateColor}20`,
            color: stateColor, fontSize: 32, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 20px ${stateColor}40`,
            transition: "all 0.3s",
          }}
        >
          {state === "listening" ? "⏹" : state === "speaking" ? "🔊" : "🎙️"}
        </button>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 11, fontWeight: 600,
          color: stateColor, letterSpacing: "0.15em",
        }}>
          {stateLabel}
        </div>
      </div>
    </div>
  );
}
