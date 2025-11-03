import { NextRequest, NextResponse } from 'next/server';
import { createProxyMiddleware } from 'http-proxy-middleware';

export async function POST(request: NextRequest) {
  const proxy = createProxyMiddleware({
    target: 'http://localhost:4000',
    changeOrigin: true,
  });

  return new Promise((resolve) => {
    proxy(request.req, request.res, (err) => {
      if (err) {
        resolve(NextResponse.json({ error: 'Proxy error' }, { status: 500 }));
      }
    });
  });
}
