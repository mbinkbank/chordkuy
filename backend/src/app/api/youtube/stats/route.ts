import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { eq, ne, or, isNull, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const [withYoutube] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tbChord)
      .where(
        ne(tbChord.youtube_url, "")
      );

    const [withoutYoutube] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tbChord)
      .where(eq(tbChord.youtube_url, ""));

    const withoutList = await db
      .select({
        judul: tbChord.judul,
        penyanyi: tbChord.penyanyi,
        album: tbChord.album,
        language: tbChord.language,
      })
      .from(tbChord)
      .where(eq(tbChord.youtube_url, ""))
      .orderBy(tbChord.judul)
      .limit(100);

    return successResponse(
      {
        with_youtube: Number(withYoutube?.count ?? 0),
        without_youtube: Number(withoutYoutube?.count ?? 0),
        without_list: withoutList,
      },
      "Berhasil"
    );
  } catch (error) {
    console.error("GET /api/youtube/stats error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
