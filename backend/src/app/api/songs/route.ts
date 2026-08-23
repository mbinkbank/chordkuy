import { NextRequest } from "next/server";
import { db } from "@/db";
import { bad, ok } from "@/lib/api-response";

const COLS = "id,title,artist,content,key_name,capo,tuning,difficulty,rating,language";

/** GET /api/songs?q=&page=&perPage= — daftar chord ringkas + paginasi */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const perPage = Math.min(100, parseInt(sp.get("perPage") || "20", 10) || 20);
  const from = (page - 1) * perPage;

  let query = db
    .from("chords")
    .select("id,title,artist,key_name,capo,tuning,difficulty,rating,language", { count: "exact" })
    .order("id", { ascending: false })
    .range(from, from + perPage - 1);
  if (q) query = query.or(`title.ilike.%${q}%,artist.ilike.%${q}%`);

  const { data, count, error } = await query;
  if (error) return bad(error.message, 500);
  return ok({ items: data, total: count ?? 0, page, perPage });
}

/** POST /api/songs — tambah chord baru */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.artist || !body?.content) {
    return bad("title, artist, dan content wajib diisi");
  }
  const payload = {
    title: String(body.title),
    artist: String(body.artist),
    content: String(body.content),
    key_name: body.key_name || "C",
    capo: body.capo || "",
    tuning: body.tuning || "E A D G B E",
    difficulty: body.difficulty || "intermediate",
    language: body.language || "ID",
    rating: body.rating != null ? Number(body.rating) : null,
  };
  const { data, error } = await db.from("chords").insert(payload).select(COLS).single();
  if (error) return bad(error.message, 500);
  return ok(data, 201);
}
