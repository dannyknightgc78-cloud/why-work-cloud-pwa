// WHY WORK CLOUD IT PWA — useTTS Hook
// iOS-compatible TTS: server-side audio (fetches audio blob) with browser Speech API fallback
// User can choose mode in Settings. Default: server mode (works on iPhone Safari).

const BASE_URL = "https://genie.dannygc.cloud";

let currentAudio: HTMLAudioElement | null = null;
let speechSynthesisActive = false;

function getTtsMode(): "server" | "browser" {
  return (localStorage.getItem("genie_tts_mode") as "server" | "browser") || "server";
}

// Unlock AudioContext on first user gesture (required by iOS Safari)
let audioUnlocked = false;
export function unlockAudio() {
  if (audioUnlocked) return;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
  ctx.resume().catch(() => {});
  audioUnlocked = true;
}

export function stopTTS() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  speechSynthesisActive = false;
}

// Split text into sentence chunks for streaming TTS
function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 2);
}

async function playServerTTS(text: string, onWord?: (word: string) => void): Promise<void> {
  try {
    const url = `${BASE_URL}/api/tts?text=${encodeURIComponent(text)}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("TTS server error");
    // Verify the response is actually audio (not HTML fallback page)
    const contentType = r.headers.get("content-type") || "";
    if (!contentType.includes("audio")) throw new Error("TTS returned non-audio response");
    const blob = await r.blob();
    const objectUrl = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const audio = new Audio(objectUrl);
      currentAudio = audio;
      audio.onended = () => {
        URL.revokeObjectURL(objectUrl);
        currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        currentAudio = null;
        resolve(); // Don't reject — fall through gracefully
      };
      audio.play().catch(() => resolve());
    });
  } catch {
    // Fall back to browser TTS if server fails
    return playBrowserTTS(text, onWord);
  }
}

function playBrowserTTS(text: string, onWord?: (word: string) => void): Promise<void> {
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

    if (onWord) {
      utterance.onboundary = (e) => {
        if (e.name === "word") {
          const word = text.slice(e.charIndex, e.charIndex + e.charLength);
          onWord(word);
        }
      };
    }

    utterance.onend = () => { speechSynthesisActive = false; resolve(); };
    utterance.onerror = () => { speechSynthesisActive = false; resolve(); };

    speechSynthesisActive = true;
    window.speechSynthesis.speak(utterance);
  });
}

// Main TTS function — sentence-chunked for reliability on iOS
export async function speakText(
  text: string,
  onWord?: (word: string) => void,
  onSentenceStart?: (sentence: string) => void
): Promise<void> {
  stopTTS();
  const mode = getTtsMode();
  const sentences = splitSentences(text);

  for (const sentence of sentences) {
    if (onSentenceStart) onSentenceStart(sentence);
    if (mode === "server") {
      await playServerTTS(sentence, onWord);
    } else {
      await playBrowserTTS(sentence, onWord);
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
    await speakText(text, callbacks?.onWord);
    speakingRef.current = false;
    callbacks?.onEnd?.();
  }, []);

  const stop = useCallback(() => {
    stopTTS();
    speakingRef.current = false;
  }, []);

  return { speak, stop, isSpeaking: () => speakingRef.current };
}
