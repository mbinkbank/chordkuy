import { db } from "@/db";
import { bad, ok } from "@/lib/api-response";

export async function GET() {
  const { count: songCount, error: e1 } = await db
    .from("chords")
    .select("id", { count: "exact", head: true });
  if (e1) return bad(e1.message, 500);

  const langRes = await db.from("chords").select("language");
  if (langRes.error) return bad(langRes.error.message, 500);
  const langCount: Record<string, number> = { ID: 0, EN: 0 };
  for (const r of langRes.data || []) {
    const k = (r.language || "ID") === "EN" ? "EN" : "ID";
    langCount[k] = (langCount[k] || 0) + 1;
  }

  const artistsRes = await db.from("chords").select("artist");
  if (artistsRes.error) return bad(artistsRes.error.message, 500);
  const artistSet = new Set((artistsRes.data || []).map((r) => r.artist));

  const topRes = await db
    .from("chords")
    .select("id,title,artist,rating")
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(5);
  if (topRes.error) return bad(topRes.error.message, 500);
  const topRated = topRes.data || [];

  return ok({
    songCount: songCount ?? 0,
    artistCount: artistSet.size,
    avgRating:
      topRated.length > 0
        ? Number((topRated.reduce((a: number, r: any) => a + (Number(r.rating) || 0), 0) / topRated.length).toFixed(2))
        : null,
    languageStats: [
      { name: "Indonesia", code: "ID", count: langCount.ID },
      { name: "English", code: "EN", count: langCount.EN },
    ],
    topRated,
  });
}
