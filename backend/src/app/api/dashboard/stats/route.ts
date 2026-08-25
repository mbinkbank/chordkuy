import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";
import { format } from "date-fns";

export async function GET(_request: NextRequest) {
  try {
    const currentMonth = format(new Date(), "yyyy-MM");

    const [totalSongs] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tbChord);

    const [totalArtists] = await db
      .select({ count: sql<number>`count(distinct artist)::int` })
      .from(tbChord);

    const [newThisMonth] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tbChord)
      .where(sql`lastmod LIKE ${currentMonth + "%"}`);

    const [withYoutube] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tbChord)
      .where(sql`youtube_url <> ''`);

    const [avgRating] = await db
      .select({ avg: sql<number>`coalesce(round(avg(rating)::numeric, 2), 0)::float` })
      .from(tbChord)
      .where(sql`rating is not null`);

    const difficultyRows = await db
      .select({ difficulty: tbChord.difficulty, count: sql<number>`count(*)::int` })
      .from(tbChord)
      .groupBy(tbChord.difficulty);

    const difficulty: Record<string, number> = { novice: 0, intermediate: 0, advanced: 0 };
    for (const row of difficultyRows) {
      difficulty[row.difficulty] = Number(row.count ?? 0);
    }

    const lastUpdated = await db
      .select({
        judul: tbChord.judul,
        penyanyi: tbChord.penyanyi,
        lastmod: tbChord.lastmod,
      })
      .from(tbChord)
      .orderBy(sql`lastmod DESC`)
      .limit(1);

    return successResponse(
      {
        total_songs: Number(totalSongs?.count ?? 0),
        total_artists: Number(totalArtists?.count ?? 0),
        new_this_month: Number(newThisMonth?.count ?? 0),
        with_youtube: Number(withYoutube?.count ?? 0),
        avg_rating: Number(avgRating?.avg ?? 0),
        difficulty,
        last_updated: lastUpdated[0] || null,
      },
      "Berhasil"
    );
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
