# MSPC — Michael Scott Paper Company

### Self-hosted, open-source AI agent workspace

Run a virtual office of autonomous AI coding agents in your browser, orchestrated by a server-side runtime you control entirely.

> **"I'm not superstitious, but I am a little stitious about self-hosting."**
> — Michael Scott (probably)

---

## What Is MSPC?

MSPC is a **self-hosted** AI agent workspace that turns your server into a multi-agent coding office. Multiple autonomous AI agents work in parallel — each in its own terminal session — coordinated by an orchestrator (Michael), visualized as an animated Pixi.js office floor in your browser.

You access it from any browser. No Electron, no desktop app, no proprietary cloud.

**The office metaphor is intentional.** Agents have desks. They leave messages in each other's inboxes. Michael runs standup. The Hive keeps the shared task board. That's not whimsy — it's the coordination protocol.

---

## Features

- **Multi-agent orchestration** — spawn, kill, message, and monitor AI agents from the browser
- **Pixi.js office floor** — animated visualization of your agent team at work
- **Agent-to-agent messaging** — inbox/outbox protocol with the Hive coordination layer
- **Shared task board** — kanban-style task management visible to all agents
- **Memory system** — per-agent persistent memory with semantic search (MemPalace)
- **Git integration** — commit graph, branch management, diff viewer in the browser
- **MCP support** — built-in MCP server catalog with per-agent consent management
- **Webhooks & Slack** — inbound triggers for agent dispatch
- **Scheduled missions** — cron-style hourly ops standups, heartbeat, auto-compact
- **Provider agnostic** — Claude Code, Antigravity (Gemini), OpenAI Codex, Grok, Kimi, Gemini CLI, Qwen, OpenCode, Crush, pi.dev, GitHub Copilot CLI, Cursor, and local LLMs

---

## Architecture

```
Browser (React + Pixi.js)
    ↕ HTTPS / WSS
MSPC Server (Express + WebSocket)
    ↕ REST / WS
Agent Manager (src/main/)
    ↕ PTY
AI CLI Agents (claude, codex, grok, …)
```

- **`src/server/`** — HTTP + WebSocket server (Express, ws)
- **`src/main/`** — Core logic: PTY manager, Hive, config, git, memory, skills, telemetry
- **`src/renderer/`** — Browser client (React 18, Pixi.js 8, xterm.js, Zustand)
- **`src/shared/`** — Shared TypeScript types and utilities

---

## Self-Hosting

### Requirements

- Node.js 20+
- Git
- At least one AI CLI installed: `claude`, `codex`, `gemini`, etc.

### Quick Start

```bash
git clone https://github.com/sid-lakhani/mspc.git
cd mspc
npm install

# Set required environment variables
export MSPC_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
export MSPC_DATA_DIR=$HOME/.mspc   # where MSPC stores config, agent workspaces, logs

# Development (server + client with hot reload)
npm run dev

# Production build
npm run build
npm start
```

Open your browser at `http://localhost:3000` and complete the first-time setup.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MSPC_PORT` | `3000` | HTTP port |
| `MSPC_DATA_DIR` | `~/.mspc` | Data directory for config, agent workspaces, logs |
| `MSPC_SECRET` | — | **Required in production.** Session signing secret (32+ random bytes) |
| `MSPC_PUBLIC_URL` | — | Public URL (e.g. `https://office.example.com`) |
| `NODE_ENV` | `development` | `production` for production mode |

### Docker

```bash
docker-compose up -d
```

See [`docker-compose.yml`](./docker-compose.yml) for the full configuration.

### Reverse Proxy (Nginx)

```nginx
server {
    server_name office.example.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Security

MSPC is a **single-owner** self-hosted tool. It uses:

- **Password authentication** — bcrypt-hashed password, HttpOnly session cookies, SameSite=strict
- **Path isolation** — all file access validated against your registered project roots
- **No external analytics** — zero telemetry leaves your server
- **Local OTLP telemetry** — optional, self-contained agent usage tracking (never sent externally)

**Do not expose MSPC to the public internet without a reverse proxy and TLS.**
**Set `MSPC_SECRET` to a cryptographically random value in production.**

See [`SECURITY.md`](./SECURITY.md) for the full security model.

---

## Documentation

| Document | Description |
|----------|-------------|
| [`HIVE.md`](./HIVE.md) | Hive coordination protocol design |
| [`SPEC.md`](./SPEC.md) | Product specification |
| [`DESIGN.md`](./DESIGN.md) | Architecture and design decisions |
| [`MEMORY_GRAPH_SPEC.md`](./MEMORY_GRAPH_SPEC.md) | Memory graph specification |
| [`TELEMETRY.md`](./TELEMETRY.md) | Local telemetry (no external services) |
| [`SECURITY.md`](./SECURITY.md) | Security model and self-hosting notes |

---

## Tech Stack

- **Server** — Node.js, Express, ws (WebSocket), better-sqlite3, node-pty, bcrypt
- **Client** — React 18, Pixi.js 8, xterm.js, Zustand, CodeMirror, react-i18next
- **Build** — Vite (client), tsx/tsc (server)

---

## License

> [!IMPORTANT]
> **Asset licensing.** The bundled pixel art (tilesets and maps) is **Modern Interiors - RPG Tileset
> [16X16]** by [LimeZu](https://limezu.itch.io/moderninteriors), used under the **Complete Version
> licence**, which permits editing and use in commercial and non-commercial projects. **Credit to
> LimeZu is required by that licence** and must stay in place. The Office cast is not LimeZu art. It
> is drawn procedurally in `portraitArt.ts`. See
> [`src/renderer/src/assets/ATTRIBUTION.md`](./src/renderer/src/assets/ATTRIBUTION.md).

The **source code** is licensed under the **MIT License**. See [`LICENSE`](./LICENSE). The MIT grant
covers the code only; the bundled pixel art is licensed separately from LimeZu and is carved out in
[`LICENSE-ASSETS`](./LICENSE-ASSETS).

---

## Acknowledgements

- [LimeZu](https://limezu.itch.io/) for the *Modern Interiors* pixel-art tilesets (Complete Version licence)
- [`shahar061/the-office`](https://github.com/shahar061/the-office) for the office tileset/map vendoring
- [Pixi.js](https://pixijs.com/) · [xterm.js](https://xtermjs.org/) · [node-pty](https://github.com/microsoft/node-pty) · [Vite](https://vitejs.dev/) · [CodeMirror](https://codemirror.net/) for the libraries this is built on
- *The Office* (US) for the office metaphor and the name

---

## Attribution

**MSPC** began as a derivative of [Munder Difflin](https://github.com/chaitanyagiri/munder-difflin)
by [Chaitanya Giri](https://github.com/chaitanyagiri) and has since been substantially reworked into
a self-hosted, web-native AI agent workspace.

The original source code is licensed under the MIT License — see [`LICENSE`](./LICENSE) for details.
Additional third-party assets may be subject to separate licenses; see [`LICENSE-ASSETS`](./LICENSE-ASSETS).
