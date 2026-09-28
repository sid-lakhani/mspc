/**
 * Hive routes — agent orchestration, messaging, task management, memory.
 *
 * GET  /api/hive/registry
 * GET  /api/hive/board
 * GET  /api/hive/tasks
 * GET  /api/hive/log
 * GET  /api/hive/memory/:id
 * GET  /api/hive/inbox/:id
 * POST /api/hive/send
 * POST /api/hive/tasks          (add)
 * PATCH /api/hive/tasks/:id
 * DELETE /api/hive/tasks/:id
 * POST /api/hive/agents/:id/rename
 * POST /api/hive/agents/:id/hold
 * POST /api/hive/agents/:id/role
 * POST /api/hive/agents/:id/archive
 * GET  /api/hive/memory-status
 * POST /api/hive/memory-search
 *
 * NOTE: Full HiveManager wiring to src/main/hive.ts will be completed in the next phase.
 */

import { Router, type Request, type Response } from 'express';

export function createHiveRouter(): Router {
  const router = Router();

  router.get('/registry', (_req, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.' });
  });

  router.get('/board', (_req, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.' });
  });

  router.get('/tasks', (_req, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.' });
  });

  router.get('/log', (_req, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.' });
  });

  router.get('/memory/:id', (req: Request, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.', id: req.params.id });
  });

  router.get('/inbox/:id', (req: Request, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.', id: req.params.id });
  });

  router.post('/send', (_req, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.' });
  });

  router.post('/tasks', (_req, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.' });
  });

  router.patch('/tasks/:id', (req: Request, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.', id: req.params.id });
  });

  router.delete('/tasks/:id', (req: Request, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.', id: req.params.id });
  });

  router.post('/agents/:id/rename', (req: Request, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.', id: req.params.id });
  });

  router.post('/agents/:id/hold', (req: Request, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.', id: req.params.id });
  });

  router.post('/agents/:id/role', (req: Request, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.', id: req.params.id });
  });

  router.post('/agents/:id/archive', (req: Request, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.', id: req.params.id });
  });

  router.get('/memory-status', (_req, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.' });
  });

  router.post('/memory-search', (_req, res: Response) => {
    res.status(501).json({ ok: false, error: 'Hive not yet wired.' });
  });

  return router;
}
