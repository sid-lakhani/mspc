/**
 * Git routes — repository operations.
 *
 * All routes require a `cwd` query/body param pointing to a server-side repo.
 * Path safety is enforced by src/main/fs.ts isPathSafe — the server owns the
 * filesystem and never trusts browser-supplied paths without validation.
 *
 * GET  /api/git/is-repo?cwd=...
 * GET  /api/git/main-repo?cwd=...
 * GET  /api/git/branch?cwd=...
 * GET  /api/git/status?cwd=...
 * GET  /api/git/log?cwd=...&n=...
 * GET  /api/git/branches?cwd=...
 * GET  /api/git/ahead-behind?cwd=...
 * GET  /api/git/diff?cwd=...&relPath=...
 * GET  /api/git/log-graph?cwd=...&n=...&skip=...
 * GET  /api/git/commit-files?cwd=...&sha=...
 * GET  /api/git/show-file?cwd=...&rev=...&relPath=...
 * GET  /api/git/compare-refs?cwd=...&base=...&head=...&mode=...
 * GET  /api/git/worktrees?cwd=...
 * POST /api/git/checkout      { cwd, ref, detach }
 */

import { Router, type Request, type Response } from 'express';
import {
  getBranch, getStatus, getLog, getBranches, getAheadBehind, isRepo, getDiff,
  mainRepoRoot, getLogGraph, getCommitFiles, getFileAtRev, compareRefs,
  listWorktrees, checkoutRef
} from '../../main/git';

function q(req: Request, key: string): string {
  return (req.query[key] as string) ?? '';
}

function safeRun<T>(res: Response, fn: () => T | Promise<T>): void {
  Promise.resolve()
    .then(() => fn())
    .then((result) => res.json(result))
    .catch((e: unknown) => res.status(500).json({ ok: false, error: String(e) }));
}

export function createGitRouter(): Router {
  const router = Router();

  router.get('/is-repo', (req, res) => safeRun(res, () => isRepo(q(req, 'cwd'))));
  router.get('/main-repo', (req, res) => safeRun(res, () => mainRepoRoot(q(req, 'cwd'))));
  router.get('/branch', (req, res) => safeRun(res, () => getBranch(q(req, 'cwd'))));
  router.get('/status', (req, res) => safeRun(res, () => getStatus(q(req, 'cwd'))));
  router.get('/log', (req, res) => safeRun(res, () => getLog(q(req, 'cwd'), parseInt(q(req, 'n') || '50', 10))));
  router.get('/branches', (req, res) => safeRun(res, () => getBranches(q(req, 'cwd'))));
  router.get('/ahead-behind', (req, res) => safeRun(res, () => getAheadBehind(q(req, 'cwd'))));
  router.get('/diff', (req, res) => safeRun(res, () => getDiff(q(req, 'cwd'), q(req, 'relPath'))));
  router.get('/log-graph', (req, res) =>
    safeRun(res, () => getLogGraph(q(req, 'cwd'), parseInt(q(req, 'n') || '50', 10), parseInt(q(req, 'skip') || '0', 10))));
  router.get('/commit-files', (req, res) => safeRun(res, () => getCommitFiles(q(req, 'cwd'), q(req, 'sha'))));
  router.get('/show-file', (req, res) => safeRun(res, () => getFileAtRev(q(req, 'cwd'), q(req, 'rev'), q(req, 'relPath'))));
  router.get('/compare-refs', (req, res) =>
    safeRun(res, () => compareRefs(q(req, 'cwd'), q(req, 'base'), q(req, 'head'), q(req, 'mode') as 'two' | 'three')));
  router.get('/worktrees', (req, res) => safeRun(res, () => listWorktrees(q(req, 'cwd'))));

  router.post('/checkout', (req, res) => {
    const { cwd, ref, detach } = req.body as { cwd?: string; ref?: string; detach?: boolean };
    if (!cwd || !ref) { res.status(400).json({ ok: false, error: 'cwd and ref required' }); return; }
    safeRun(res, () => checkoutRef(cwd, ref, !!detach));
  });

  return router;
}
