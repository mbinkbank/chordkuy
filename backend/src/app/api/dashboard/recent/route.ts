import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const recent = await db
      .select({
        judul: tbChord.judul,
        penyanyi: tbChord.penyanyi,
        album: tbChord.album,
        base_key: tbChord.base_key,
        language: tbChord.language,
        songtype: tbChord.songtype,
        youtube_url: tbChord.youtube_url,
        lastmod: tbChord.lastmod,
      })
      .from(tbChord)
      .orderBy(sql`lastmod DESC`)
      .limit(10);

    return successResponse(recent, "Berhasil");
  } catch (error) {
    console.error("GET /api/dashboard/recent error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
