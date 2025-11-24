import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@/db/schema';

// Check for database URL (support both DATABASE_URL and Saint_DATABASE_URL)
const databaseUrl = process.env.DATABASE_URL || process.env.Saint_DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️  DATABASE_URL not set. Database features will be limited.');
  console.warn('   Please set DATABASE_URL or Saint_DATABASE_URL in your .env file');
  console.warn('   Example: DATABASE_URL=postgresql://user:password@host:5432/database');
}

// Create database connection with fallback
let sql: any;
let db: any;

try {
  if (databaseUrl) {
    sql = neon(databaseUrl);
    db = drizzle(sql, { schema });
  } else {
    // Create a mock db for development when DATABASE_URL is not set
    console.warn('⚠️  Using mock database. Set DATABASE_URL for full functionality.');
    db = {
      select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
      insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
      update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
      delete: () => ({ where: () => Promise.resolve([]) }),
    };
  }
} catch (error) {
  console.error('❌ Database connection error:', error);
  console.error('   Please check your DATABASE_URL environment variable');
  // Fallback to mock db
  db = {
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
    delete: () => ({ where: () => Promise.resolve([]) }),
  };
}

export { db };
