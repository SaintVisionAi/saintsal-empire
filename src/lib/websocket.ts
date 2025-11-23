import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from './auth';
import { generateResponse } from './llm';
import { db } from './db';
import { conversations } from '@/db/schema';
import { hacpGate } from './auth';

interface ClientConnection {
  ws: WebSocket;
  userId: number;
  role: string;
}

let wss: WebSocketServer | null = null;
const clients = new Map<string, ClientConnection>();

export function initializeWebSocketServer(server: HTTPServer) {
  wss = new WebSocketServer({ 
    server,
    path: '/ws',
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || '';

    // Verify token
    const verified = verifyToken(token);
    if (!verified) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    const clientId = `${verified.userId}-${Date.now()}`;
    clients.set(clientId, {
      ws,
      userId: verified.userId,
      role: verified.role,
    });

    console.log(`WebSocket client connected: ${clientId}`);

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat') {
          await handleChatMessage(clientId, message);
        } else if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format',
        }));
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(clientId);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to SaintSal™ WebSocket',
      userId: verified.userId,
    }));
  });

  // Heartbeat to keep connections alive
  setInterval(() => {
    wss?.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  return wss;
}

async function handleChatMessage(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client) return;

  const { prompt, useRAG = true } = message;

  if (!prompt) {
    client.ws.send(JSON.stringify({
      type: 'error',
      error: 'Prompt required',
    }));
    return;
  }

  try {
    // HACP Gate check
    const gate = await hacpGate(prompt, client.role);
    if (!gate.pass) {
      client.ws.send(JSON.stringify({
        type: 'error',
        error: gate.error,
      }));
      return;
    }

    // Send start message
    client.ws.send(JSON.stringify({
      type: 'start',
      model: 'claude-3-5-sonnet',
    }));

    let fullResponse = '';

    // Generate streaming response
    await generateResponse(
      prompt,
      client.userId,
      useRAG,
      (chunk) => {
        if (chunk.text) {
          fullResponse += chunk.text;
          client.ws.send(JSON.stringify({
            type: 'chunk',
            text: chunk.text,
            done: chunk.done,
            model: chunk.model,
          }));
        }
      }
    );

    // Save conversation
    try {
      await db.insert(conversations).values({
        userId: client.userId,
        prompt,
        response: fullResponse,
        model: 'claude-3-5-sonnet',
        hacpScore: gate.score || 0.85,
      });
    } catch (dbError) {
      console.error('Failed to save conversation:', dbError);
    }

    // Send completion
    client.ws.send(JSON.stringify({
      type: 'done',
      model: 'claude-3-5-sonnet',
      hacpCompliant: true,
    }));
  } catch (error: any) {
    console.error('Chat generation error:', error);
    client.ws.send(JSON.stringify({
      type: 'error',
      error: error.message || 'Generation failed',
    }));
  }
}

export function broadcastMessage(message: any, userId?: number) {
  const data = JSON.stringify(message);
  clients.forEach((client, clientId) => {
    if (!userId || client.userId === userId) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(data);
        } catch (error) {
          console.error('WebSocket send error:', error);
        }
      }
    }
  });
}

export function sendToUser(userId: number, message: any) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(data);
      } catch (error) {
        console.error('WebSocket send error:', error);
      }
    }
  });
}

export function getConnectedClients(): number {
  return clients.size;
}

