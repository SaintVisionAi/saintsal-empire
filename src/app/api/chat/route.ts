import { NextRequest, NextResponse } from 'next/server';
import { createProxyMiddleware } from 'http-proxy-middleware';

export async function POST(request: NextRequest) {
  const proxy = createProxyMiddleware({
    target: 'http://localhost:4000',
    changeOrigin: true,
  });

  return new Promise((resolve) => {
    const req = request.req;
    const res = request.res;

    proxy(req, res, (err) => {
      if (err) {
        resolve(NextResponse.json({ error: 'Proxy error' }, { status: 500 }));
      }
    });
  });
}
