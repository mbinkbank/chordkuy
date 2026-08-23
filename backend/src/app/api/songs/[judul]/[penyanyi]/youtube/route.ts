import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { format } from "date-fns";

type Params = { params: Promise<{ judul: string; penyanyi: string }> };

function decodeParam(p: string) {
  return decodeURIComponent(p);
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { judul, penyanyi } = await params;
    const [song] = await db
      .select({ youtube_url: tbChord.youtube_url, judul: tbChord.judul, penyanyi: tbChord.penyanyi })
      .from(tbChord)
      .where(
        and(
          eq(tbChord.judul, decodeParam(judul)),
          eq(tbChord.penyanyi, decodeParam(penyanyi))
        )
      )
      .limit(1);

    if (!song) return errorResponse("Lagu tidak ditemukan", 404);
    return successResponse(song, "Berhasil");
  } catch (error) {
    console.error("GET youtube error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const authUser = await requireAuth(request);
    if (!authUser) return errorResponse("Tidak terautentikasi", 401);

    const { judul, penyanyi } = await params;
    const body = await request.json();
    const { youtube_url } = body;

    if (youtube_url === undefined) {
      return errorResponse("youtube_url wajib diisi", 400);
    }

    const [updated] = await db
      .update(tbChord)
      .set({
        youtube_url,
        lastmod: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      })
      .where(
        and(
          eq(tbChord.judul, decodeParam(judul)),
          eq(tbChord.penyanyi, decodeParam(penyanyi))
        )
      )
      .returning();

    if (!updated) return errorResponse("Lagu tidak ditemukan", 404);
    return successResponse(updated, "YouTube URL berhasil diperbarui");
  } catch (error) {
    console.error("PUT youtube error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
