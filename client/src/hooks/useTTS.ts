// WHY WORK CLOUD IT PWA — useTTS Hook
// iOS-compatible TTS: uses Web Audio API (AudioContext) which works after a single unlock tap.
// Volume and speed are persisted in localStorage and respected for both server and browser TTS.

const BASE_URL = "https://genie.dannygc.cloud";

// Shared AudioContext — created once and reused
let _ctx: AudioContext | null = null;
let _gainNode: GainNode | null = null;
let _currentSource: AudioBufferSourceNode | null = null;
let _currentResolve: (() => void) | null = null;

export function getAudioContext(): AudioContext {
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    _gainNode = _ctx.createGain();
    _gainNode.connect(_ctx.destination);
  }
  return _ctx;
}

function getGainNode(): GainNode {
  getAudioContext(); // ensure ctx + gainNode are created
  return _gainNode!;
}

// ── Settings helpers ────────────────────────────────────────────────────────

export function getTtsMode(): "server" | "browser" {
  return (localStorage.getItem("genie_tts_mode") as "server" | "browser") || "server";
}
export function setTtsMode(mode: "server" | "browser") {
  localStorage.setItem("genie_tts_mode", mode);
}

export function getTtsVolume(): number {
  return parseFloat(localStorage.getItem("genie_tts_volume") || "1.0");
}
export function setTtsVolume(v: number) {
  const clamped = Math.max(0, Math.min(1, v));
  localStorage.setItem("genie_tts_volume", String(clamped));
  // Apply immediately to running audio
  if (_gainNode) _gainNode.gain.value = clamped;
}

export function getTtsSpeed(): number {
  return parseFloat(localStorage.getItem("genie_tts_speed") || "1.0");
}
export function setTtsSpeed(s: number) {
  const clamped = Math.max(0.5, Math.min(2.0, s));
  localStorage.setItem("genie_tts_speed", String(clamped));
}

// ── Audio unlock ─────────────────────────────────────────────────────────────

// Call this on ANY user tap — resumes the AudioContext so later async playback works
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  // Apply current volume
  getGainNode().gain.value = getTtsVolume();
  // Play a silent buffer to fully unlock on iOS
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
}

// ── Stop ─────────────────────────────────────────────────────────────────────

export function stopTTS() {
  if (_currentSource) {
    try { _currentSource.stop(); } catch {}
    _currentSource = null;
  }
  if (_currentResolve) {
    _currentResolve();
    _currentResolve = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ── Sentence splitter ────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 2);
}

// ── Server TTS (Web Audio API) ───────────────────────────────────────────────

async function playServerTTS(text: string): Promise<void> {
  try {
    const speed = getTtsSpeed();
    const url = `${BASE_URL}/api/tts?text=${encodeURIComponent(text)}&speed=${speed}`;
    const r = await fetch(url, { credentials: "omit" });
    if (!r.ok) throw new Error(`TTS HTTP ${r.status}`);
    const contentType = r.headers.get("content-type") || "";
    if (!contentType.includes("audio")) throw new Error("TTS non-audio response");

    const arrayBuffer = await r.arrayBuffer();
    const ctx = getAudioContext();
    if (ctx.state === "suspended") await ctx.resume();

    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    return new Promise((resolve) => {
      _currentResolve = resolve;
      const source = ctx.createBufferSource();
      _currentSource = source;
      source.buffer = audioBuffer;
      // Apply playback speed
      source.playbackRate.value = getTtsSpeed();
      // Route through gain node for volume control
      source.connect(getGainNode());
      // Apply current volume
      getGainNode().gain.value = getTtsVolume();
      source.onended = () => {
        _currentSource = null;
        _currentResolve = null;
        resolve();
      };
      source.start(0);
    });
  } catch (err) {
    console.warn("[TTS] Server TTS failed, falling back to browser:", err);
    return playBrowserTTS(text);
  }
}

// ── Browser TTS (SpeechSynthesis) ────────────────────────────────────────────

function playBrowserTTS(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = getTtsSpeed();
    utterance.pitch = 1.1;
    utterance.volume = getTtsVolume();

    // Pick a female voice if available
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v =>
      v.name.toLowerCase().includes("female") ||
      v.name.toLowerCase().includes("samantha") ||
      v.name.toLowerCase().includes("victoria") ||
      v.name.toLowerCase().includes("karen") ||
      v.name.toLowerCase().includes("moira") ||
      v.name.toLowerCase().includes("fiona")
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

// ── Main TTS function ────────────────────────────────────────────────────────

export async function speakText(text: string): Promise<void> {
  stopTTS();
  const mode = getTtsMode();
  const sentences = splitSentences(text);

  for (const sentence of sentences) {
    if (mode === "server") {
      await playServerTTS(sentence);
    } else {
      await playBrowserTTS(sentence);
    }
  }
}

// ── React hook ───────────────────────────────────────────────────────────────

import { useCallback, useRef } from "react";

export function useTTS() {
  const speakingRef = useRef(false);

  const speak = useCallback(async (
    text: string,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
    }
  ) => {
    speakingRef.current = true;
    callbacks?.onStart?.();
    await speakText(text);
    speakingRef.current = false;
    callbacks?.onEnd?.();
  }, []);

  const stop = useCallback(() => {
    stopTTS();
    speakingRef.current = false;
  }, []);

  return { speak, stop, isSpeaking: () => speakingRef.current };
}
