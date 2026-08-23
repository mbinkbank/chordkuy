import { ok } from "@/lib/api-response";

export async function GET() {
  return ok({ status: "ok", time: new Date().toISOString() });
}
