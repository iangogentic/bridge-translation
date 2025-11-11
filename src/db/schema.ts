/**
 * Bridge Database Schema
 *
 * Tables:
 * - user, session, account, verification: Better Auth authentication tables
 * - users: User accounts with email authentication (legacy - to be migrated)
 * - families: Family groups for collaboration
 * - family_members: Junction table for family membership
 * - documents: Uploaded documents (PDF/images)
 * - results: Translation and summary results
 * - shares: Time-boxed share links
 */

import { pgTable, text, timestamp, uuid, integer, jsonb, boolean, varchar, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Better Auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),

  // Stripe Integration Fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"), // active, canceled, past_due, trialing, incomplete
  subscriptionPlan: text("subscription_plan"), // starter, pro, enterprise
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  trialEndsAt: timestamp("trial_ends_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Families table
export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Family members table (junction table)
export const familyMembers = pgTable('family_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull().default('helper'), // 'owner' | 'helper'
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
  revokedAt: timestamp('revoked_at'),
}, (table) => ({
  uniqueMembership: uniqueIndex('unique_family_member').on(table.familyId, table.userId),
}));

// Documents table
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'set null' }),
  blobUrl: text('blob_url').notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(), // bytes
  pageCount: integer('page_count'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Results table (translation + summary)
export const results = pgTable('results', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }).unique(),
  translationHtml: text('translation_html').notNull(),
  summaryJson: jsonb('summary_json').notNull().$type<{
    purpose: string;
    actions: string[];
    due_dates?: string[];
    costs?: string[];
  }>(),
  detectedLanguage: varchar('detected_language', { length: 10 }).notNull(),
  targetLanguage: varchar('target_language', { length: 10 }).notNull().default('en'),
  domain: varchar('domain', { length: 50 }), // 'school' | 'healthcare' | 'legal' | 'government'
  confidence: integer('confidence'), // 0-100
  processingTimeMs: integer('processing_time_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Shares table (time-boxed share links)
export const shares = pgTable('shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  canDownload: boolean('can_download').default(true).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  lastViewedAt: timestamp('last_viewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tokenIndex: uniqueIndex('share_token_idx').on(table.token),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedFamilies: many(families),
  familyMemberships: many(familyMembers),
  documents: many(documents),
  shares: many(shares),
}));

export const familiesRelations = relations(families, ({ one, many }) => ({
  owner: one(users, {
    fields: [families.ownerId],
    references: [users.id],
  }),
  members: many(familyMembers),
  documents: many(documents),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  family: one(families, {
    fields: [familyMembers.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  owner: one(users, {
    fields: [documents.ownerId],
    references: [users.id],
  }),
  family: one(families, {
    fields: [documents.familyId],
    references: [families.id],
  }),
  result: one(results),
  shares: one(shares),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  document: one(documents, {
    fields: [results.documentId],
    references: [documents.id],
  }),
}));

export const sharesRelations = relations(shares, ({ one }) => ({
  document: one(documents, {
    fields: [shares.documentId],
    references: [documents.id],
  }),
  creator: one(users, {
    fields: [shares.createdBy],
    references: [users.id],
  }),
}));

// Type exports for use in the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type NewFamilyMember = typeof familyMembers.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Result = typeof results.$inferSelect;
export type NewResult = typeof results.$inferInsert;

export type Share = typeof shares.$inferSelect;
export type NewShare = typeof shares.$inferInsert;
