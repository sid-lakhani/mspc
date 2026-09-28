/**
 * MSPC WebSocket handlers — real-time agent output, floor events, hive messages.
 *
 * The WebSocket server is mounted at /ws on the HTTP server.
 *
 * Message protocol (JSON):
 *
 *   Client → Server:
 *     { type: 'subscribe', channel: 'agent:output', agentId: string }
 *     { type: 'subscribe', channel: 'floor' }
 *     { type: 'subscribe', channel: 'hive' }
 *     { type: 'agent:write', agentId: string, data: string }
 *     { type: 'agent:resize', agentId: string, cols: number, rows: number }
 *     { type: 'ping' }
 *
 *   Server → Client:
 *     { type: 'agent:output', agentId: string, data: string }
 *     { type: 'floor:update', payload: unknown }
 *     { type: 'hive:event', payload: unknown }
 *     { type: 'pong' }
 *     { type: 'error', error: string }
 *
 * NOTE: Full PTY/floor wiring will be completed in the next phase.
 * This module handles the WebSocket lifecycle and message routing skeleton.
 */

import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

interface WsMessage {
  type: string;
  [key: string]: unknown;
}

/** All active WebSocket connections, keyed by a random id. */
const connections = new Map<string, WebSocket>();

/** Broadcast a message to all connected clients. */
export function broadcastWs(msg: WsMessage): void {
  const json = JSON.stringify(msg);
  for (const ws of connections.values()) {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(json);
    }
  }
}

/** Send a message to a specific connection. */
export function sendToWs(connectionId: string, msg: WsMessage): void {
  const ws = connections.get(connectionId);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(msg));
  }
}

export function setupWebSocketHandlers(ws: WebSocket, _req: IncomingMessage): void {
  const id = Math.random().toString(36).slice(2);
  connections.set(id, ws);

  ws.on('message', (raw) => {
    let msg: WsMessage;
    try {
      msg = JSON.parse(raw.toString()) as WsMessage;
    } catch {
      ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
      return;
    }

    switch (msg.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'subscribe':
        // TODO: register per-channel subscriptions and wire to PTY/hive event emitters
        ws.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }));
        break;

      case 'agent:write':
        // TODO: wire to PtyManager.write(agentId, data)
        ws.send(JSON.stringify({ type: 'error', error: 'agent:write not yet wired' }));
        break;

      case 'agent:resize':
        // TODO: wire to PtyManager.resize(agentId, cols, rows)
        ws.send(JSON.stringify({ type: 'error', error: 'agent:resize not yet wired' }));
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', error: `Unknown message type: ${msg.type}` }));
    }
  });

  ws.on('close', () => {
    connections.delete(id);
  });

  ws.on('error', (err) => {
    console.error(`[ws] Error on connection ${id}:`, err.message);
    connections.delete(id);
  });

  // Greet the client
  ws.send(JSON.stringify({ type: 'connected', connectionId: id }));
}
