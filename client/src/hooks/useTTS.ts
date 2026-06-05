// WHY WORK CLOUD IT PWA — useTTS Hook
// iOS-compatible TTS: uses Web Audio API (AudioContext) which works after a single unlock tap.
// new Audio() is blocked on iOS PWA unless called synchronously inside a user gesture.
// AudioContext.decodeAudioData() works as long as the context was resumed during any prior tap.

const BASE_URL = "https://genie.dannygc.cloud";

// Shared AudioContext — created once and reused
let _ctx: AudioContext | null = null;
let _currentSource: AudioBufferSourceNode | null = null;
let _currentResolve: (() => void) | null = null;

function getAudioContext(): AudioContext {
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return _ctx;
}

// Call this on ANY user tap — resumes the AudioContext so later async playback works
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  // Play a silent buffer to fully unlock on iOS
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
}

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

function getTtsMode(): "server" | "browser" {
  return (localStorage.getItem("genie_tts_mode") as "server" | "browser") || "server";
}

// Split text into sentence chunks
function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 2);
}

async function playServerTTS(text: string): Promise<void> {
  try {
    const url = `${BASE_URL}/api/tts?text=${encodeURIComponent(text)}`;
    const r = await fetch(url, { credentials: "omit" });
    if (!r.ok) throw new Error(`TTS HTTP ${r.status}`);
    const contentType = r.headers.get("content-type") || "";
    if (!contentType.includes("audio")) throw new Error("TTS non-audio response");

    const arrayBuffer = await r.arrayBuffer();
    const ctx = getAudioContext();

    // Ensure context is running (it should be after unlockAudio was called on tap)
    if (ctx.state === "suspended") await ctx.resume();

    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    return new Promise((resolve) => {
      _currentResolve = resolve;
      const source = ctx.createBufferSource();
      _currentSource = source;
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
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

function playBrowserTTS(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;

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

// Main TTS function — sentence-chunked for reliability on iOS
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

// React hook wrapper
import { useCallback, useRef } from "react";

export function useTTS() {
  const speakingRef = useRef(false);

  const speak = useCallback(async (
    text: string,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onWord?: (word: string) => void;
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
