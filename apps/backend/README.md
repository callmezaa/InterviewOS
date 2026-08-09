# InterviewOS Backend

NestJS 11 + PostgreSQL + Socket.io realtime API for the InterviewOS platform.

## Stack

- **Framework**: NestJS (TypeScript, commonjs)
- **Database**: PostgreSQL via Prisma ORM
- **Realtime**: Socket.io gateway with optional Redis adapter (`@socket.io/redis-adapter`)
- **Auth**: Passport JWT (Bearer + cookie), OAuth Google/GitHub, 2FA (TOTP)
- **AI**: Google Gemini — transcription, question generation, complexity analysis
- **Code execution**: Remote Wandbox test runner
- **Storage**: Local filesystem (default), AWS S3 / GCS (opt-in)

## Quickstart

From the repo root:

```bash
npm run db:up            # start postgres + redis
npm install
npm run db:migrate       # prisma migrate dev + generate
cd apps/backend && npm run start:dev   # port 3001
```

Environment variables are documented in the root `.env.example`. All AI/email/oauth
features fall back to safe mocks when their keys are absent, so the app runs
locally with zero setup.

## Tests

```bash
npm run test             # jest unit tests
npm run test:e2e         # jest e2e (test/app.e2e-spec.ts)
```

## Module map

| Module        | Responsibility                                    |
|---------------|---------------------------------------------------|
| `auth`        | register/login/refresh, 2FA, sessions, OAuth flows |
| `realtime`    | WebSocket gateway (join-room, signaling, sync)    |
| `interview`   | CRUD, status/reschedule, code & test runner       |
| `ai`          | Gemini transcription + question/complexity        |
| `media`       | recording upload/list/delete (local/S3/GCS)       |
| `webrtc`      | ICE/TURN configuration endpoint                   |
| others        | questions, templates, branding, notifications, calendar, integrations, activity, health |