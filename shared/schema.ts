import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const organs = pgTable("organs", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

export const hymns = pgTable("hymns", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  url: text("url").notNull(),
  organKey: text("organ_key").notNull(),
  orderIndex: integer("order_index").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertOrganSchema = createInsertSchema(organs).omit({
  id: true,
});

export const insertHymnSchema = createInsertSchema(hymns).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrgan = z.infer<typeof insertOrganSchema>;
export type Organ = typeof organs.$inferSelect;
export type InsertHymn = z.infer<typeof insertHymnSchema>;
export type Hymn = typeof hymns.$inferSelect;

// Frontend-only types for JSON data
export type HymnData = {
  titulo: string;
  url: string;
};

// Firebase types
export type FirebaseHymnData = {
  numero: number;
  titulo: string;
  orgao: string;
  audioUrl: string;
  criadoEm: Date;
};

export type OrganData = {
  key: string;
  name: string;
  description: string;
  icon: string;
};
