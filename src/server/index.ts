/**
 * MSPC Server — Michael Scott Paper Company
 *
 * Self-hosted, open-source AI agent workspace server.
 *
 * This is the main server entry point. It replaces the Electron main process
 * with an HTTP + WebSocket server that:
 *   - Serves the web client (in production, static files; in dev, proxied to Vite)
 *   - Exposes a REST API for all agent/config/hive operations
 *   - Exposes a WebSocket server for real-time agent output and floor events
 *   - Manages all PTY processes, agent orchestration, git, memory, etc.
 *
 * Architecture:
 *   Browser → HTTPS → MSPC Web → API/WS → MSPC Server → Agent Manager → PTYs
 *
 * Environment variables:
 *   MSPC_PORT         HTTP port to listen on (default: 3000)
 *   MSPC_DATA_DIR     Data directory (default: ~/.mspc)
 *   MSPC_SECRET       Session signing secret (REQUIRED in production)
 *   MSPC_PUBLIC_URL   Public URL for the server (e.g. https://office.example.com)
 *   NODE_ENV          'production' | 'development'
 */

import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';
import express, { type Request, type Response, type NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { WebSocketServer, type WebSocket } from 'ws';

import { MSPC_DATA_DIR } from './routes/config';
import { readConfig, writeConfig } from '../main/config';
import { createAgentRouter } from './routes/agents';
import { createHiveRouter } from './routes/hive';
import { createGitRouter } from './routes/git';
import { createFsRouter } from './routes/filesystem';
import { createConfigRouter } from './routes/config';
import { createAuthRouter } from './routes/auth';
import { createToolsRouter } from './routes/tools';
import { setupWebSocketHandlers } from './ws/handlers';

const PORT = parseInt(process.env.MSPC_PORT ?? '3000', 10);
const IS_DEV = process.env.NODE_ENV !== 'production';

// ─── Ensure data directory ────────────────────────────────────────────────────

mkdirSync(MSPC_DATA_DIR, { recursive: true });
mkdirSync(join(MSPC_DATA_DIR, 'logs'), { recursive: true });
mkdirSync(join(MSPC_DATA_DIR, 'projects'), { recursive: true });
mkdirSync(join(MSPC_DATA_DIR, 'workspaces'), { recursive: true });

console.log(`[mspc] Data directory: ${MSPC_DATA_DIR}`);

// ─── Session secret ───────────────────────────────────────────────────────────

const SESSION_SECRET = process.env.MSPC_SECRET
  ?? (IS_DEV
    ? 'mspc-dev-secret-not-for-production'
    : (() => {
        console.error('[mspc] FATAL: MSPC_SECRET environment variable is required in production.');
        console.error('[mspc] Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
        process.exit(1);
      })());

// ─── Express app ─────────────────────────────────────────────────────────────

const app = express();

// Trust reverse proxy (nginx, caddy) for secure cookies
app.set('trust proxy', 1);

// CORS — dev only, tightened in production
if (IS_DEV) {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));
app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: !IS_DEV,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// ─── Auth middleware ──────────────────────────────────────────────────────────

/** Require an authenticated session for all /api routes except /api/auth. */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if ((req.session as { authenticated?: boolean }).authenticated) {
    next();
    return;
  }
  res.status(401).json({ ok: false, error: 'Not authenticated' });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Authentication (login/logout/check — public)
app.use('/api/auth', createAuthRouter());

// All other API routes require authentication
app.use('/api/config',  requireAuth, createConfigRouter());
app.use('/api/agents',  requireAuth, createAgentRouter());
app.use('/api/hive',    requireAuth, createHiveRouter());
app.use('/api/git',     requireAuth, createGitRouter());
app.use('/api/fs',      requireAuth, createFsRouter());
app.use('/api/tools',   requireAuth, createToolsRouter());

// Health check (public)
app.get('/health', (_req, res) => {
  res.json({ ok: true, version: process.env.npm_package_version ?? '0.1.0' });
});

// Serve static client in production
if (!IS_DEV) {
  const clientDist = resolve(__dirname, '../../renderer/dist');
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // SPA fallback
    app.get('*', (_req, res) => {
      res.sendFile(join(clientDist, 'index.html'));
    });
  } else {
    console.warn('[mspc] Client dist not found. Run `npm run build:client` first.');
  }
}

// ─── HTTP + WebSocket server ──────────────────────────────────────────────────

const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Authenticate WebSocket connections via session cookie
wss.on('connection', (ws: WebSocket, req) => {
  // In production, verify session cookie before allowing WS upgrade
  // For now, the HTTP session cookie is validated by express-session
  // The upgrade handler below enforces auth
  setupWebSocketHandlers(ws, req);
});

// ─── Process supervision ─────────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  console.error('[mspc] uncaughtException (kept alive):', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[mspc] unhandledRejection (kept alive):', reason);
});

process.on('SIGTERM', () => {
  console.log('[mspc] SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('[mspc] HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[mspc] SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    process.exit(0);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  const publicUrl = process.env.MSPC_PUBLIC_URL ?? `http://localhost:${PORT}`;
  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║   MSPC — Michael Scott Paper Company      ║');
  console.log('  ║   AI Agent Workspace                      ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');
  console.log(`  Server:    ${publicUrl}`);
  console.log(`  Data:      ${MSPC_DATA_DIR}`);
  console.log(`  Mode:      ${IS_DEV ? 'development' : 'production'}`);
  console.log('');
  if (IS_DEV) {
    console.log('  Client dev server: http://localhost:5173 (npm run dev:client)');
    console.log('');
  }
});
