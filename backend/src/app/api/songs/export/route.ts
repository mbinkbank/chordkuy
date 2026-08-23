import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const songs = await db.select().from(tbChord).orderBy(tbChord.judul);

    if (format === "csv") {
      const headers = [
        "judul",
        "penyanyi",
        "base_key",
        "album",
        "album_image",
        "lastmod",
        "isi_chord",
        "language",
        "youtube_url",
        "songwriter",
        "year",
        "songtype",
      ];

      const csvRows = [
        headers.join(","),
        ...songs.map((s) =>
          headers
            .map((h) => `"${(String((s as Record<string, unknown>)[h] || "")).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ];

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="chordku-export-${Date.now()}.csv"`,
        },
      });
    }

    return new NextResponse(JSON.stringify(songs, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="chordku-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("GET /api/songs/export error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
