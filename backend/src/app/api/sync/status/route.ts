import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const [lastSync] = await db
      .select({ lastmod: tbChord.lastmod })
      .from(tbChord)
      .orderBy(sql`lastmod DESC`)
      .limit(1);

    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tbChord);

    return successResponse(
      {
        last_sync: lastSync?.lastmod || null,
        total_songs: Number(total?.count ?? 0),
        status: lastSync ? "ok" : "empty",
      },
      "Berhasil"
    );
  } catch (error) {
    console.error("Sync status error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
