import { NextRequest } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-migrate-token") || "";
    if (!process.env.MIGRATE_TOKEN || token !== process.env.MIGRATE_TOKEN) {
      return errorResponse("Unauthorized", 401);
    }

    await db.execute(sql`ALTER TABLE chords ADD COLUMN IF NOT EXISTS views bigint DEFAULT 0 NOT NULL`);
    await db.execute(sql`ALTER TABLE chords ADD COLUMN IF NOT EXISTS views_7d bigint DEFAULT 0 NOT NULL`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chords_views_7d ON chords (views_7d DESC, views DESC)`);
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION increment_view(song_slug text)
      RETURNS void AS $$
      BEGIN
        UPDATE chords
        SET views = COALESCE(views, 0) + 1,
            views_7d = COALESCE(views_7d, 0) + 1
        WHERE slug = song_slug;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `);
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION reset_views_7d()
      RETURNS void AS $$
      BEGIN
        UPDATE chords SET views_7d = 0;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `);

    return successResponse({ ok: true }, "Views migration applied");
  } catch (error) {
    return errorResponse(String(error), 500);
  }
}
