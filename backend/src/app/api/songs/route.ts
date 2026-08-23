import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { eq, ilike, or, and, sql, count, asc, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { format } from "date-fns";

const SORT_COLUMNS: Record<string, any> = {
  judul: tbChord.judul,
  penyanyi: tbChord.penyanyi,
  base_key: tbChord.base_key,
  album: tbChord.album,
  language: tbChord.language,
  youtube_url: tbChord.youtube_url,
  lastmod: tbChord.lastmod,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const language = searchParams.get("language") || "";
    const songtype = searchParams.get("songtype") || "";
    const album = searchParams.get("album") || "";
    const baseKey = searchParams.get("base_key") || "";
    const hasYoutube = searchParams.get("has_youtube") || "";
    const sortBy = searchParams.get("sort_by") || "lastmod";
    const sortDir = searchParams.get("sort_dir") || "desc";
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(tbChord.judul, `%${search}%`),
          ilike(tbChord.penyanyi, `%${search}%`),
          ilike(tbChord.songwriter, `%${search}%`)
        )
      );
    }
    if (language) conditions.push(eq(tbChord.language, language));
    if (songtype) conditions.push(eq(tbChord.songtype, songtype));
    if (album) conditions.push(ilike(tbChord.album, `%${album}%`));
    if (baseKey) conditions.push(eq(tbChord.base_key, baseKey));
    if (hasYoutube === "yes") conditions.push(sql`${tbChord.youtube_url} != ''`);
    if (hasYoutube === "no") conditions.push(sql`${tbChord.youtube_url} = ''`);

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const sortCol = SORT_COLUMNS[sortBy] || tbChord.lastmod;
    const orderFn = sortDir === "asc" ? asc : desc;

    const [totalResult, rows] = await Promise.all([
      db.select({ count: count() }).from(tbChord).where(where),
      db
        .select()
        .from(tbChord)
        .where(where)
        .orderBy(orderFn(sortCol))
        .limit(limit)
        .offset(offset),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return paginatedResponse(rows, Number(total), page, limit);
  } catch (error) {
    console.error("GET /api/songs error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    if (!authUser) return errorResponse("Tidak terautentikasi", 401);

    const body = await request.json();
    const {
      judul,
      penyanyi,
      base_key = "",
      album = "",
      album_image = "",
      isi_chord = "",
      language = "",
      youtube_url = "",
      songwriter = "",
      year = "",
      songtype = "",
    } = body;

    if (!judul || !penyanyi) {
      return errorResponse("Judul dan penyanyi wajib diisi", 400);
    }

    // Check duplicate
    const existing = await db
      .select({ judul: tbChord.judul })
      .from(tbChord)
      .where(and(eq(tbChord.judul, judul), eq(tbChord.penyanyi, penyanyi)))
      .limit(1);

    if (existing.length > 0) {
      return errorResponse(
        `Lagu "${judul}" oleh "${penyanyi}" sudah ada`,
        409
      );
    }

    const lastmod = format(new Date(), "yyyy-MM-dd HH:mm:ss");

    const [created] = await db
      .insert(tbChord)
      .values({
        judul,
        penyanyi,
        base_key,
        album,
        album_image,
        lastmod,
        isi_chord,
        language,
        youtube_url,
        songwriter,
        year,
        songtype,
      })
      .returning();

    return successResponse(created, "Lagu berhasil ditambahkan", 201);
  } catch (error) {
    console.error("POST /api/songs error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
