import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      success: true,
      status: "ok",
      app: "ChordKu API",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, status: "error", message: String(error) },
      { status: 500 }
    );
  }
}
