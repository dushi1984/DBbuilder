import { db } from "@/db";
import { dashboards, widgets } from "@/db/schema";
import { ensureAppSchema } from "@/db/bootstrap";
import { errorResponse } from "@/lib/errors";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await ensureAppSchema();
    const body = (await req.json().catch(() => ({}))) as { ids?: string[] };
    if (
      !Array.isArray(body.ids) ||
      body.ids.some((x) => typeof x !== "string")
    ) {
      return Response.json({ error: "ids array required" }, { status: 400 });
    }
    for (let i = 0; i < body.ids.length; i++) {
      await db
        .update(widgets)
        .set({ order: i })
        .where(eq(widgets.id, body.ids[i]));
    }
    await db
      .update(dashboards)
      .set({ updatedAt: sql`now()` })
      .where(eq(dashboards.id, id));
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
