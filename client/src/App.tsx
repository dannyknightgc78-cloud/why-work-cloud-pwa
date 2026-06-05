// WHY WORK CLOUD IT PWA — Obsidian Command Interface
// Design: Sci-fi dark glass, cyan glow, gold logo, floating animated Genie
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import SplashScreen from "./pages/SplashScreen";
import MainApp from "./pages/MainApp";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  // make sure to consider if you need authentication for certain routes
  return (
    <div className="h-full" style={{ background: "#000", color: "#e0f4ff" }}>
      <Toaster theme="dark" />
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <MainApp />
      )}
    </div>
  );
}
