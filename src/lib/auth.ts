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
    queryLimit: role === 'free' ? 10 : role === 'starter' ? 100 : 999999 
  }).returning();
  return newUser;
}

export async function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
}

export function generateToken(user: any) {
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET not set. Using default (INSECURE - only for development)');
    console.warn('   Please set JWT_SECRET in your .env file');
  }
  const secret = process.env.JWT_SECRET || 'default-insecure-secret-change-in-production';
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    secret,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET || 'default-insecure-secret-change-in-production';
    return jwt.verify(token, secret) as any;
  } catch {
    return null;
  }
}

export async function hacpGate(prompt: string, userRole: string) {
  // Placeholder – replace with Azure Language API
  const empathy = Math.random();
  if (empathy < 0.7 && userRole === 'free') {
    return { pass: false, error: 'HACP™: Low empathy. Upgrade to Pro.' };
  }
  return { pass: true, score: empathy };
}
