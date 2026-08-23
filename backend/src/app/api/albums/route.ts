import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const albums = await db
      .select({
        album: tbChord.album,
        album_image: tbChord.album_image,
        penyanyi: tbChord.penyanyi,
        song_count: sql<number>`count(*)::int`,
      })
      .from(tbChord)
      .groupBy(tbChord.album, tbChord.album_image, tbChord.penyanyi)
      .orderBy(tbChord.album);

    // Aggregate by album name
    const albumMap = new Map<
      string,
      { album: string; album_image: string; artists: string[]; song_count: number }
    >();

    for (const row of albums) {
      const name = row.album || "(Tanpa Album)";
      if (!albumMap.has(name)) {
        albumMap.set(name, {
          album: name,
          album_image: row.album_image || "",
          artists: [],
          song_count: 0,
        });
      }
      const entry = albumMap.get(name)!;
      entry.song_count += Number(row.song_count);
      if (row.penyanyi && !entry.artists.includes(row.penyanyi)) {
        entry.artists.push(row.penyanyi);
      }
      if (!entry.album_image && row.album_image) {
        entry.album_image = row.album_image;
      }
    }

    return successResponse(Array.from(albumMap.values()), "Berhasil");
  } catch (error) {
    console.error("GET /api/albums error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
