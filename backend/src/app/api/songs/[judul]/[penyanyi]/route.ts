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
      .select()
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
    console.error("GET /api/songs/[judul]/[penyanyi] error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const authUser = await requireAuth(request);
    if (!authUser) return errorResponse("Tidak terautentikasi", 401);

    const { judul, penyanyi } = await params;
    const body = await request.json();

    const old = await db
      .select()
      .from(tbChord)
      .where(
        and(
          eq(tbChord.judul, decodeParam(judul)),
          eq(tbChord.penyanyi, decodeParam(penyanyi))
        )
      )
      .limit(1);

    if (old.length === 0) return errorResponse("Lagu tidak ditemukan", 404);

    const newJudul = (body.judul || decodeParam(judul)).trim();
    const newPenyanyi = (body.penyanyi || decodeParam(penyanyi)).trim();
    const isRenamed = newJudul !== decodeParam(judul) || newPenyanyi !== decodeParam(penyanyi);

    if (isRenamed) {
      const dupCheck = await db
        .select({ judul: tbChord.judul })
        .from(tbChord)
        .where(and(eq(tbChord.judul, newJudul), eq(tbChord.penyanyi, newPenyanyi)))
        .limit(1);
      if (dupCheck.length > 0) {
        return errorResponse(`Lagu "${newJudul}" oleh "${newPenyanyi}" sudah ada`, 409);
      }
    }

    const lastmod = format(new Date(), "yyyy-MM-dd HH:mm:ss");

    if (isRenamed) {
      await db.delete(tbChord).where(
        and(eq(tbChord.judul, decodeParam(judul)), eq(tbChord.penyanyi, decodeParam(penyanyi)))
      );
      const [created] = await db.insert(tbChord).values({
        judul: newJudul,
        penyanyi: newPenyanyi,
        base_key: body.base_key ?? old[0].base_key,
        album: body.album ?? old[0].album,
        album_image: body.album_image ?? old[0].album_image,
        lastmod,
        isi_chord: body.isi_chord ?? old[0].isi_chord,
        language: body.language ?? old[0].language,
        youtube_url: body.youtube_url ?? old[0].youtube_url,
        songwriter: body.songwriter ?? old[0].songwriter,
        year: body.year ?? old[0].year,
        songtype: body.songtype ?? old[0].songtype,
      }).returning();
      return successResponse(created, "Lagu berhasil diperbarui");
    }

    const updateData: Partial<typeof tbChord.$inferInsert> = { lastmod };

    const fields = [
      "base_key", "album", "album_image", "isi_chord",
      "language", "youtube_url", "songwriter", "year", "songtype",
    ] as const;

    for (const field of fields) {
      if (field in body) {
        (updateData as Record<string, unknown>)[field] = body[field];
      }
    }

    const [updated] = await db
      .update(tbChord)
      .set(updateData)
      .where(
        and(
          eq(tbChord.judul, decodeParam(judul)),
          eq(tbChord.penyanyi, decodeParam(penyanyi))
        )
      )
      .returning();

    return successResponse(updated, "Lagu berhasil diperbarui");
  } catch (error) {
    console.error("PUT /api/songs/[judul]/[penyanyi] error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const authUser = await requireAuth(request);
    if (!authUser) return errorResponse("Tidak terautentikasi", 401);

    const { judul, penyanyi } = await params;

    const existing = await db
      .select()
      .from(tbChord)
      .where(
        and(
          eq(tbChord.judul, decodeParam(judul)),
          eq(tbChord.penyanyi, decodeParam(penyanyi))
        )
      )
      .limit(1);

    if (existing.length === 0) return errorResponse("Lagu tidak ditemukan", 404);

    await db
      .delete(tbChord)
      .where(
        and(
          eq(tbChord.judul, decodeParam(judul)),
          eq(tbChord.penyanyi, decodeParam(penyanyi))
        )
      );

    return successResponse(null, "Lagu berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/songs/[judul]/[penyanyi] error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
