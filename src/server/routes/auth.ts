/**
 * MSPC Authentication Routes
 *
 * Single-owner, self-hosted authentication using bcrypt-hashed passwords
 * and secure HttpOnly session cookies.
 *
 * The password is stored as a bcrypt hash in MSPC_DATA_DIR/auth.json.
 * On first boot (no auth.json), MSPC prints a setup URL to the terminal.
 *
 * POST /api/auth/login    { password: string }  → sets session cookie
 * POST /api/auth/logout   { }                   → clears session cookie
 * GET  /api/auth/check    → { authenticated: bool }
 * POST /api/auth/setup    { password: string }  → first-time password setup
 */

import { Router, type Request, type Response } from 'express';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import bcrypt from 'bcryptjs';
import { MSPC_DATA_DIR } from './config';

const AUTH_FILE = join(MSPC_DATA_DIR, 'auth.json');
const BCRYPT_ROUNDS = 12;

interface AuthStore {
  passwordHash: string;
  createdAt: string;
}

// Extend express-session with our auth flag
declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
  }
}

function readAuthStore(): AuthStore | null {
  if (!existsSync(AUTH_FILE)) return null;
  try {
    return JSON.parse(readFileSync(AUTH_FILE, 'utf8')) as AuthStore;
  } catch {
    return null;
  }
}

function writeAuthStore(store: AuthStore): void {
  mkdirSync(MSPC_DATA_DIR, { recursive: true });
  writeFileSync(AUTH_FILE, JSON.stringify(store, null, 2), 'utf8');
}

/** True when no password has been set yet (first boot). */
export function isFirstBoot(): boolean {
  return !existsSync(AUTH_FILE);
}

export function createAuthRouter(): Router {
  const router = Router();

  /** Check whether the current session is authenticated. */
  router.get('/check', (req: Request, res: Response) => {
    res.json({
      authenticated: !!req.session.authenticated,
      setupRequired: isFirstBoot()
    });
  });

  /**
   * First-time setup: set the admin password.
   * Only works when no auth.json exists.
   */
  router.post('/setup', async (req: Request, res: Response) => {
    if (!isFirstBoot()) {
      res.status(400).json({ ok: false, error: 'Password already configured. Use /api/auth/login.' });
      return;
    }
    const { password } = req.body as { password?: string };
    if (!password || password.length < 8) {
      res.status(400).json({ ok: false, error: 'Password must be at least 8 characters.' });
      return;
    }
    try {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      writeAuthStore({ passwordHash, createdAt: new Date().toISOString() });
      req.session.authenticated = true;
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  });

  /** Login with the admin password. */
  router.post('/login', async (req: Request, res: Response) => {
    const store = readAuthStore();
    if (!store) {
      res.status(400).json({ ok: false, error: 'No password configured. Complete setup first.' });
      return;
    }
    const { password } = req.body as { password?: string };
    if (!password) {
      res.status(400).json({ ok: false, error: 'Password required.' });
      return;
    }
    try {
      const valid = await bcrypt.compare(password, store.passwordHash);
      if (!valid) {
        // Constant-time comparison via bcrypt already handles timing attacks.
        // Still add a small delay to limit brute-force rate even without the hash.
        await new Promise((r) => setTimeout(r, 500));
        res.status(401).json({ ok: false, error: 'Invalid password.' });
        return;
      }
      req.session.authenticated = true;
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  });

  /** Logout: destroy the session. */
  router.post('/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true });
    });
  });

  return router;
}
