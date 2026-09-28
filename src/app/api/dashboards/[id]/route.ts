import { db } from "@/db";
import { dashboards, widgets } from "@/db/schema";
import { ensureAppSchema } from "@/db/bootstrap";
import { errorResponse } from "@/lib/errors";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toISO(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function notFound() {
  return Response.json({ error: "Dashboard not found" }, { status: 404 });
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) return notFound();
    await ensureAppSchema();
    const rows = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, id));
    if (rows.length === 0) return notFound();
    const ws = await db
      .select()
      .from(widgets)
      .where(eq(widgets.dashboardId, id))
      .orderBy(widgets.order);
    return Response.json({
      dashboard: {
        id: rows[0].id,
        name: rows[0].name,
        updatedAt: toISO(rows[0].updatedAt),
      },
      widgets: ws,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) return notFound();
    await ensureAppSchema();
    const body = (await req.json().catch(() => ({}))) as { name?: string };
    const name = (body.name ?? "").trim();
    if (!name) {
      return Response.json(
        { error: "Dashboard name is required" },
        { status: 400 }
      );
    }
    const rows = await db
      .update(dashboards)
      .set({ name, updatedAt: sql`now()` })
      .where(eq(dashboards.id, id))
      .returning();
    if (rows.length === 0) return notFound();
    return Response.json({ name: rows[0].name });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) return notFound();
    await ensureAppSchema();
    const rows = await db
      .delete(dashboards)
      .where(eq(dashboards.id, id))
      .returning({ id: dashboards.id });
    if (rows.length === 0) return notFound();
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
