import { NextResponse } from "next/server";

export function successResponse(data: unknown, message = "Berhasil", status = 200) {
  return NextResponse.json(
    { success: true, data, message },
    { status }
  );
}

export function errorResponse(message: string, status = 400, data: unknown = null) {
  return NextResponse.json(
    { success: false, data, message },
    { status }
  );
}

export function paginatedResponse(
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  message = "Berhasil"
) {
  return NextResponse.json({
    success: true,
    data,
    message,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
