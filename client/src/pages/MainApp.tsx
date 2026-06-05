// WHY WORK CLOUD IT PWA — Main App Shell
// Design: Obsidian Command Interface — black bg, cyan accents, bottom nav
import { useState } from "react";
import ChatScreen from "./ChatScreen";
import VoiceScreen from "./VoiceScreen";
import GoogleScreen from "./GoogleScreen";
import ServicesScreen from "./ServicesScreen";
import SettingsScreen from "./SettingsScreen";
import StatsScreen from "./StatsScreen";
import { GoogleAuthProvider } from "../contexts/GoogleAuthContext";

type Tab = "chat" | "voice" | "google" | "stats" | "settings";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "voice", label: "Voice", icon: "🎙️" },
  { id: "google", label: "Google", icon: "🔗" },
  { id: "stats", label: "Stats", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <GoogleAuthProvider>
      <div style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: "#000",
      }}>
        {/* Screen content */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {activeTab === "chat" && <ChatScreen />}
          {activeTab === "voice" && <VoiceScreen />}
          {activeTab === "google" && <GoogleScreen />}
          {activeTab === "stats" && <StatsScreen />}
          {activeTab === "settings" && <SettingsScreen />}
        </div>

        {/* Bottom navigation */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          flexShrink: 0,
          background: "rgba(0,0,0,0.95)",
          borderTop: "1px solid rgba(0,212,255,0.12)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "8px 12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: isActive ? "#00d4ff" : "rgba(224,244,255,0.4)",
                  transition: "color 0.2s",
                  position: "relative",
                  minWidth: 56,
                }}
              >
                {isActive && (
                  <div style={{
                    position: "absolute",
                    top: 0, left: "50%",
                    transform: "translateX(-50%)",
                    width: 24, height: 2,
                    background: "#00d4ff",
                    borderRadius: "0 0 2px 2px",
                    boxShadow: "0 0 8px rgba(0,212,255,0.8)",
                  }} />
                )}
                <span style={{ fontSize: 20 }}>{tab.icon}</span>
                <span style={{
                  fontSize: 9,
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.05em",
                }}>
                  {tab.label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </GoogleAuthProvider>
  );
}
