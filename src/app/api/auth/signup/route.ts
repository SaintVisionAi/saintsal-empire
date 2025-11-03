import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'User exists' }, { status: 409 });
    }

    const user = await createUser(name, email, password);
    const token = generateToken(user.id, user.email);

    return NextResponse.json({ success: true, token, user: { id: user.id, name, email, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
