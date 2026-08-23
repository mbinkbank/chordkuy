import { db } from "@/db";
import { ok } from "@/lib/api-response";

export async function GET() {
  const { data, error } = await db
    .from("chords")
    .select("id,title,artist,key_name,difficulty,rating")
    .order("id", { ascending: false })
    .limit(8);
  if (error) return ok({ items: [] });
  return ok({ items: data });
}
