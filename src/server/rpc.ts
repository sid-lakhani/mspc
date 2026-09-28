import { Router, type Request, type Response } from 'express';
import { broadcastWs } from './ws/handlers';

const handlers = new Map<string, (...args: any[]) => Promise<any> | any>();

export function handle(channel: string, fn: (...args: any[]) => Promise<any> | any) {
  handlers.set(channel, fn);
}

export function emit(channel: string, ...args: any[]) {
  broadcastWs({ type: 'backend:event', channel, args });
}

export function createRpcRouter(): Router {
  const router = Router();
  router.post('/*', async (req: Request, res: Response) => {
    // Convert /pty/spawn to pty:spawn
    const path = req.params[0];
    const channel = path.replace(/\//g, ':');
    const fn = handlers.get(channel);
    
    if (!fn) {
      console.error(`[RPC] No handler for ${channel}`);
      res.status(404).json({ ok: false, error: `No handler for RPC channel ${channel}` });
      return;
    }
    
    try {
      const args = req.body.args || [];
      const result = await fn(...args);
      res.json(result);
    } catch (err) {
      console.error(`[RPC] Error in ${channel}:`, err);
      res.status(500).json({ ok: false, error: String(err) });
    }
  });
  return router;
}
