// WHY WORK CLOUD IT PWA — Persistent Google Auth Context
// Stores Google auth state in localStorage so it survives page reloads
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const BASE_URL = "https://genie.dannygc.cloud";
const STORAGE_KEY = "genie_google_auth";

interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}

interface GoogleAuthState {
  connected: boolean;
  user: GoogleUser | null;
  loading: boolean;
  connect: () => void;
  disconnect: () => void;
  refresh: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthState>({
  connected: false,
  user: null,
  loading: true,
  connect: () => {},
  disconnect: () => {},
  refresh: async () => {},
});

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${BASE_URL}/api/google/status`, {
        credentials: "include",
        cache: "no-store",
      });
      if (r.ok) {
        const d = await r.json();
        if (d.connected) {
          setConnected(true);
          setUser(d.user || null);
          // Persist to localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ connected: true, user: d.user || null }));
          return;
        }
      }
    } catch {
      // Network error — fall back to cached state
    }
    // If server says not connected, check localStorage cache
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.connected) {
          setConnected(true);
          setUser(parsed.user || null);
          return;
        }
      } catch { /* ignore */ }
    }
    setConnected(false);
    setUser(null);
  }, []);

  useEffect(() => {
    // On mount: first try localStorage for instant restore, then verify with server
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.connected) {
          setConnected(true);
          setUser(parsed.user || null);
        }
      } catch { /* ignore */ }
    }
    refresh().finally(() => setLoading(false));

    // Handle OAuth redirect callback — if URL has ?google=connected
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      refresh().then(() => {
        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname);
      });
    }
  }, [refresh]);

  const connect = useCallback(() => {
    // Store current URL so we can redirect back after OAuth
    localStorage.setItem("genie_oauth_return", window.location.href);
    window.location.href = `${BASE_URL}/api/auth/google?redirect=${encodeURIComponent(window.location.origin + "?google=connected")}`;
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConnected(false);
    setUser(null);
    // Tell server to revoke
    fetch(`${BASE_URL}/api/auth/google/revoke`, { credentials: "include" }).catch(() => {});
  }, []);

  return (
    <GoogleAuthContext.Provider value={{ connected, user, loading, connect, disconnect, refresh }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  return useContext(GoogleAuthContext);
}
