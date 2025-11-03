import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, hacpGate } from '@/lib/auth';

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

    const gate = await hacpGate('signup', 'free');
    if (!gate.pass) {
      return NextResponse.json({ error: gate.error }, { status: 403 });
    }

    const user = await createUser(name, email, password, 'free');
    const token = generateToken(user[0]);

    return NextResponse.json({ 
      success: true, 
      token, 
      user: { id: user[0].id, name, email, role: user[0].role },
      message: "HACP™ Active | Patent 10,290,222 | Free Limited Tier"
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
