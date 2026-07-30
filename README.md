<div align="center">
  <h1>Zeva Connect</h1>
  <p><strong>Real-time chat & messaging platform for Zeva Clinic staff</strong></p>
  <p>
    <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white" />
    <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white" />
    <img alt="Express" src="https://img.shields.io/badge/Express-5-000000?logo=express" />
    <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio" />
    <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white" />
    <img alt="Redis" src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" />
    <img alt="Docker" src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" />
  </p>
</div>

---

## Features

**Messaging**
- Direct (1-on-1) and group conversations
- Rich text with **@mentions**, emoji picker, reactions
- Reply / quote, forward messages, pin messages
- Edit, delete (for me / for everyone)
- Read receipts & delivery status (`sent` → `delivered` → `read`)
- Typing indicators, online presence, last-seen
- Search messages globally and within conversations

**Attachments**
- Upload images, videos, documents, audio, files (Cloudinary)
- Up to 5 files per upload, rate-limited
- Attachment browser: view **Media**, **Files**, **Links** per conversation

**Groups**
- Create group chat, set name/avatar
- Add/remove members, grant/revoke admin
- Group settings, leave group, pinned messages bar

**Auth & Security**
- Zeva SSO ticket verification + email/password login
- JWT access (short-lived, `Authorization: Bearer`) + httpOnly refresh cookie
- Role-based staff model (`doctor` / `receptionist` / `staff` / `admin`)
- Clinic-scoped isolation — every query is implicitly filtered by `clinicId`
- Rate limiters on auth, refresh, upload endpoints (Redis-backed)
- Socket.IO JWT auth middleware, force-logout on revocation

**Notifications**
- Web Push (VAPID) — browsers register, receive push on new message
- Per-device subscription mgmt + device revocation page in Settings

**Real-time**
- Socket.IO rooms: per-user, per-conversation, per-clinic
- Presence broadcasts (online/offline) to clinic members
- REST controllers also emit socket events so both HTTP and socket flows stay in sync

---

## Tech Stack

| Layer        | Technologies                                                                 |
|--------------|------------------------------------------------------------------------------|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui + @base-ui/react, Zustand, TanStack Query, React Router, Socket.IO Client, Sonner toasts, Emoji Picker |
| **Backend**  | Node.js 20, Express 5, TypeScript, Socket.IO 4, Zod validation, Pino logger, Mongoose 9, ioredis |
| **Data**     | MongoDB 7 (conversations + messages + users + tokens + push subscriptions), Redis 7 (rate limiting) |
| **Storage**  | Cloudinary — attachments                                                                                     |
| **DevOps**   | Docker multi-stage build, docker-compose, nginx optional sidecar                                            |

---

## Project Structure

```
zeva-connect/
├── client/                       # React + Vite SPA
│   ├── public/                   # static assets, service worker
│   └── src/
│       ├── api/                  # axios REST clients per domain
│       ├── components/
│       │   ├── chat/             # full chat UI kit (bubbles, list, input, dialogs…)
│       │   ├── common/           # theme toggle, notification gate
│       │   ├── layout/           # AppLayout, Sidebar, Header
│       │   ├── settings/         # device list, theme selector
│       │   └── ui/               # shadcn-style primitives
│       ├── context/              # Auth, Socket, Theme providers
│       ├── hooks/                # useSocket, useMessages, usePushNotifications, useTyping, useVoiceRecorder, useConversations
│       ├── pages/                # Login, Chat, Dashboard, Settings, SSO callback
│       ├── store/                # Zustand stores (chat, ui, user)
│       ├── types/                # shared TS types
│       └── utils/                # formatters, helpers
│
├── server/                       # Node + Express + Socket.IO
│   └── src/
│       ├── config/               # env, MongoDB, Cloudinary
│       ├── controllers/          # request handlers (auth / conversation / message / user / push / upload / internal)
│       ├── middlewares/          # auth, error, rate-limit (Redis), socket auth, file upload
│       ├── models/               # Mongoose schemas: User, Conversation, Message, RefreshToken, PushSubscription
│       ├── routes/               # REST router + domain routes
│       ├── services/             # business logic layer
│       ├── sockets/              # Socket.IO: chat + presence handlers
│       ├── types/                # express augmentation, socket events, model types
│       ├── utils/                # AppError, logger, apiResponse, linkify
│       ├── app.ts                # Express app + SPA static serve fallback
│       └── server.ts             # http server + Socket.IO init + startup
│
├── docker/
│   ├── Dockerfile                # multi-stage: client-build → server-build → production (alpine)
│   ├── docker-compose.yml        # mongo + redis + app
│   └── nginx.conf                # optional reverse proxy
│
├── package.json                  # root workspace scripts (concurrently, docker helpers)
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js **20+**
- MongoDB **7** (local or Atlas)
- Redis **7** (for rate limiting)
- Cloudinary account (attachments — optional for local dev experiments)

### 1. Clone and install

```bash
git clone <your-repo>
cd zeva-connect

