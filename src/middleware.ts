import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, hacpGate } from '@/lib/auth';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 10, // Free tier limit
  duration: 60 * 60, // 1 hour
});

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyToken(token || '');

  if (!verified && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Rate limit for Free
  if (verified?.role === 'free') {
    try {
      await rateLimiter.consume(verified.userId.toString());
    } catch {
      return NextResponse.json({ error: 'Rate limited. Upgrade to Pro.' }, { status: 429 });
    }
  }

  // HACP™ Gate for chat paths
  if (request.nextUrl.pathname.startsWith('/api/chat')) {
    const body = await request.json();
    const gate = await hacpGate(body.prompt, verified?.role || 'free');
    if (!gate.pass) {
      return NextResponse.json({ error: gate.error }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/chat/:path*'],
};
