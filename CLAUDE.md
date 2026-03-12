# Backlog Tooling

Real-time meeting facilitation app for planning/estimation sessions. Teams work through agenda items, give signals, do estimation poker, and share scratchboard notes. Built around Aerius JIRA items (aerius.atlassian.net).

## Tech Stack

- **Frontend**: Vue 3 (Composition API) + Vite + Pinia + TypeScript + SASS
- **API**: Express 5 + Socket.IO 4 + TypeScript
- **Dev gateway**: Express proxy on port 8080 routing `/api` to API (3000) and `/` to frontend (5173)

## Running

Full stack via tmux:
```bash
./dev/serve.sh
```

Individual services:
```bash
cd frontend && npm run dev     # port 5173
cd api && npm run dev          # port 3000
cd dev/gateway && npm run start # port 8080
```

## Building

```bash
cd frontend && npm run build   # vite -> dist/
cd api && npm run build        # tsc -> dist/
```

## Testing & Linting

```bash
cd frontend && npm run test:unit   # vitest
cd frontend && npm run lint        # eslint
cd frontend && npm run type-check  # vue-tsc
```

## Project Structure

```
api/src/
  server.ts                  # Express + Socket.IO entry point (port 3000)
  api/socketEvents.ts        # WebSocket event handlers
  data/roomStateManager.ts   # Room state logic (signals, poker)
  data/scratchboardmanager.ts
  email/sessionSummary.ts    # Email summary composition + sending (SMTP)
  jira/postEstimates.ts      # JIRA story point posting on session finish

frontend/src/
  main.ts                    # Vue app entry
  App.vue                    # Root layout (nav | main | user-panel grid)
  router/index.ts            # Routes: /, /agenda/:code, /summary
  stores/
    contextStore.ts          # Local UI state (sound, panel visibility)
    scheduleStore.ts         # Schedule items + grouping
  ws/socketManager.ts        # Socket.IO client + Pinia store
  views/                     # HomeView, AgendaItemView, SummaryView
  components/
    nav/                     # Left sidebar, schedule navigation
    signals/                 # SimpleSignals, EstimationPoker, Scratchboard
    mod/                     # UserPanel, moderator controls
  domain/types.ts            # ActionType enum, shared interfaces

dev/
  serve.sh                   # Tmux launcher for all 3 services
  gateway/src/proxy.ts       # Dev proxy
```

## Architecture

- **WebSocket rooms**: Each agenda item is a Socket.IO room. Signals and poker votes are room-scoped.
- **State**: Server holds all room state in-memory (Map<room, Map<user, Map<action, fragment>>>). Frontend mirrors via Pinia stores.
- **Moderator role**: Claimed per-session. Controls schedule, reveals, locks, resets, drumroll.
- **Locked items**: When moderator locks an item, user actions are frozen and the item is marked done. Tracks which moderator locked it.
- **Session finish**: Posts consensus estimates to JIRA (majority wins, ties skipped, existing values never overwritten), sends email summary to SMTP_TO + any moderator-provided emails, then resets all state.
- **JIRA integration**: Uses basic auth (JIRA_USER + JIRA_API_TOKEN). "Story point estimate" (customfield_10016) = test SP, "Story Points" (customfield_10028) = dev + test SP. No test votes defaults to 0sp test. Field IDs auto-discovered with hardcoded fallback for the Aerius instance.
- **Email**: SMTP via Gmail (SMTP_USER, SMTP_PASS, SMTP_TO). Moderators can add their email (stored in localStorage, collected per-session). All recipients deduplicated.

## Code Style

- Prettier: 100 char width, 2 spaces, trailing commas, semicolons
- ESLint: strict equality, curly braces required, const-first, no console (warn)
- Vue: Composition API with `<script setup lang="ts">`, scoped SCSS
- PascalCase components, camelCase functions/variables
