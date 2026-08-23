import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { errorResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const songs = await db.select().from(tbChord).orderBy(tbChord.judul);
    return new NextResponse(JSON.stringify(songs, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="chordku-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("Export JSON error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
