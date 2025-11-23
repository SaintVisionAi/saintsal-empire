// WebSocket API route handler for Next.js
// Note: For production, use a separate WebSocket server or upgrade handler
export async function GET(request: Request) {
  return new Response('WebSocket endpoint - use ws:// protocol', {
    status: 426,
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
    },
  });
}

