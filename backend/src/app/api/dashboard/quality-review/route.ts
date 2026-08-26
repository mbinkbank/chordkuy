import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { and, eq, or, ilike, asc } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";

// Verifikasi baris metadata dilakukan di sisi JS agar presisi
const META_LINE =
  /(change\s+re-?chords?|^\s*capo\b|^\s*catatan\s*:|kunci\s+gitar\b|^\s*tuning\b)/i;

/**
 * GET /api/dashboard/quality-review
 * Daftar lagu needs_review dengan baris metadata nyasar di konten.
 */
export async function GET(_request: NextRequest) {
  try {
    const rows = await db
      .select({
        id: tbChord.id,
        judul: tbChord.judul,
        penyanyi: tbChord.penyanyi,
        content: tbChord.isi_chord,
      })
      .from(tbChord)
      .where(
        and(
          eq(tbChord.review_status, "needs_review"),
          or(
            ilike(tbChord.isi_chord, "%change re%"),
            ilike(tbChord.isi_chord, "%catatan:%"),
            ilike(tbChord.isi_chord, "%kunci gitar%"),
            ilike(tbChord.isi_chord, "%tuning%")
          )
        )
      )
      .orderBy(asc(tbChord.id))
      .limit(300);

    const items = rows
      .map((r) => {
        const badLines = (r.content || "")
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => META_LINE.test(l))
          .slice(0, 3);
        return {
          id: r.id,
          judul: r.judul,
          penyanyi: r.penyanyi,
          snippet: badLines.length ? badLines.join(" | ") : null,
        };
      })
      .filter((x) => x.snippet !== null);

    return successResponse({ items, total: items.length }, "Berhasil");
  } catch (error) {
    console.error("GET /api/dashboard/quality-review error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

/**
 * PATCH /api/dashboard/quality-review
 * Body: { id: number, status: "confirmed" | "needs_review" }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body?.id);
    const status = body?.status === "confirmed" ? "confirmed" : "needs_review";
    if (!id) return errorResponse("id wajib", 400);

    await db
      .update(tbChord)
      .set({ review_status: status })
      .where(eq(tbChord.id, id));

    return successResponse({ id, status }, "Berhasil");
  } catch (error) {
    console.error("PATCH /api/dashboard/quality-review error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
