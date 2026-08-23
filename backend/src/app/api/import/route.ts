import { NextRequest } from "next/server";
import Papa from "papaparse";
import { db } from "@/db";
import { bad, ok } from "@/lib/api-response";

const ALLOWED = ["title", "artist", "content", "key_name", "capo", "tuning", "difficulty", "rating", "language"];

function normalizeRow(r: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(r)) {
    const key = ALLOWED.includes(k) ? k : null;
    if (!key) continue;
    let v = r[k];
    if (key === "content" && typeof v === "string") v = v.replace(/\\n/g, "\n");
    if (key === "rating") v = v === "" || v == null ? null : Number(v);
    if (v !== undefined && v !== "") out[key] = v;
  }
  return out;
}

/** POST /api/import  body: { type: "json"|"csv", data: rows[] | csvString } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.data) return bad("Field 'data' wajib diisi");

  let rows: Record<string, unknown>[] = [];
  if (body.type === "csv") {
    const parsed = Papa.parse<Record<string, unknown>>(String(body.data), {
      header: true,
      skipEmptyLines: true,
    });
    rows = parsed.data;
  } else if (Array.isArray(body.data)) {
    rows = body.data;
  } else {
    return bad("Format tidak dikenal");
  }

  const clean = rows.map(normalizeRow).filter((r) => r.title && r.artist && r.content);
  if (clean.length === 0) return bad("Tidak ada baris valid (butuh title, artist, content)");

  const errors: string[] = [];
  let inserted = 0;
  for (let i = 0; i < clean.length; i += 100) {
    const batch = clean.slice(i, i + 100);
    const { error } = await db.from("chords").insert(batch);
    if (error) errors.push(`Batch ${i / 100 + 1}: ${error.message}`);
    else inserted += batch.length;
  }
  return ok({ inserted, failed: clean.length - inserted, errors });
}
