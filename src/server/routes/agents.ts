/**
 * Agent management routes — PTY spawn, kill, write, resize, list.
 *
 * POST /api/agents/spawn         { opts: AgentSpawnOptions }
 * POST /api/agents/:id/kill
 * POST /api/agents/:id/write     { data: string }
 * POST /api/agents/:id/resize    { cols: number, rows: number }
 * POST /api/agents/:id/redraw
 * GET  /api/agents               → list of active PTYs
 *
 * Agent terminal output is streamed over WebSocket: /ws (see src/server/ws/handlers.ts).
 *
 * NOTE: Full PTY wiring to src/main/pty.ts will be completed in the next phase.
 * This router is scaffolded so the server compiles cleanly now.
 */

import { Router, type Request, type Response } from 'express';

export function createAgentRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    // TODO: wire to PtyManager.list()
    res.json({ agents: [] });
  });

  router.post('/spawn', async (_req: Request, res: Response) => {
    // TODO: wire to PtyManager.spawn() + HiveManager.ensureAgent()
    res.status(501).json({ ok: false, error: 'Agent spawn not yet wired in this build.' });
  });

  router.post('/:id/kill', (req: Request, res: Response) => {
    // TODO: wire to PtyManager.kill()
    res.status(501).json({ ok: false, error: 'Not yet implemented.', id: req.params.id });
  });

  router.post('/:id/write', (_req: Request, res: Response) => {
    // TODO: wire to PtyManager.write()
    res.status(501).json({ ok: false, error: 'Not yet implemented.' });
  });

  router.post('/:id/resize', (_req: Request, res: Response) => {
    // TODO: wire to PtyManager.resize()
    res.status(501).json({ ok: false, error: 'Not yet implemented.' });
  });

  router.post('/:id/redraw', (_req: Request, res: Response) => {
    // TODO: wire to PtyManager.redraw()
    res.status(501).json({ ok: false, error: 'Not yet implemented.' });
  });

  return router;
}
