/**
 * Tools/skills status routes.
 *
 * GET /api/tools/status   → ToolStatus[]
 * GET /api/tools/skills   → local skills list
 */

import { Router, type Request, type Response } from 'express';
import { toolCatalog } from '../../shared/toolCatalog';

export function createToolsRouter(): Router {
  const router = Router();

  router.get('/status', (_req, res: Response) => {
    try {
      // toolCatalog returns static metadata; availability checks are async in full impl
      res.json(toolCatalog);
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  });

  return router;
}
