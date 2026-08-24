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
      onlineDetailsRes,
      refRes,
      countryRes,
      urlRes,
      titleRes,
      dailyRes,
      firstTimeRes,
      todayRowsRes,
    ] = await Promise.all([
      db.execute(sql`select count(*)::int as c, count(distinct visitor_id)::int as uv from pageviews`),
      db.execute(sql`select count(*)::int as pv, count(distinct visitor_id)::int as uv from pageviews where created_at >= ${todayStart.toISOString()}`),
      db.execute(sql`select count(distinct visitor_id)::int as c from pageviews where created_at >= ${fiveMinAgo.toISOString()}`),
      db.execute(sql`
        select visitor_id,
               max(created_at) as last_seen,
               (array_agg(path order by created_at desc))[1] as last_path,
               (array_agg(title order by created_at desc))[1] as last_title,
               count(*)::int as pages
        from pageviews
        where created_at >= ${fiveMinAgo.toISOString()}
        group by visitor_id
        order by last_seen desc
      `),
      db.execute(sql`select referrer as label, count(*)::int as c from pageviews where referrer <> '' group by referrer order by c desc limit 10`),

    const totalRow: any = (totalRes as any).rows?.[0] || {};
    const todayRow: any = (todayRes as any).rows?.[0] || {};
    const onlineRow: any = (onlineRes as any).rows?.[0] || {};
    const firstRow: any = (firstTimeRes as any).rows?.[0] || {};

    // hitung sesi hari ini: jeda >30 menit = kunjungan baru
    const todayRows: any[] = (todayRowsRes as any).rows || [];
    let sessions = 0;
    let totalDurationMs = 0;
    let totalPagesInSessions = 0;
    let curVisitor: string | null = null;
    let sessionStart: number | null = null;
    let lastTime: number | null = null;
    let pagesInSession = 0;

    function flushSession() {
      if (sessionStart !== null && lastTime !== null) {
        totalDurationMs += lastTime - sessionStart;
        totalPagesInSessions += pagesInSession;
        sessions++;
      }
    }

    for (const r of todayRows) {
      const vid = r.visitor_id as string;
      const t = new Date(r.created_at).getTime();
      if (vid !== curVisitor) {
        flushSession();
        curVisitor = vid;
        sessionStart = t;
        lastTime = t;
        pagesInSession = 1;
      } else if (lastTime !== null && t - lastTime > 30 * 60 * 1000) {
        flushSession();
        sessionStart = t;
        lastTime = t;
        pagesInSession = 1;
      } else {
        lastTime = t;
        pagesInSession++;
      }
    }
    flushSession();

    const avgDurationMs = sessions > 0 ? Math.round(totalDurationMs / sessions) : 0;
    const avgDuration =
      avgDurationMs === 0
        ? "0s"
        : `${Math.floor(avgDurationMs / 60000)}m ${Math.round((avgDurationMs % 60000) / 1000)}s`;
    const pagesPerVisit = sessions > 0 ? Number((totalPagesInSessions / sessions).toFixed(2)) : 0;

    return successResponse({
      totalPageViews: Number(totalRow.c || 0),
      totalVisitors: Number(totalRow.uv || 0),
      today: {
        pageViews: Number(todayRow.pv || 0),
        visitors: Number(todayRow.uv || 0),
        firstTime: Number(firstRow.c || 0),
      },
      usersOnline: Number(onlineRow.c || 0),
      onlineDetails: (onlineDetailsRes as any).rows || [],
      avgDuration,
      avgDurationMs,
      pagesPerVisit,
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
