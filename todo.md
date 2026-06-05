# Why Work Cloud It — PWA Todo

## Core PWA
- [x] All 5 screens: Chat, Voice, Google, Stats, Settings
- [x] Persistent Google sign-in (localStorage + server verification, survives reload/close)
- [x] iOS TTS hook (useTTS) — server-side audio blob, sentence-chunked, stop button
- [x] Stats dashboard — Genie server health, uptime, service status, daily brief
- [x] Settings screen — SMS, speaker bridge, TTS mode toggle, Google account status
- [x] PWA manifest + iOS meta tags (installable from Safari)
- [x] Service worker (sw.js) — offline caching + push notification handler

## Backend (Genie Server — genie.dannygc.cloud)
- [x] GET /api/google/gmail/unread — unread emails list
- [x] GET /api/google/gmail/unread-count — count only
- [x] GET /api/google/calendar/today — today's events
- [x] GET /api/tts?text=... — audio/mpeg blob for iOS
- [x] POST /api/push/subscribe — save browser push subscription
- [x] GET /api/push/vapid-public — return VAPID public key
- [x] POST /api/push/send — broadcast push to all subscribers
- [x] GET /api/google/status — check OAuth connection status

## PWA Backend (why-work-cloud-pwa tRPC server)
- [x] push.vapidKey — return VAPID public key to frontend
- [x] push.subscribe — save subscription to MySQL database
- [x] push.unsubscribe — remove subscription
- [x] push.sendAll — broadcast push (admin only)
- [x] push_subscriptions table in MySQL (drizzle schema + migration)
- [x] VAPID keys set as secrets (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VITE_VAPID_PUBLIC_KEY)
- [x] usePushNotifications hook — registers SW, subscribes, saves to backend
- [x] Push notification toggle in Settings screen

## n8n Automations
- [x] Daily Briefing workflow created (ID: lZTrryyNXJxVaEdT) — needs activation
- [x] Email Auto-Reply workflow created (ID: LIb7WNSVHIA0t7BA) — needs activation

## Vitest
- [x] auth.logout.test.ts — session cookie clearing
- [x] push.vapid.test.ts — VAPID key procedure shape validation
