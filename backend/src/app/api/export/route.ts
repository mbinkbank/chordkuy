import { db } from "@/db";
import { NextResponse } from "next/server";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type") || "json";
  const { data, error } = await db
    .from("chords")
    .select("id,title,artist,key_name,capo,tuning,difficulty,rating,language,content")
    .order("id", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (type === "csv") {
    const rows = (data || []).map((r: Record<string, any>) => ({
      ...r,
      content: String(r.content || "").replace(/\n/g, "\\n"),
    }));
    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="chords-${Date.now()}.csv"`,
      },
    });
  }
  return NextResponse.json(data, {
    headers: { "Content-Disposition": `attachment; filename="chords-${Date.now()}.json"` },
  });
}
