import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { ilike } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

type Params = { params: Promise<{ name: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  return errorResponse("Fitur album dinonaktifkan", 400);
}
