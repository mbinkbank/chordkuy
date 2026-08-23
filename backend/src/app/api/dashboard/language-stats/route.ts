import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const stats = await db
      .select({
        language: tbChord.language,
        count: sql<number>`count(*)::int`,
      })
      .from(tbChord)
      .groupBy(tbChord.language)
      .orderBy(sql`count(*) DESC`);

    const formatted = stats.map((s) => ({
      language: s.language || "Tidak Diketahui",
      count: Number(s.count),
    }));

    return successResponse(formatted, "Berhasil");
  } catch (error) {
    console.error("GET /api/dashboard/language-stats error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
