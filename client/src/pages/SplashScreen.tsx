// WHY WORK CLOUD IT PWA — Splash Screen
// Design: Pure black, CLOUDIT gold logo top, Genie floats then evaporates into smoke, slogan bottom
// Phases: 0=fade-in | 1=logo+genie visible | 2=slogan types | 3=genie evaporates | 4=done

import { useEffect, useState, useRef } from "react";

interface Props {
  onComplete: () => void;
}

const SLOGAN = "WE WORK SO YOU DON'T HAVE TO";

export default function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [genieOpacity, setGenieOpacity] = useState(0);
  const [genieY, setGenieY] = useState(40);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [sloganOpacity, setSloganOpacity] = useState(0);
  const [genieSmoke, setGenieSmoke] = useState(false);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Phase 0 → 1: fade in logo + genie rising
    const t1 = setTimeout(() => {
      setLogoOpacity(1);
      setGenieOpacity(1);
      setGenieY(0);
      setPhase(1);
    }, 300);

    // Phase 1 → 2: start typing slogan
    const t2 = setTimeout(() => {
      setSloganOpacity(1);
      setPhase(2);
      let i = 0;
      typeRef.current = setInterval(() => {
        i++;
        setTypedText(SLOGAN.slice(0, i));
        if (i >= SLOGAN.length) {
          if (typeRef.current) clearInterval(typeRef.current);
        }
      }, 60);
    }, 1500);

    // Phase 2 → 3: genie evaporates
    const t3 = setTimeout(() => {
      setPhase(3);
      setGenieSmoke(true);
    }, 4000);

    // Phase 3 → done: fade out and enter app
    const t4 = setTimeout(() => {
      onComplete();
    }, 5500);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      if (typeRef.current) clearInterval(typeRef.current);
    };
  }, [onComplete]);

  return (
    <div
      className="circuit-bg"
      style={{
        position: "fixed", inset: 0,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "60px 24px 80px",
        overflow: "hidden",
      }}
    >
      {/* Radial glow behind genie */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 320, height: 320,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* CLOUDIT Logo */}
      <div style={{
        opacity: logoOpacity,
        transition: "opacity 0.8s ease",
        textAlign: "center",
        zIndex: 10,
      }}>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 32,
          fontWeight: 900,
          color: "#d4a017",
          letterSpacing: "0.15em",
          textShadow: "0 0 20px rgba(212,160,23,0.5)",
        }}>
          CLOUDIT
        </div>
        <div style={{
          width: 80, height: 1,
          background: "linear-gradient(90deg, transparent, #d4a017, transparent)",
          margin: "8px auto 0",
        }} />
      </div>

      {/* Genie */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        position: "relative",
        zIndex: 10,
      }}>
        <div
          className={genieSmoke ? "" : "animate-float"}
          style={{
            opacity: genieSmoke ? 0 : genieOpacity,
            transform: genieSmoke
              ? "translateY(-80px) scale(1.1)"
              : `translateY(${genieY}px)`,
            transition: genieSmoke
              ? "opacity 1.2s ease, transform 1.2s ease"
              : "opacity 1s ease, transform 1s cubic-bezier(0.34,1.56,0.64,1)",
            filter: "drop-shadow(0 0 30px rgba(0,212,255,0.7)) drop-shadow(0 0 60px rgba(0,212,255,0.3))",
          }}
        >
          <img
            src="/manus-storage/genie-avatar_b37c1327.png"
            alt="Genie"
            style={{
              width: 220,
              height: 220,
              objectFit: "contain",
              borderRadius: "50%",
            }}
          />
        </div>

        {/* Smoke particles when evaporating */}
        {genieSmoke && (
          <>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                width: 12 + i * 4,
                height: 12 + i * 4,
                borderRadius: "50%",
                background: `rgba(0, 212, 255, ${0.3 - i * 0.03})`,
                left: `${40 + (i % 4) * 5}%`,
                top: `${30 + (i % 3) * 10}%`,
                animation: `smoke-rise ${0.8 + i * 0.1}s ease-out forwards`,
                animationDelay: `${i * 0.05}s`,
              }} />
            ))}
          </>
        )}
      </div>

      {/* Slogan */}
      <div style={{
        opacity: sloganOpacity,
        transition: "opacity 0.5s ease",
        textAlign: "center",
        zIndex: 10,
        minHeight: 40,
      }}>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          color: "#00d4ff",
          letterSpacing: "0.2em",
          textShadow: "0 0 10px rgba(0,212,255,0.5)",
        }}>
          {typedText}
          {typedText.length < SLOGAN.length && (
            <span style={{ animation: "type-cursor 0.8s infinite", borderRight: "1px solid #00d4ff" }}>&nbsp;</span>
          )}
        </div>

        {/* Copyright notice */}
        <div style={{
          position: "absolute",
          bottom: 16,
          left: 0, right: 0,
          textAlign: "center",
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 8,
          letterSpacing: "0.12em",
          color: "rgba(0,212,255,0.3)",
          userSelect: "none",
        }}>
          © {new Date().getFullYear()} Danny Cloud Services. All rights reserved.
        </div>
      </div>
    </div>
  );
}
