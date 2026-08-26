import { pgTable, text, timestamp, uuid, bigint, numeric } from "drizzle-orm/pg-core";

export const tbChord = pgTable("chords", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  judul: text("title").notNull(),
  penyanyi: text("artist").notNull(),
  base_key: text("key_name").default("").notNull(),
  isi_chord: text("content").default("").notNull(),
  tuning: text("tuning").default("E A D G B E").notNull(),
  capo: text("capo").default("").notNull(),
  difficulty: text("difficulty").default("intermediate").notNull(),
  rating: numeric("rating"),
  language: text("language").default("ID").notNull(),
  review_status: text("review_status").default("needs_review").notNull(),
  lastmod: text("lastmod").default("").notNull(),
  youtube_url: text("youtube_url").default("").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("editor"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type TbChord = typeof tbChord.$inferSelect;
export type NewTbChord = typeof tbChord.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
