# Why Work Cloud It PWA — Design Ideas

## Chosen Design: Obsidian Command Interface

**Design Movement:** Sci-fi terminal meets luxury dark glass

**Core Principles:**
- Pure black (#000) base with deep navy (#0a0f1e) panels
- Cyan/electric blue (#00d4ff) as the sole accent — used sparingly for glow, borders, active states
- Gold (#d4a017) for the CLOUDIT logo and premium touches only
- Everything feels like a holographic interface projected in a dark room

**Color Philosophy:**
- Background: #000000 / #050a14
- Panel surfaces: rgba(0,212,255,0.05) with 1px cyan border
- Text: #e0f4ff (cool white) on dark, #00d4ff for highlights
- Genie glow: radial cyan gradient, pulsing

**Layout Paradigm:**
- Full-screen mobile-first, no scrollbars visible
- Bottom navigation bar (5 tabs: Chat, Voice, Google, Services, Settings)
- Each screen fills 100vh with its own scroll context
- Genie avatar floats in a fixed position in chat, not inline

**Signature Elements:**
- Animated Genie avatar: floating, glowing, state-aware (idle/thinking/speaking)
- Subtle circuit grid pattern on backgrounds (very low opacity)
- Cyan scan-line effect on active elements

**Interaction Philosophy:**
- Instant feedback — no loading spinners, use skeleton states
- Voice mic button pulses red when recording
- Messages stream in character by character

**Animation:**
- Genie: continuous float (translateY ±8px, 3s ease-in-out loop)
- Genie thinking: scale pulse 1.0→1.05, cyan glow intensifies
- Screen transitions: fade (200ms)
- Message appear: slide up + fade (150ms)

**Typography:**
- Logo: Orbitron (Google Fonts) — futuristic, geometric
- Body: Inter — clean, readable
- Code/terminal: JetBrains Mono
