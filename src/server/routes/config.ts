/**
 * MSPC Config Routes
 *
 * REST wrapper around src/main/config.ts.
 *
 * GET  /api/config        → HarnessConfig
 * PATCH /api/config       { patch: Partial<HarnessConfig> } → HarnessConfig
 * POST /api/config/reset  → HarnessConfig (factory defaults)
 * GET  /api/config/home   → { home: string | null }
 */

import { Router, type Request, type Response } from 'express';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readConfig, writeConfig, resetConfig, ensureHarnessHome, setAgentTokenCap } from '../../main/config';

// Re-export for use by other server modules
export { MSPC_DATA_DIR } from '../../main/config';

export function createConfigRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    try {
      res.json(readConfig());
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  });

  router.patch('/', (req: Request, res: Response) => {
    try {
      const patch = req.body;
      if (typeof patch !== 'object' || Array.isArray(patch)) {
        res.status(400).json({ ok: false, error: 'Invalid patch body.' });
        return;
      }
      const updated = writeConfig(patch);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  });

  router.post('/reset', (_req: Request, res: Response) => {
    try {
      res.json(resetConfig());
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  });

  router.get('/home', (_req: Request, res: Response) => {
    try {
      const cfg = readConfig();
      res.json({ home: cfg.harnessHome ?? null });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  });

  router.post('/ensure-home', (req: Request, res: Response) => {
    const { path } = req.body as { path?: string };
    if (typeof path !== 'string' || !path.trim()) {
      res.status(400).json({ ok: false, error: 'path required' });
      return;
    }
    res.json(ensureHarnessHome(path));
  });

  router.post('/agent-token-cap', (req: Request, res: Response) => {
    try {
      const { agentId, tokenCap } = req.body as { agentId?: unknown; tokenCap?: unknown };
      const updated = setAgentTokenCap(agentId, tokenCap);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ ok: false, error: String(e) });
    }
  });

  return router;
}
