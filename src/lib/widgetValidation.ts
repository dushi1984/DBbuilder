import { assertSelect, runQuery } from "@/lib/sql";
import { describeError } from "@/lib/errors";
import { SPANS, WIDGET_TYPES, type WidgetType } from "@/lib/types";

export interface WidgetInput {
  dashboardId?: string;
  name?: string;
  sql?: string;
  type?: string;
  span?: number;
}

export interface ValidatedWidget {
  name: string;
  sql: string;
  type: WidgetType;
  span: number;
}

/** Validates widget fields and test-runs its SQL (must be a single SELECT). */
export async function validateWidget(
  body: WidgetInput
): Promise<{ error: string } | { value: ValidatedWidget }> {
  const name = (body.name ?? "").trim();
  if (!name) return { error: "Widget name is required" };
  if (typeof body.sql !== "string" || !body.sql.trim())
    return { error: "SQL command is required" };
  const type = (body.type ?? "bar") as WidgetType;
  if (!WIDGET_TYPES.some((t) => t.value === type))
    return { error: "Unknown widget type" };
  const span = body.span ?? 6;
  if (!SPANS.some((s) => s.value === span))
    return { error: "Invalid widget width" };

  try {
    await runQuery(assertSelect(body.sql));
  } catch (e) {
    return { error: describeError(e) };
  }

  return { value: { name, sql: body.sql, type, span } };
}
