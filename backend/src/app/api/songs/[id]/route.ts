import { NextRequest } from "next/server";
import { db } from "@/db";
import { bad, ok } from "@/lib/api-response";

const COLS = "id,title,artist,content,key_name,capo,tuning,difficulty,rating,language";

type Params = { params: Promise<{ id: string }> };

/** GET /api/songs/[id] — detail lengkap */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await db.from("chords").select(COLS).eq("id", id).single();
  if (error) return bad(error.message, 404);
  return ok(data);
}

/** PUT /api/songs/[id] — update */
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return bad("Body tidak valid");

  const payload: Record<string, unknown> = {};
  for (const k of ["title", "artist", "content", "key_name", "capo", "tuning", "difficulty", "language"]) {
    if (body[k] !== undefined) payload[k] = String(body[k]);
  }
  if (body.rating !== undefined) {
    payload.rating = body.rating === null ? null : Number(body.rating);
  }
  if (Object.keys(payload).length === 0) return bad("Tidak ada field untuk diupdate");

  const { data, error } = await db.from("chords").update(payload).eq("id", id).select(COLS).single();
  if (error) return bad(error.message, 500);
  return ok(data);
}

/** DELETE /api/songs/[id] */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { error } = await db.from("chords").delete().eq("id", id);
  if (error) return bad(error.message, 500);
  return ok({ deleted: id });
}
