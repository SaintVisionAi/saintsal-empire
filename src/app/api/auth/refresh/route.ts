import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateToken } from '@/lib/auth';
import { getUserByEmail } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || '';
    const verified = verifyToken(token);

    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get fresh user data
    const [user] = await db.select().from(users).where(eq(users.id, verified.userId)).limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate new token
    const newToken = generateToken(user);

    // Log refresh event
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Trigger auth monitor alert
    const { authMonitor } = await import('@/lib/auth-monitor');
    await authMonitor.triggerAlert({
      type: 'session_refreshed',
      userId: user.id,
      message: 'Session refreshed successfully',
      severity: 'info',
      timestamp: new Date(),
      ip,
    });

    return NextResponse.json({
      success: true,
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
  }
}

