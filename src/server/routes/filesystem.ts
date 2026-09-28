/**
 * Filesystem routes — server-side file operations within authorized project roots.
 *
 * SECURITY: All paths are validated against authorized workspace roots.
 * The browser NEVER gets arbitrary filesystem access — the server validates
 * every path before performing any operation.
 *
 * GET  /api/fs/list?root=...&rel=...
 * GET  /api/fs/read?root=...&rel=...
 * GET  /api/fs/read-binary?root=...&rel=...
 * POST /api/fs/write     { root, rel, content }
 * GET  /api/fs/stat?path=...
 */

import { Router, type Request, type Response } from 'express';
import { listDir, readFileText, readFileBinary, writeFileText, statAbs } from '../../main/fs';
import { readConfig } from '../../main/config';
import { isAbsolute, resolve, normalize } from 'node:path';

/** Validate that `absPath` is within one of the user's registered repos or harnessHome. */
function isAuthorizedPath(absPath: string): boolean {
  const cfg = readConfig();
  const allowedRoots = [
    ...(cfg.registeredRepos ?? []),
    cfg.harnessHome
  ].filter((r): r is string => typeof r === 'string' && r.trim().length > 0);

  const normalized = normalize(absPath);
  return allowedRoots.some((root) => normalized.startsWith(normalize(root)));
}

function resolveAndCheck(root: string, rel: string): { path: string; ok: true } | { ok: false; error: string } {
  if (!root || !isAbsolute(root)) return { ok: false, error: 'root must be an absolute path' };
  const resolved = resolve(root, rel ?? '');
  if (!resolved.startsWith(normalize(root))) return { ok: false, error: 'Path traversal denied' };
  if (!isAuthorizedPath(resolved)) return { ok: false, error: 'Path not in authorized workspace' };
  return { ok: true, path: resolved };
}

function q(req: Request, key: string): string {
  return (req.query[key] as string) ?? '';
}

export function createFsRouter(): Router {
  const router = Router();

  router.get('/list', (req, res: Response) => {
    const check = resolveAndCheck(q(req, 'root'), q(req, 'rel'));
    if (!check.ok) { res.status(403).json(check); return; }
    try { res.json(listDir(q(req, 'root'), q(req, 'rel'))); }
    catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
  });

  router.get('/read', (req, res: Response) => {
    const check = resolveAndCheck(q(req, 'root'), q(req, 'rel'));
    if (!check.ok) { res.status(403).json(check); return; }
    try { res.json(readFileText(q(req, 'root'), q(req, 'rel'))); }
    catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
  });

  router.get('/read-binary', (req, res: Response) => {
    const check = resolveAndCheck(q(req, 'root'), q(req, 'rel'));
    if (!check.ok) { res.status(403).json(check); return; }
    try {
      const data = readFileBinary(q(req, 'root'), q(req, 'rel'));
      res.json(data);
    }
    catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
  });

  router.post('/write', (req, res: Response) => {
    const { root, rel, content } = req.body as { root?: string; rel?: string; content?: string };
    if (!root || !rel || typeof content !== 'string') {
      res.status(400).json({ ok: false, error: 'root, rel, and content required' });
      return;
    }
    const check = resolveAndCheck(root, rel);
    if (!check.ok) { res.status(403).json(check); return; }
    try { res.json(writeFileText(root, rel, content)); }
    catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
  });

  router.get('/stat', (req, res: Response) => {
    const p = q(req, 'path');
    if (!isAbsolute(p) || !isAuthorizedPath(p)) {
      res.status(403).json({ ok: false, error: 'Path not authorized' });
      return;
    }
    try { res.json(statAbs(p)); }
    catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
  });

  return router;
}
