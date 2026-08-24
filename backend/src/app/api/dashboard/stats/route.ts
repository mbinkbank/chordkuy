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

    const [newThisMonth] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tbChord)
      .where(sql`lastmod LIKE ${currentMonth + "%"}`);

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
        total_albums: 0,
        new_this_month: Number(newThisMonth?.count ?? 0),
        last_updated: lastUpdated[0] || null,
      },
      "Berhasil"
    );
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
