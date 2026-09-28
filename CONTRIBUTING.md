# Contributing to MSPC

MSPC is a self-hosted, open-source AI agent workspace. Contributions are welcome.

## Getting Started

```bash
git clone https://github.com/sid-lakhani/mspc.git
cd mspc
npm install
cp .env.example .env  # fill in MSPC_SECRET
npm run dev
```

The dev server starts the MSPC server on port 3000 and the Vite client on port 5173.
Visit `http://localhost:5173` — all API/WS calls are proxied to the server.

## Project Structure

```
src/
├── server/          ← HTTP + WebSocket server (entry point)
│   ├── routes/      ← REST API route handlers
│   └── ws/          ← WebSocket handlers
├── main/            ← Core logic: PTY, Hive, git, memory, config, db
├── renderer/        ← Browser client (React, Pixi.js, xterm.js)
│   └── src/
│       ├── components/  ← React components
│       ├── scene/       ← Pixi.js office floor
│       ├── store/       ← Zustand state
│       ├── terminal/    ← xterm.js integration
│       └── i18n/        ← Internationalization (English-only initially)
└── shared/          ← Shared TypeScript types and utilities
```

## Code Style

- TypeScript strict mode everywhere
- No `any` without a comment explaining why
- Functional React components only

## Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Run `npm run typecheck` to verify no type errors
5. Open a PR against `main`

## Architecture Decisions

- The server is the source of truth. The browser is a thin client.
- All file and PTY operations happen server-side, never in the browser.
- The Hive (multi-agent coordination) is a pure Node.js module.
- WebSocket is the real-time channel for agent terminal output and floor events.
- Auth is single-owner password-based with bcrypt + HttpOnly session cookies.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
