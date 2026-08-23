import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { format } from "date-fns";

type Params = { params: Promise<{ name: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { name } = await params;
    const albumName = decodeURIComponent(name);

    const songs = await db
      .select()
      .from(tbChord)
      .where(ilike(tbChord.album, albumName))
      .orderBy(tbChord.judul);

    const albumInfo = songs.length > 0 ? {
      album: songs[0].album,
      album_image: songs[0].album_image,
      song_count: songs.length,
      songs,
    } : { album: albumName, song_count: 0, songs: [] };

    return successResponse(albumInfo, "Berhasil");
  } catch (error) {
    console.error("GET /api/albums/[name] error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const authUser = await requireAuth(request);
    if (!authUser) return errorResponse("Tidak terautentikasi", 401);

    const { name } = await params;
    const albumName = decodeURIComponent(name);
    const body = await request.json();
    const { new_name, album_image } = body;

    const updateData: Partial<typeof tbChord.$inferInsert> = {
      lastmod: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    };

    if (new_name !== undefined) updateData.album = new_name;
    if (album_image !== undefined) updateData.album_image = album_image;

    await db
      .update(tbChord)
      .set(updateData)
      .where(ilike(tbChord.album, albumName));

    return successResponse(null, "Album berhasil diperbarui");
  } catch (error) {
    console.error("PUT /api/albums/[name] error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const authUser = await requireAuth(request);
    if (!authUser) return errorResponse("Tidak terautentikasi", 401);

    const { name } = await params;
    const albumName = decodeURIComponent(name);

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tbChord)
      .where(ilike(tbChord.album, albumName));

    const songCount = Number(result[0]?.count ?? 0);
    if (songCount === 0) return errorResponse("Album tidak ditemukan", 404);

    // Clear album field instead of deleting songs
    await db
      .update(tbChord)
      .set({ album: "", album_image: "" })
      .where(ilike(tbChord.album, albumName));

    return successResponse(
      { songs_affected: songCount },
      `Album dihapus, ${songCount} lagu dikosongkan albumnya`
    );
  } catch (error) {
    console.error("DELETE /api/albums/[name] error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
