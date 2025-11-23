import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const [user] = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken(user);

    // Start auth monitoring
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { authMonitor } = await import('@/lib/auth-monitor');
    authMonitor.startMonitoring(user.id, token, ip);

    // Trigger login alert
    await authMonitor.triggerAlert({
      type: 'login',
      userId: user.id,
      message: 'User logged in successfully',
      severity: 'info',
      timestamp: new Date(),
      ip,
    });

    return NextResponse.json({ 
      success: true, 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

