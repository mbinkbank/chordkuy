import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";

export const tbChord = pgTable(
  "tb_chord",
  {
    judul: text("judul").notNull(),
    penyanyi: text("penyanyi").notNull(),
    base_key: text("base_key").default("").notNull(),
    album: text("album").default("").notNull(),
    album_image: text("album_image").default("").notNull(),
    lastmod: text("lastmod").default("").notNull(),
    isi_chord: text("isi_chord").default("").notNull(),
    language: text("language").default("").notNull(),
    youtube_url: text("youtube_url").default("").notNull(),
    songwriter: text("songwriter").default("").notNull(),
    year: text("year").default("").notNull(),
    songtype: text("songtype").default("").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.judul, table.penyanyi] }),
  })
);

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
