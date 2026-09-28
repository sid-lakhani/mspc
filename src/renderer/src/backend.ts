export async function callBackend(channel: string, ...args: any[]): Promise<any> {
  // Convert channel like 'pty:spawn' to '/api/pty/spawn'
  const path = channel.replace(/:/g, '/');
  const res = await fetch(`/api/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args })
  });
  if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);
  return res.json();
}

export function callBackendSync(channel: string, ...args: any[]): any {
  // Synchronous fetch is not supported in browsers natively without blocking workers or XHR.
  // Stub for now.
  return null;
}

const wsUrl = typeof location !== 'undefined' ? (location.protocol === 'https:' ? `wss://${location.host}/ws` : `ws://${location.host}/ws`) : 'ws://localhost/ws';
let ws: WebSocket | null = null;
const listeners = new Map<string, Set<(event: any, ...args: any[]) => void>>();

function getWs() {
  if (typeof WebSocket === 'undefined') return null;
  if (!ws) {
    ws = new WebSocket(wsUrl);
    ws.onmessage = (e) => {
      try {
        const { channel, args } = JSON.parse(e.data);
        const chanListeners = listeners.get(channel);
        if (chanListeners) {
          for (const listener of chanListeners) {
            listener(null, ...args);
          }
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };
    ws.onclose = () => { ws = null; setTimeout(getWs, 1000); };
  }
  return ws;
}

if (typeof window !== 'undefined') {
  getWs();
}

export function subscribeBackend(channel: string, listener: (event: any, ...args: any[]) => void): void {
  if (!listeners.has(channel)) listeners.set(channel, new Set());
  listeners.get(channel)!.add(listener);
}

export function unsubscribeBackend(channel: string, listener: (event: any, ...args: any[]) => void): void {
  const chanListeners = listeners.get(channel);
  if (chanListeners) {
    chanListeners.delete(listener);
  }
}
