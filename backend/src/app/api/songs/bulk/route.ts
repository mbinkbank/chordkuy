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
    const { songs } = body;

    if (!Array.isArray(songs) || songs.length === 0) {
      return errorResponse("Data lagu tidak boleh kosong", 400);
    }

    const lastmod = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const song of songs) {
      const { judul, penyanyi } = song;
      if (!judul || !penyanyi) {
        errors.push(`Lagu tanpa judul/penyanyi dilewati`);
        continue;
      }

      try {
        const existing = await db
          .select({ judul: tbChord.judul })
          .from(tbChord)
          .where(and(eq(tbChord.judul, judul), eq(tbChord.penyanyi, penyanyi)))
          .limit(1);

        const values = {
          judul,
          penyanyi,
          base_key: song.base_key || "",
          album: song.album || "",
          album_image: song.album_image || "",
          lastmod,
          isi_chord: song.isi_chord || "",
          language: song.language || "",
          youtube_url: song.youtube_url || "",
          songwriter: song.songwriter || "",
          year: song.year || "",
          songtype: song.songtype || "",
        };

        if (existing.length > 0) {
          await db
            .update(tbChord)
            .set(values)
            .where(and(eq(tbChord.judul, judul), eq(tbChord.penyanyi, penyanyi)));
          updated++;
        } else {
          await db.insert(tbChord).values(values);
          inserted++;
        }
      } catch (e) {
        errors.push(`Error saat proses "${judul}": ${e}`);
      }
    }

    return successResponse(
      { inserted, updated, errors },
      `Berhasil: ${inserted} ditambahkan, ${updated} diperbarui`
    );
  } catch (error) {
    console.error("POST /api/songs/bulk error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
