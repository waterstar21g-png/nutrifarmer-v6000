import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const v5000Users = pgTable('v5000_users', {
  id: serial('id').primaryKey(),
  loginId: varchar('login_id', { length: 64 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 20 }).notNull().default('author'),
  mustResetPassword: boolean('must_reset_password').notNull().default(false),
  migrationSource: varchar('migration_source', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const v5000PasswordResets = pgTable('v5000_password_resets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => v5000Users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  codeHash: varchar('code_hash', { length: 64 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type V5000User = typeof v5000Users.$inferSelect;
export type NewV5000User = typeof v5000Users.$inferInsert;
