import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { ilike } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

type Params = { params: Promise<{ name: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const authUser = await requireAuth(request);
    if (!authUser) return errorResponse("Tidak terautentikasi", 401);

    const { name } = await params;
    const albumName = decodeURIComponent(name);
    const body = await request.json();
    const { album_image } = body;

    if (!album_image) return errorResponse("album_image URL wajib diisi", 400);

    await db
      .update(tbChord)
      .set({ album_image })
      .where(ilike(tbChord.album, albumName));

    return successResponse({ album_image }, "Gambar album berhasil diperbarui");
  } catch (error) {
    console.error("PUT /api/albums/[name]/image error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
