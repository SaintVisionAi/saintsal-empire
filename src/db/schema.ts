import { pgTable, serial, text, timestamp, varchar, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['free', 'starter', 'pro', 'enterprise']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum('role').default('free').notNull(),
  queryLimit: integer('query_limit').default(10), // Free: 10/day
  createdAt: timestamp('created_at').defaultNow(),
});

export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  model: varchar('model', { length: 50 }).notNull(),
  hacpScore: float('hacp_score').notNull(), // 0-1 empathy
  timestamp: timestamp('timestamp').defaultNow(),
});

export const knowledge = pgTable('knowledge', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  embedding: text('embedding'), // Vector for RAG
  userId: integer('user_id').references(() => users.id),
  indexedAt: timestamp('indexed_at').defaultNow(),
});

export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  prompt: text('prompt').notNull(),
  taskType: varchar('task_type', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const logs = pgTable('logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  ip: varchar('ip', { length: 45 }),
  hacpCompliant: boolean('hacp_compliant').default(true),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  knowledge: many(knowledge),
  agents: many(agents),
  logs: many(logs),
}));
