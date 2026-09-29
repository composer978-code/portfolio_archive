import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the built-in Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Existing private text notes; kept intact for backward compatibility. */
export const journalEntries = mysqlTable("journal_entries", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Existing object-storage metadata; kept intact for backward compatibility. */
export const archiveFiles = mysqlTable("archive_files", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 160 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull().unique(),
  fileSize: int("fileSize").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const archiveItems = mysqlTable("archive_items", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["video", "image", "file", "note"]).notNull(),
  platform: mysqlEnum("platform", ["youtube", "instagram"]),
  title: varchar("title", { length: 200 }).notNull(),
  summary: varchar("summary", { length: 1000 }).notNull().default(""),
  body: text("body"),
  tags: varchar("tags", { length: 500 }).notNull().default(""),
  sourceUrl: varchar("sourceUrl", { length: 2048 }),
  fileName: varchar("fileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 160 }),
  storageKey: varchar("storageKey", { length: 512 }),
  coverKey: varchar("coverKey", { length: 512 }),
  fileSize: int("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ArchiveItem = typeof archiveItems.$inferSelect;
export type InsertArchiveItem = typeof archiveItems.$inferInsert;