# Install root concurrently wrapper
npm install

# Install server + client deps
npm install --prefix server
npm install --prefix client
```

### 2. Configure environment

Create `server/.env` — copy the keys below and fill in values:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/zeva-connect

# JWT
JWT_ACCESS_SECRET=replace-me-with-a-random-32-byte-string
JWT_REFRESH_SECRET=replace-me-with-a-different-random-32-byte-string
ACCESS_TOKEN_EXPIRES_IN_MINUTES=15
REFRESH_TOKEN_EXPIRES_IN_DAYS=7

# Zeva internal SSO integration
ZEVA_AUTH_INTERNAL_URL=https://auth.your-zeva-clinic.internal
ZEVA_INTERNAL_API_KEY=shared-secret-with-zeva-core

# Web Push (VAPID) — generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@your-clinic.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Run locally (dev)

Starts backend (5000) + Vite dev server (5173) with live reload:

```bash
npm run dev
```

Then open **http://localhost:5173**

### 4. Build & run production locally

```bash
npm run build
npm run start:server
# App served at http://localhost:5000 (SPA static + API merged)
```

---

## Docker Deployment

One command to bring up the full stack (MongoDB + Redis + App) on any machine:

```bash
# Build images and start
npm run docker:up     # or: docker compose -f docker/docker-compose.yml up -d --build

# Tail app logs
npm run docker:logs   # or: docker compose -f docker/docker-compose.yml logs -f app

