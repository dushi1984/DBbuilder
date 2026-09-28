import { db, pool } from "@/db";
import { dashboards } from "@/db/schema";
import { ensureAppSchema } from "@/db/bootstrap";
import { errorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureAppSchema();
    const res = await pool.query(`
      SELECT d.id, d.name, d.updated_at AS "updatedAt",
             count(w.id) AS "widgetCount"
      FROM dashboards d
      LEFT JOIN widgets w ON w.dashboard_id = d.id
      GROUP BY d.id
      ORDER BY d.updated_at DESC
    `);
    const items = (res.rows as {
      id: string;
      name: string;
      updatedAt: Date | string;
      widgetCount: string;
    }[]).map((r) => ({
      id: r.id,
      name: r.name,
      updatedAt:
        r.updatedAt instanceof Date
          ? r.updatedAt.toISOString()
          : String(r.updatedAt),
      widgetCount: Number(r.widgetCount),
    }));
    return Response.json({ dashboards: items });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await ensureAppSchema();
    const body = (await req.json().catch(() => ({}))) as { name?: string };
    const name = (body.name ?? "").trim();
    if (!name) {
      return Response.json(
        { error: "Dashboard name is required" },
        { status: 400 }
      );
    }
    const [created] = await db.insert(dashboards).values({ name }).returning();
    return Response.json(
      {
        dashboard: {
          id: created.id,
          name: created.name,
          updatedAt: created.updatedAt.toISOString(),
          widgetCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
