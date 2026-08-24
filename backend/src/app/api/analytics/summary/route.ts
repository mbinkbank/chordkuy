import { NextRequest } from "next/server";
import { db } from "@/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sql } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    // cek apakah tabel pageviews ada
    const ok = await db.execute(sql`select 1 from pageviews limit 1`).then(() => true).catch(() => false);
    if (!ok) {
      return successResponse({
        totalPageViews: 0,
        totalVisitors: 0,
        today: { pageViews: 0, visitors: 0, firstTime: 0 },
        usersOnline: 0,
        referrers: [],
        countries: [],
        topUrls: [],
        topTitles: [],
        daily: [],
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [
      totalRes,
      todayRes,
      onlineRes,
      refRes,
      countryRes,
      urlRes,
      titleRes,
      dailyRes,
      firstTimeRes,
    ] = await Promise.all([
      db.execute(sql`select count(*)::int as c, count(distinct visitor_id)::int as uv from pageviews`),
      db.execute(sql`select count(*)::int as pv, count(distinct visitor_id)::int as uv from pageviews where created_at >= ${todayStart.toISOString()}`),
      db.execute(sql`select count(distinct visitor_id)::int as c from pageviews where created_at >= ${fiveMinAgo.toISOString()}`),
      db.execute(sql`select referrer as label, count(*)::int as c from pageviews where referrer <> '' group by referrer order by c desc limit 10`),
      db.execute(sql`select country as label, count(*)::int as c from pageviews where country <> '' group by country order by c desc limit 10`),
      db.execute(sql`select path as label, count(*)::int as c from pageviews group by path order by c desc limit 10`),
      db.execute(sql`select title as label, count(*)::int as c from pageviews where title <> '' group by title order by c desc limit 10`),
      db.execute(sql`select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as d, count(*)::int as pv, count(distinct visitor_id)::int as uv from pageviews where created_at >= now() - interval '30 days' group by d order by d`),
      db.execute(sql`
        with first_seen as (select visitor_id, min(created_at)::date as d from pageviews group by visitor_id)
        select count(*)::int as c from first_seen where d = current_date
      `),
    ]);

    const totalRow: any = (totalRes as any).rows?.[0] || {};
    const todayRow: any = (todayRes as any).rows?.[0] || {};
    const onlineRow: any = (onlineRes as any).rows?.[0] || {};
    const firstRow: any = (firstTimeRes as any).rows?.[0] || {};

    return successResponse({
      totalPageViews: Number(totalRow.c || 0),
      totalVisitors: Number(totalRow.uv || 0),
      today: {
        pageViews: Number(todayRow.pv || 0),
        visitors: Number(todayRow.uv || 0),
        firstTime: Number(firstRow.c || 0),
      },
      usersOnline: Number(onlineRow.c || 0),
      referrers: (refRes as any).rows || [],
      countries: (countryRes as any).rows || [],
      topUrls: (urlRes as any).rows || [],
      topTitles: (titleRes as any).rows || [],
      daily: (dailyRes as any).rows || [],
    });
  } catch (e: any) {
    console.error("analytics summary error:", e);
    return errorResponse(e.message || "Gagal memuat statistik", 500);
  }
}
