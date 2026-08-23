import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { format } from "date-fns";

interface SongData {
  judul?: string;
  penyanyi?: string;
  base_key?: string;
  album?: string;
  album_image?: string;
  isi_chord?: string;
  language?: string;
  youtube_url?: string;
  songwriter?: string;
  year?: string;
  songtype?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    if (!authUser) return errorResponse("Tidak terautentikasi", 401);

    const contentType = request.headers.get("content-type") || "";
    let songs: SongData[] = [];

    if (contentType.includes("application/json")) {
      const body = await request.json();
      songs = Array.isArray(body) ? body : body.songs || [];
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) return errorResponse("File tidak ditemukan", 400);

      const text = await file.text();
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "json") {
        const parsed = JSON.parse(text);
        songs = Array.isArray(parsed) ? parsed : parsed.songs || [];
      } else if (ext === "csv") {
        const lines = text.split("\n").filter(Boolean);
        if (lines.length < 2) return errorResponse("File CSV kosong", 400);
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
        songs = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const obj: SongData = {};
          headers.forEach((h, i) => {
            (obj as Record<string, string>)[h] = values[i] || "";
          });
          return obj;
        });
      } else {
        return errorResponse("Format file tidak didukung (JSON atau CSV)", 400);
      }
    } else {
      return errorResponse("Content-Type tidak valid", 400);
    }

    if (!Array.isArray(songs) || songs.length === 0) {
      return errorResponse("Data kosong", 400);
    }

    const lastmod = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const song of songs) {
      const { judul, penyanyi } = song;
      if (!judul || !penyanyi) {
        errors.push(`Baris tanpa judul/penyanyi dilewati`);
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
        errors.push(`Error "${judul}": ${e}`);
      }
    }

    return successResponse(
      { inserted, updated, errors },
      `Import selesai: ${inserted} ditambahkan, ${updated} diperbarui`
    );
  } catch (error) {
    console.error("POST /api/songs/import error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
