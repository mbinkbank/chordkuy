import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { errorResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const songs = await db.select().from(tbChord).orderBy(tbChord.judul);

    const headers = [
      "judul", "penyanyi", "base_key", "album", "album_image",
      "lastmod", "isi_chord", "language", "youtube_url",
      "songwriter", "year", "songtype",
    ];

    const rows = [
      headers.join(","),
      ...songs.map((s) =>
        headers
          .map((h) => `"${String((s as Record<string, unknown>)[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];

    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="chordku-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export CSV error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
