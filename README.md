# InterviewOS

InterviewOS is a production-grade, AI-powered realtime collaboration and interview platform that integrates Zoom-style peer-to-peer video calls, Loom-style screen recording, HackerRank-style synchronized coding, and automatic speech-to-text transcripts.

The frontend is styled in a **dark-mode-first Apple catalog design system** with Action Blue accents, strict typography letter-spacing rules, and low elevation guidelines.

---

## 🏗️ Architecture & Monorepo Structure

InterviewOS is a modular monorepo using **npm workspaces**:

```
InterviewOS/
├── apps/
│   ├── frontend/         # Next.js (App Router, Tailwind v4, Zustand, Monaco)
│   ├── backend/          # NestJS (Socket.io Gateway, Prisma, PostgreSQL, Passport JWT)
│   └── shared/           # Shared types + compiler/language maps consumed by both apps
├── docker-compose.yml    # PostgreSQL + Redis services
├── package.json          # Root workspace scripts and dependencies
├── .env.example          # Environment variable template
└── README.md             # This document
```

### Key Architectural Layers
1. **API Layer**: Standard REST endpoints hosted by NestJS at `/api/*` secured with Bearer JWT tokens (Passport strategy), with rate limiting, 2FA, and OAuth (Google/GitHub).
2. **Realtime Signaling Layer**: WebSocket connection gateway using Socket.io inside NestJS to relay WebRTC session offers, answers, ICE candidates, collaborative keystrokes, speaking waveforms, and transcription segments. Uses Redis pub/sub for horizontal scaling (falls back to single-instance in-memory when `REDIS_URL` is empty).
3. **Database Layer**: PostgreSQL via Prisma ORM.
4. **Media & AI services**: Media storage adapters (local / S3 / GCS) plus AI-driven transcription, question generation, suggestion, and complexity evaluation via Google Gemini.
5. **State Layer (UI)**: Zustand global state stores tracking connections, peers, stream objects, and code synchronization.

---

## ⚡ WebRTC & Realtime Synchronization Flows

The platform coordinates peer-to-peer connection handshakes dynamically:

```mermaid
sequenceDiagram
    participant PeerA as Candidate Socket
    participant Server as Socket.io Gateway
    participant PeerB as Interviewer Socket

    PeerA->>Server: join-room (interviewId, user details)
    Server-->>PeerA: room-joined-success (peers list, current code state)

    Note over PeerB: When PeerB joins room...
    PeerB->>Server: join-room (interviewId, user details)
    Server->>PeerA: peer-joined (PeerB details, socketId)

    Note over PeerA: PeerA initializes RTCPeerConnection & adds local tracks
    PeerA->>Server: webrtc-signal (targetUserId, signal: sdpOffer)
    Server->>PeerB: webrtc-signal-received (senderUserId, signal: sdpOffer)

    Note over PeerB: PeerB sets remote offer, adds tracks, creates answer
    PeerB->>Server: webrtc-signal (targetUserId, signal: sdpAnswer)
    Server->>PeerA: webrtc-signal-received (senderUserId, signal: sdpAnswer)

    E2E Flow Negotiated Successfully
```

- **Keystroke Sync**: broadcasts `code-change` over WebSockets and persists the code state (plus a throttled revision history) to the database.
- **Waveform Audio**: checks local mic levels and relays numerical peaks (`audio-level`) to feed live speaker waveforms.
- **Proctoring**: candidate-side tab/focus events are throttled client-side and relayed to the room plus persisted for review.

---

## 🎨 UI/UX Design System (Tailwind v4)

Styles are mapped in `apps/frontend/src/app/globals.css`:

- **Accent color**: Action Blue (`#0066cc` / `--color-primary`) is the single BRAND interactive indicator. Focus rings use Focus Blue (`#0071e3`).
- **Canvases**: Alt dark tiles (`#272729` / `--color-surface-tile-1`, `#2a2a2c`, `#252527`) rest on a pure black backdrop (`#000000`).
- **Rounded corner constants**: SM (`8px` for buttons), MD (`11px` capsules), LG (`18px` cards), and full Pill (`9999px`).
- **Product drop shadow**: `rgba(0,0,0,0.22) 3px 5px 30px` applied only to video feed panels.

---

## 🚀 Development Quickstart

### 1. Prerequisites
- Node.js ≥ 18 (`.node-version` pins 22.12.0)
- Docker (for PostgreSQL + Redis)

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Start local infrastructure
```bash
npm run db:up          # postgres + redis via docker-compose
```

### 4. Install deps & run migrations
```bash
npm install
npm run db:migrate     # prisma migrate dev + generate (workspace apps/backend)
```

### 5. Run Dev Servers Concurrently
```bash
npm run dev            # Next.js frontend (:3000) + NestJS backend (:3001)
```

---

## 🧪 Testing

```bash
npm run lint           # eslint (workspaces)
npm run typecheck      # tsc --noEmit (workspaces)
npm run test           # frontend (vitest) + backend (jest) unit tests
npm run test:backend:e2e
npm run test:e2e       # Playwright E2E (requires dev servers)
```

---

## 🗺️ Engineering Roadmap

- [x] Scaffold monorepo workspaces, Docker configs, CI/CD (GitHub Actions)
- [x] JWT + cookie-based auth, OAuth (Google/GitHub), 2FA, sessions
- [x] Socket.io gateway signaling: WebRTC offers/answers/ICE, keystroke sync, audio-level, transcript relay, proctoring
- [x] Apple-themed collaborative editor with compiler inputs + remote test runner (Wandbox)
- [x] Media recording upload + local/S3/GCS storage adapters
- [x] Gemini-backed transcription, question generation, complexity analysis (mock fallback without a key)
- [ ] Convert mock notifications/email to real providers (Resend/Mailjet)
- [ ] Add real GEMINI/RESEND/OAuth values to production env
- [ ] Enforce per-interview room authorization on WebSocket join
- [ ] Scale Redis pub/sub to multiple instances

---

## 🗺️ Deployment

- **Backend**: Railway / Nixpacks via `railway.json`, `nixpacks.toml`, and `apps/backend/Dockerfile`
- **Frontend**: Vercel (`vercel` action in `.github/workflows`)
- **CI**: `.github/workflows/ci.yml`, `deploy.yml`, `preview.yml`