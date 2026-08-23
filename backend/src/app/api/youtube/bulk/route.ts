import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    if (!authUser) return errorResponse("Tidak terautentikasi", 401);

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse("items wajib diisi sebagai array", 400);
    }

    const lastmod = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    let updated = 0;
    let notFound = 0;
    const errors: string[] = [];

    for (const item of items) {
      const { judul, penyanyi, youtube_url } = item;
      if (!judul || !penyanyi || youtube_url === undefined) {
        errors.push(`Item tidak lengkap: ${JSON.stringify(item)}`);
        continue;
      }

      try {
        const result = await db
          .update(tbChord)
          .set({ youtube_url, lastmod })
          .where(and(eq(tbChord.judul, judul), eq(tbChord.penyanyi, penyanyi)))
          .returning({ judul: tbChord.judul });

        if (result.length > 0) {
          updated++;
        } else {
          notFound++;
        }
      } catch (e) {
        errors.push(`Error "${judul}": ${e}`);
      }
    }

    return successResponse(
      { updated, notFound, errors },
      `${updated} YouTube URL berhasil diperbarui`
    );
  } catch (error) {
    console.error("POST /api/youtube/bulk error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