# Teardown
npm run docker:down
```

**Container ports:**
| Service   | Host port | Internal   | Notes                                         |
|-----------|-----------|------------|-----------------------------------------------|
| App       | 5000      | 5000       | SPA + API + Socket.IO all on a single origin  |
| MongoDB   | 27017     | 27017       | Persisted in `mongo_data` Docker volume       |
| Redis     | 6380      | 6379       | Mapped to 6380 to avoid conflict with any host Redis |

App container auto-wires `MONGO_URI` and `REDIS_URL` via `docker-compose.yml` override; the rest of the secrets are still read from `server/.env` (`env_file`).

---

## API Reference

All routes live under **`/api/v1`**. `GET /api/v1/health` → `{ "status": "ok" }`.

### Auth (`/auth`)

| Method | Path              | Auth | Purpose                                              |
|--------|-------------------|------|------------------------------------------------------|
| POST   | `/sso/verify`     | ➖   | Verify a Zeva SSO ticket → access + refresh tokens   |
| POST   | `/login`          | ➖   | Email + password login (clinic-staff accounts)       |
| POST   | `/refresh`        | ➖   | Exchange httpOnly refresh cookie for new access JWT  |
| POST   | `/logout`         | ➖   | Revoke refresh token + clear cookie                  |
| GET    | `/me`             | ✅   | Current user profile                                 |

### Conversations (`/conversations`)

| Method | Path                            | Auth | Purpose                                     |
|--------|---------------------------------|------|---------------------------------------------|
| GET    | `/`                             | ✅   | List my conversations (with last msg preview) |
| POST   | `/group`                       | ✅   | Create a new group chat                     |
| GET    | `/search/global`               | ✅   | Cross-conversation full-text search + user mention search |
| POST   | `/mute`                        | ✅   | Mute/unmute a conversation for me           |
| POST   | `/group/add-members`           | ✅   | Add members to group (admin)                |
| POST   | `/group/remove-member`         | ✅   | Remove member (admin)                       |
| POST   | `/group/make-admin`            | ✅   | Promote member to admin                     |
| POST   | `/group/remove-admin`          | ✅   | Demote admin                                |
| PATCH  | `/:conversationId/settings`    | ✅   | Update group name/avatar (admin)            |
| POST   | `/:conversationId/leave`       | ✅   | Leave the group                             |

### Messages (`/messages`)

| Method | Path                             | Auth | Purpose                                         |
|--------|----------------------------------|------|-------------------------------------------------|
| GET    | `/search/all`                   | ✅   | Search all messages across all my conversations  |
| POST   | `/send`                         | ✅   | Send a message (text + attachments + reply + mentions) — lazy-creates direct convo |
| GET    | `/:conversationId`              | ✅   | Paginated messages                               |
| POST   | `/:conversationId/read`         | ✅   | Mark whole conversation as read                 |
| GET    | `/:conversationId/media`        | ✅   | List media attachments                           |
| GET    | `/:conversationId/files`        | ✅   | List file attachments                            |
| GET    | `/:conversationId/links`        | ✅   | Extracted link aggregation                       |
| GET    | `/:conversationId/pinned`       | ✅   | Pinned messages                                  |
| POST   | `/:messageId/react`             | ✅   | Add/remove emoji reaction                        |
| POST   | `/:messageId/pin`               | ✅   | Pin/unpin message                                |
| PATCH  | `/:messageId`                   | ✅   | Edit message                                     |
| DELETE | `/:messageId`                   | ✅   | Delete (for me / for everyone)                   |
| POST   | `/:messageId/forward`           | ✅   | Forward message to another conversation          |

### Users / Push / Upload

| Domain   | Method | Path              | Purpose                                     |
|----------|--------|-------------------|---------------------------------------------|
| Users    | GET    | `/users`          | List all active clinic staff (pickers, mentions) |
| Push     | POST   | `/push/subscribe` | Register browser web-push subscription      |
| Push     | POST   | `/push/unsubscribe` | Unregister current device                |
| Push     | GET    | `/push/devices`   | List my push-enabled devices                |
| Push     | DELETE | `/push/devices/:id` | Revoke a device push subscription       |
| Upload   | POST   | `/upload`         | Attach up to 5 files via multipart `files[]` → returns Cloudinary URLs |

Internal-only routes (`/internal-api/*`) are protected by a shared `ZEVA_INTERNAL_API_KEY` header and are used by the Zeva Clinic core system for user sync / deactivation hooks.

---

## Socket.IO Events

**Namespace**: `/` (default), connected with `{ auth: { token: "<access-jwt>" }, withCredentials: true }`

### Client → Server

| Event               | Payload                                                |
|---------------------|--------------------------------------------------------|
| `message:send`      | `{ conversationId?, recipientId?, text, attachments[], replyTo? }` |
| `message:markRead`  | `{ conversationId, messageId }`                        |
| `typing:start`      | `{ conversationId }`                                   |
| `typing:stop`       | `{ conversationId }`                                   |

### Server → Client

| Event               | Target                          | Description                                |
|---------------------|---------------------------------|--------------------------------------------|
| `message:new`       | conversation room               | A new message was posted                   |
| `message:updated`   | conversation room               | Message edited / deleted / reacted        |
| `message:read`      | conversation room               | Read receipt                               |
| `typing:start`      | conversation room (except self) | Sender is typing                           |
| `typing:stop`       | conversation room (except self) | Sender stopped typing                      |
| `presence:update`   | `clinic:<clinicId>` room        | `{ userId, isOnline, lastSeenAt }`         |
| `force:logout`      | specific socket                 | Access revoked — close + re-login          |
| `error`             | individual socket               | Contextual error for the emitting action   |

---

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     FIRST LOGIN (SSO)                        │
│                                                              │
│  Zeva Clinic Core ──SSO ticket──▶  POST /api/v1/auth/sso     │
│                                          │                   │
│                        ticket validated + user synced        │
│                                          ▼                   │
│            ◀──  access JWT (15 min, JSON)                   │
│            ◀──  refresh token (7 days, httpOnly cookie)     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     SUBSEQUENT REQUESTS                      │
│                                                              │
│  Every REST call  ──▶  Authorization: Bearer <access JWT>    │
│  Every socket conn ──▶  auth.token on handshake              │
│                                                              │
│  Access JWT expires ⇒ silent refresh via                    │
│  POST /api/v1/auth/refresh  (cookie auto-sent)              │
└──────────────────────────────────────────────────────────────┘
```

All data is implicitly scoped by `clinicId` injected from the verified JWT; cross-clinic data leakage is impossible at both REST and socket layers.

---

## Scripts

From the **root** folder:

| Script               | What it does                                                          |
|----------------------|-----------------------------------------------------------------------|
| `npm run dev`        | Start **both** `server` (tsx watch) and `client` (vite) concurrently |
| `npm run build`      | Production build for server + client                                  |
| `npm run start:server` | Run the built Node server                                           |
| `npm run docker:build` | Build Docker images via compose                                     |
| `npm run docker:up`    | Compose up (build + start containers detached)                      |
| `npm run docker:down`  | Compose stop + remove                                                |
| `npm run docker:logs`  | Tail app container logs                                              |

Per-package scripts also work:
```bash
npm run dev --prefix server      # backend only
npm run dev --prefix client      # frontend only
npm run build --prefix server    # tsc + tsc-alias
npm run build --prefix client    # tsc -b + vite build
```

---

## Environment Variables Reference

| Variable                           | Required | Default                      | Purpose                                     |
|------------------------------------|----------|------------------------------|---------------------------------------------|
| `PORT`                             | ➖       | 5000                         | Server listen port                          |
| `NODE_ENV`                         | ➖       | development                  | Toggles SPA static serving + error formats |
| `MONGO_URI`                        | ✅       | —                            | MongoDB connection string                   |
| `CLIENT_URL`                       | ➖       | `http://localhost:5173`      | CORS origin + Socket.IO origin              |
| `JWT_ACCESS_SECRET`                | ✅       | —                            | Sign access tokens                          |
| `JWT_REFRESH_SECRET`               | ✅       | —                            | Sign refresh tokens                         |
| `ACCESS_TOKEN_EXPIRES_IN_MINUTES`  | ➖       | 15                           | Access JWT TTL                              |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS`    | ➖       | 7                            | Refresh token TTL + DB row TTL              |
| `ZEVA_AUTH_INTERNAL_URL`           | ➖       | —                            | Zeva Core base URL for SSO ticket verify    |
| `ZEVA_INTERNAL_API_KEY`            | ➖       | —                            | Shared key for internal-api routes          |
| `VAPID_PUBLIC_KEY`                 | ➖       | —                            | Web Push public key (browsers register)     |
| `VAPID_PRIVATE_KEY`                | ➖       | —                            | Web Push private key (server signs pushes)  |
| `VAPID_SUBJECT`                    | ➖       | `mailto:admin@example.com`   | Web Push contact                            |
| `CLOUDINARY_CLOUD_NAME`            | ➖       | —                            | Cloudinary uploads                          |
| `CLOUDINARY_API_KEY`               | ➖       | —                            | Cloudinary uploads                          |
| `CLOUDINARY_API_SECRET`            | ➖       | —                            | Cloudinary uploads                          |

---

## Production Notes

- **Zero-trust architecture**: never ship the `server/.env` file in an image — mount secrets via `env_file` / Docker secrets / env provider.
- **Backups**: `mongo_data` volume is the only critical persisted state; take scheduled `mongodump` snapshots. Cloudinary stores attachments externally.
- **Scaling sockets**: if you scale the app horizontally, you need Socket.IO **Redis adapter** (not wired yet — add `@socket.io/redis-adapter` and point it to the same Redis instance) to broadcast across multiple pods.
- **CORS**: in production set `CLIENT_URL` to the real origin; Socket.IO and cookie SameSite depend on it.
- **SPA fallback**: all non-`/api/*`, non-`/socket.io/*` GET requests return `client-dist/index.html` so React Router deep-links work.

---

## License

ISC — same as the root [package.json](file:///c:/Users/HP/Desktop/DigLip7/zeva-connect/package.json).
