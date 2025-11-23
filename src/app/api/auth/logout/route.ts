import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { authMonitor } from '@/lib/auth-monitor';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || '';
    const verified = verifyToken(token);

    if (verified) {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      
      // Stop monitoring and log logout
      await authMonitor.logLogout(verified.userId, ip);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      success: true,
      message: 'Logged out'
    });
  }
}

