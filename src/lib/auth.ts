import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string) {
  return bcrypt.compare(password, hashed);
}

export async function createUser(name: string, email: string, password: string, role = 'free') {
  const hashed = await hashPassword(password);
  const [newUser] = await db.insert(users).values({ 
    name, 
    email: email.toLowerCase(), 
    password: hashed, 
    role,
    queryLimit: role === 'free' ? 10 : 999999 
  }).returning();
  return newUser;
}

export async function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
}

export function generateToken(user: any) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

export async function hacpGate(prompt: string, userRole: string) {
  const empathy = Math.random(); // Replace with Azure Language
  if (empathy < 0.7 && userRole === 'free') {
    return { pass: false, error: 'HACP™: Low empathy. Upgrade to Pro.' };
  }
  return { pass: true, score: empathy };
}
