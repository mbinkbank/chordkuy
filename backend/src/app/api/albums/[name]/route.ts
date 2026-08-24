import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { format } from "date-fns";

type Params = { params: Promise<{ name: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { name } = await params;
    const albumName = decodeURIComponent(name);
    // Fitur album dinonaktifkan - kolom album dihapus sesuai permintaan
    return successResponse({ album: albumName, album_image: "", song_count: 0, songs: [] }, "Berhasil");
  } catch (error) {
    console.error("GET /api/albums/[name] error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const authUser = await requireAuth(request);
    if (!authUser) return errorResponse("Tidak terautentikasi", 401);
    return errorResponse("Fitur album dinonaktifkan", 400);
  } catch (error) {
    console.error("PUT /api/albums/[name] error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const authUser = await requireAuth(request);
    if (!authUser) return errorResponse("Tidak terautentikasi", 401);
    return errorResponse("Fitur album dinonaktifkan", 400);
  } catch (error) {
    console.error("DELETE /api/albums/[name] error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
