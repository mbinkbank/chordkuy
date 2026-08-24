import { NextRequest } from "next/server";
import { db } from "@/db";
import { tbChord } from "@/db/schema";
import { sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  return successResponse([], "Fitur album dinonaktifkan");
}
