import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ success: true, data }, { status: init ?? 200 });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
