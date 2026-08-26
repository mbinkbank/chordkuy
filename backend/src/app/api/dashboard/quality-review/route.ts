import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { sql, and, eq } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * GET /api/dashboard/quality-review
 * Daftar lagu ber-status needs_review yang kontennya mengandung baris
 * metadata nyasar (Change re-chords / Catatan: / Capo di tengah isi / dll).
 */
export async function GET(_request: NextRequest) {
  try {
    const rows = await db
      .select({
        id: tbChord.id,
        judul: tbChord.judul,
        penyanyi: tbChord.penyanyi,
        snippet: sql<string>`(
          SELECT string_agg(line, ' | ') FROM (
            SELECT btrim(x.line) AS line
            FROM unnest(string_to_array(${tbChord.isi_chord}, E'\n')) AS x(line)
            WHERE x.line ~* '(change\s+re-?chords?|^\s*capo\b|^\s*catatan\s*:|kunci\s+gitar\b|^tuning\b)'
            LIMIT 3
          ) t
        )`,
      })
      .from(tbChord)
      .where(
        and(
          eq(tbChord.review_status, "needs_review"),
          sql`${tbChord.isi_chord} ~* '(change\s+re-?chords?|^\s*capo\b|^\s*catatan\s*:|kunci\s+gitar\b|^tuning\b)'`
        )
      )
      .orderBy(sql`${tbChord.id} ASC`)
      .limit(200);

    return successResponse({ items: rows, total: rows.length }, "Berhasil");
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
